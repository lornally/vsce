import * as vscode from 'vscode';
import * as path from 'path';

let outputChannel: vscode.OutputChannel;
let odog: (msg: string) => void;

// 您的内容处理函数（占位）
function getLeftContent(originalPath: string): string {
    // 您的实现：从原始 .ye 文件中提取左侧内容
    return '';
}

function getRightContent(originalPath: string): string {
    // 您的实现：从原始 .ye 文件中提取右侧内容
    return '';
}

function saveToOriginal(originalPath: string, leftContent: string, rightContent: string): void {
    // 您的实现：将左右内容合并保存回原始 .ye 文件
}

export function activate(context: vscode.ExtensionContext) {
    // 创建输出通道
    outputChannel = vscode.window.createOutputChannel('KeyDog Debug');
    context.subscriptions.push(outputChannel);
    odog = (msg: string) => {
        outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${msg}`);
    };
    odog('KeyDog 插件已激活');

    // 【核心1】注册虚拟文件协议 ye://
    // 这是关键：当 VSCode 需要显示 ye:// 开头的文件时，会调用这个函数获取内容
    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider('ye', {
            // 当 VSCode 打开 ye:// 协议的文件时，这个函数会被调用
            // 比如：打开 ye:left/filename?/path/to/original.ye 时
            provideTextDocumentContent(uri: vscode.Uri): string {
                // uri.query 包含原始文件路径（问号后面的部分）
                // 例如：ye:left/filename?/path/to/original.ye 中的 /path/to/original.ye
                const originalPath = uri.query;
                
                // uri.path 包含虚拟文件名（协议后面，问号前面的部分）
                // 例如：ye:left/filename?... 中的 left/filename
                // 通过检查路径中是否包含 'left' 来判断要返回哪一侧的内容
                const isLeft = uri.path.includes('left');
                
                // 根据是左侧还是右侧，调用对应的函数获取内容
                // 这里就是把原始 .ye 文件的内容分割成两部分返回
                return isLeft ? getLeftContent(originalPath) : getRightContent(originalPath);
            }
        })
    );

    // 【核心2】拦截 .ye 文件打开事件
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(async doc => {
            // 只处理真实的 .ye 文件（不是虚拟的 ye:// 协议文件）
            if (doc.uri.scheme === 'file' && doc.uri.path.endsWith('.ye') && !doc.isUntitled) {
                odog(`拦截 .ye 文件: ${path.basename(doc.uri.path)}`);
                
                // 延迟执行，确保文件已经打开
                setTimeout(async () => {
                    // 关闭刚刚打开的原始 .ye 文件
                    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    
                    // 【核心3】创建虚拟文件并分栏显示
                    const fileName = path.basename(doc.uri.path, '.ye');
                    const originalPath = doc.uri.fsPath; // 原始文件的完整路径
                    
                    // 构造两个虚拟文件的 URI
                    // ye:left/filename?原始文件路径 = 左侧虚拟文件
                    // ye:right/filename?原始文件路径 = 右侧虚拟文件
                    const leftUri = vscode.Uri.parse(`ye:left/${fileName}?${originalPath}`);
                    const rightUri = vscode.Uri.parse(`ye:right/${fileName}?${originalPath}`);
                    
                    // VSCode 会调用上面的 provideTextDocumentContent 来获取这些虚拟文件的内容
                    const leftDoc = await vscode.workspace.openTextDocument(leftUri);
                    const rightDoc = await vscode.workspace.openTextDocument(rightUri);
                    
                    // 分栏显示：左侧显示左文件，右侧显示右文件
                    await vscode.window.showTextDocument(leftDoc, { viewColumn: vscode.ViewColumn.One });
                    await vscode.window.showTextDocument(rightDoc, { viewColumn: vscode.ViewColumn.Two });
                    
                    odog(`已打开分栏: ${fileName}`);
                }, 100);
            }
        })
    );

    // 【核心4】监听虚拟文件保存事件
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(doc => {
            // 只处理我们的虚拟文件（ye:// 协议）
            if (doc.uri.scheme === 'ye') {
                const originalPath = doc.uri.query; // 从 URI 中提取原始文件路径
                const isLeft = doc.uri.path.includes('left'); // 判断是左侧还是右侧文件被保存
                const newContent = doc.getText(); // 获取用户编辑后的内容
                
                // 获取另一侧文件的内容（如果已打开）
                const otherSide = isLeft ? 'right' : 'left';
                const otherUri = vscode.Uri.parse(doc.uri.toString().replace(isLeft ? 'left' : 'right', otherSide));
                const otherDoc = vscode.workspace.textDocuments.find(d => d.uri.toString() === otherUri.toString());
                
                // 如果另一侧文件也在编辑中，用其当前内容；否则从原文件重新读取
                const otherContent = otherDoc ? otherDoc.getText() : (isLeft ? getRightContent(originalPath) : getLeftContent(originalPath));
                
                // 合并左右内容并保存回原始文件
                const leftContent = isLeft ? newContent : otherContent;
                const rightContent = isLeft ? otherContent : newContent;
                saveToOriginal(originalPath, leftContent, rightContent);
                
                odog(`已保存: ${path.basename(originalPath)}`);
            }
        })
    );
}

export function deactivate() {}
