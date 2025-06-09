const fs = require('fs');
const yaml = require('js-yaml');

// Convert package.yaml to package.json
const yamlPath = './package.yaml';
const jsonPath = './package.json';

if (fs.existsSync(yamlPath)) {
    try {
        const yamlContent = fs.readFileSync(yamlPath, 'utf8');
        const jsonContent = yaml.load(yamlContent);
        fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2), 'utf8');
        console.log('Converted package.yaml to package.json');
    } catch (error) {
        console.error('Error converting package.yaml to package.json:', error);
    }
}

const esbuild = require("esbuild");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: [
			'src/extension.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		],
	});
	if (watch) {
		await ctx.watch();
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
