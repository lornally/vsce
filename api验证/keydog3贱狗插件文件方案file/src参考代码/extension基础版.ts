import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// 全局状态
let outputChannel: vscode.OutputChannel;
let odog: (msg: string) => void;
const marker = '# -----昭-----';
let isProcessing = false; // 防止重入
const activeSessions = new Map<string, { leftPath: string; rightPath: string; originalUri: vscode.Uri }>();

export function activate(context: vscode.ExtensionContext) {
    // 创建输出通道
    outputChannel = vscode.window.createOutputChannel('KeyDog Debug');
    context.subscriptions.push(outputChannel);
    odog = (msg: string) => {
        outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${msg}`);
        console.log(`[KeyDog] ${msg}`);
    };
    odog('KeyDog 插件已激活');

    // 注册文件打开拦截器
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(async doc => {
            if (isProcessing) return;
            if (doc.languageId === 'ye' && !doc.isUntitled) {
                isProcessing = true;
                try {
                    await processYeFile(doc);
                } finally {
                    isProcessing = false;
                }
            }
        })
    );
}

async function processYeFile(originalDoc: vscode.TextDocument) {
    odog(`处理文件: ${originalDoc.uri.fsPath}`);
    
    // 解析内容
    const content = originalDoc.getText();
    const markerIndex = content.indexOf(marker);
    const right = markerIndex === -1 ? content : content.substring(0, markerIndex);
    const left = markerIndex === -1 ? '' : content.substring(markerIndex + marker.length);
    
    // 创建临时文件
    const tempDir = os.tmpdir();
    const timeId = new Date().toLocaleString('zh-CN', {
    day: '2-digit',
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false
}).replace(' ', ''); // 去掉所有非数字字符
    const sessionId = `${timeId}.${Math.random().toString(36).slice(2, 5)}`;
    // 获取原始文件名（不含路径）
    const originalFileName = path.basename(originalDoc.uri.fsPath);

    const leftPath = path.join(tempDir, `${originalFileName}.昭${sessionId}.md`);
    const rightPath = path.join(tempDir, `ye_right_${sessionId}.md`);
    
    fs.writeFileSync(leftPath, left);
    fs.writeFileSync(rightPath, right);
    odog(`创建临时文件: ${leftPath}, ${rightPath}`);
    
    // 保存会话信息
    activeSessions.set(sessionId, {
        leftPath,
        rightPath,
        originalUri: originalDoc.uri
    });
    
    // 关闭原始文件
    await closeEditor(originalDoc.uri);
    odog(`已关闭原始文件`);
    
    // 分栏打开临时文件
    await openEditor(leftPath, vscode.ViewColumn.One);
    await openEditor(rightPath, vscode.ViewColumn.Two);
    odog(`已打开临时文件分栏`);
    
    // 设置关闭监听（不设置自动保存）
    setupCloseHandler(sessionId);
}

async function openEditor(filePath: string, viewColumn: vscode.ViewColumn) {
    try {
        const uri = vscode.Uri.file(filePath);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { viewColumn });
        odog(`打开编辑器: ${filePath}`);
    } catch (error) {
        odog(`打开编辑器失败: ${filePath} - ${error}`);
    }
}

function setupCloseHandler(sessionId: string) {
    const session = activeSessions.get(sessionId);
    if (!session) return;
    
    const closeDisposable = vscode.workspace.onDidCloseTextDocument(async doc => {
        if (doc.uri.fsPath === session.leftPath || doc.uri.fsPath === session.rightPath) {
            odog(`检测到文件关闭: ${doc.uri.fsPath}`);
            
            // 立即移除监听器防止重复处理
            closeDisposable.dispose();
            
            // 关闭另一个文件
            const otherPath = doc.uri.fsPath === session.leftPath ? session.rightPath : session.leftPath;
            await closeEditor(vscode.Uri.file(otherPath));
            
            // 保存原始文件（一次性操作）
            saveOriginalFile(session);
            
            // 删除临时文件
            try {
                if (fs.existsSync(session.leftPath)) fs.unlinkSync(session.leftPath);
                if (fs.existsSync(session.rightPath)) fs.unlinkSync(session.rightPath);
                odog(`已删除临时文件`);
            } catch (error) {
                odog(`删除临时文件失败: ${error}`);
            }
            
            // 清理会话
            activeSessions.delete(sessionId);
            
            // 可选：重新打开原始文件
            try {
                await vscode.window.showTextDocument(session.originalUri);
                odog(`已重新打开原始文件`);
            } catch (error) {
                odog(`重新打开原始文件失败: ${error}`);
            }
        }
    });
}

function saveOriginalFile(session: { leftPath: string; rightPath: string; originalUri: vscode.Uri }) {
    try {
        const left = fs.existsSync(session.leftPath) ? fs.readFileSync(session.leftPath, 'utf8') : '';
        const right = fs.existsSync(session.rightPath) ? fs.readFileSync(session.rightPath, 'utf8') : '';
        
        // 合并内容
        const newContent = left ? `${right}\n${marker}\n${left}` : right;
        
        // 写入原始文件
        fs.writeFileSync(session.originalUri.fsPath, newContent);
        odog(`已保存原始文件`);
    } catch (error) {
        odog(`保存原始文件失败: ${error}`);
    }
}

async function closeEditor(uri: vscode.Uri) {
    const editor = vscode.window.visibleTextEditors.find(
        e => e.document.uri.toString() === uri.toString()
    );
    
    if (editor) {
        try {
            // 使用API直接关闭编辑器
            await vscode.window.showTextDocument(editor.document.uri, {
                viewColumn: editor.viewColumn,
                preserveFocus: false
            });
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            odog(`已关闭编辑器: ${uri.fsPath}`);
        } catch (error) {
            odog(`关闭编辑器失败: ${uri.fsPath} - ${error}`);
        }
    }
}