




###### 0610

* 手动编译成功:
```sh
npx coffee -c extension.coffee
```
* 但是f5并没自动编译
* 此时一共需要搞3个json:
1. package.json
2. .vscode/launch.json
3. .vscode/tasks.json

###### package.json
* 这里真正被调用的是compile, 也是真正定义compile的地方
```json
{
   "scripts": {
    "compile": "coffee -c *.coffee",
    "watch": "coffee -w -c *.coffee",
    "lint": "coffeelint *.coffee",
    "pretest": "pnpm run compile && pnpm run lint",
    "test": "vscode-test"
  },
  "devDependencies": {
    "@types/node": "20.x",
    "@types/vscode": "^1.100.0",
    "coffeelint": "^2.1.0",
    "coffeescript": "^2.7.0"
  }
}
```
###### .vscode/launch.json
* 核心就一句话: "preLaunchTask": "compile"
```json
{
	"version": "0.2.0",
	"configurations": [
		{
			"name": "Run Extension",
			"type": "extensionHost",
			"request": "launch",
			"args": [
				"--extensionDevelopmentPath=${workspaceFolder}"
			],
      "preLaunchTask": "compile"
		}
	]
}
```

###### .vscode/tasks.json
* 为了配合launch.json, 实际调用指向的还是package.json
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "compile",
      "type": "npm",
      "script": "compile", 
      "group": "build"
    }
  ]
}
```