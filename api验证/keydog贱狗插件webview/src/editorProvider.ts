import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { parseDocument } from './documentParser';

export function setupTreeSplitEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    webviewPanel.webview.options = { 
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview'))]
    };
    
    // 加载HTML文件
    webviewPanel.webview.html = getWebviewContent(webviewPanel.webview, context, document);
    
    // 监听webview消息
    webviewPanel.webview.onDidReceiveMessage(message => {
        if (message.type === 'update') {
            updateDocument(document, message.left, message.right);
        }
    });
    
    // 监听文档变化
    const changeSubscription = vscode.workspace.onDidChangeTextDocument(e => {
        if (e.document.uri.toString() === document.uri.toString()) {
            updateWebviewContent(document, webviewPanel);
        }
    });
    
    webviewPanel.onDidDispose(() => {
        changeSubscription.dispose();
    });
}

function getWebviewContent(webview: vscode.Webview, context: vscode.ExtensionContext, document: vscode.TextDocument) {
    const webviewPath = path.join(context.extensionPath, 'src', 'webview');
    const htmlPath = path.join(webviewPath, 'editor.html');
    const cssUri = webview.asWebviewUri(vscode.Uri.file(path.join(webviewPath, 'editor.css')));
    const jsUri = webview.asWebviewUri(vscode.Uri.file(path.join(webviewPath, 'editor.js')));
    
    // 解析文档内容
    const { leftContent, rightContent } = parseDocument(document.getText());
    
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.replace('editor.css', cssUri.toString());
    html = html.replace('editor.js', jsUri.toString());
    
    // 注入初始内容
    html = html.replace('placeholder="左子树内容"', `placeholder="左子树内容">${escapeHtml(leftContent)}`);
    html = html.replace('placeholder="右子树内容"', `placeholder="右子树内容">${escapeHtml(rightContent)}`);
    
    return html;
}

function updateWebviewContent(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
    const { leftContent, rightContent } = parseDocument(document.getText());
    webviewPanel.webview.postMessage({
        type: 'setContent',
        left: leftContent,
        right: rightContent
    });
}

function updateDocument(document: vscode.TextDocument, leftContent: string, rightContent: string) {
    const { header } = parseDocument(document.getText());
    const newContent = [
        header,
        '## -----右------',
        rightContent,
        '## -----左-----',
        leftContent
    ].join('\n\n');
    
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), newContent);
    vscode.workspace.applyEdit(edit);
}

function escapeHtml(unsafe: string) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
