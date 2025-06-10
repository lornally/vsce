import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let outputChannel: vscode.OutputChannel;
let odog: (msg: string) => void;


export function activate(context: vscode.ExtensionContext) {
    // 创建输出通道
    outputChannel = vscode.window.createOutputChannel('贱狗');
    context.subscriptions.push(outputChannel);

    odog = (msg: string) => {
        const time=new Date().toLocaleTimeString();
        outputChannel.appendLine(`[${time}] ${msg}`);
        console.log(`[贱狗${time}]: ${msg}`);
      };
      odog('KeyDog 插件已激活');
    // 注册自定义编辑器
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider('贱狗.编辑器', {openCustomDocument,resolveCustomEditor})
    );
    
}

export function deactivate() {}


// 平铺函数1：创建文档
async function openCustomDocument(uri: vscode.Uri): Promise<vscode.CustomDocument> {
    return {
        uri,
        dispose: () => {}
    };
}

// 平铺函数2：更新 webview 内容
function updateWebview(webviewPanel: vscode.WebviewPanel, filePath: string) {
    const content = fs.readFileSync(filePath, 'utf8');
    webviewPanel.webview.html = `<h3>YE File: ${path.basename(filePath)}</h3>
    <pre>${escapeHtml(content)}</pre>

    <p><small>Updated: ${new Date().toLocaleTimeString()}</small></p>`;
}
// HTML 转义函数
function escapeHtml(text: string): string {
return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}


  


// 平铺函数3：处理编辑器
async function resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel) {
    // 初始显示
    updateWebview(webviewPanel, document.uri.fsPath);

    // 监听保存事件
    const saveListener = vscode.workspace.onDidSaveTextDocument(doc => {
        if (doc.uri.scheme === 'ye' && doc.uri.query === document.uri.fsPath) {
            setTimeout(() => updateWebview(webviewPanel, document.uri.fsPath), 100);
        }
    });

    webviewPanel.onDidDispose(() => saveListener.dispose());
    // 直接打开我们的分栏
    odog('KeyDog 可以操作了');
}