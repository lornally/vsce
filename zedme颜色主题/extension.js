const vscode = require('vscode');

/**
 * 激活扩展时被调用
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('恭喜，您的扩展 "zedme" 已被激活！');

    // 注册命令，用于设置推荐字体
    let disposable = vscode.commands.registerCommand('zedme.setRecommendedFont', async function () {
        // 设置编辑器字体为 Zed Mono
        const config = vscode.workspace.getConfiguration();
        
        // 检查用户是否已安装 Zed 字体
        const result = await vscode.window.showInformationMessage(
            '是否将编辑器字体设置为 "Zed Mono"？\n请确保已安装该字体。',
            '是',
            '下载字体',
            '取消'
        );
        
        if (result === '是') {
            // 设置字体
            await config.update('editor.fontFamily', "'Zed Mono', monospace", vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('已将字体设置为 Zed Mono');
        } else if (result === '下载字体') {
            // 打开下载页面
            vscode.env.openExternal(vscode.Uri.parse('https://zed.dev/fonts'));
        }
    });

    context.subscriptions.push(disposable);
}

/**
 * 停用扩展时被调用
 */
function deactivate() {}

module.exports = {
    activate,
    deactivate
};