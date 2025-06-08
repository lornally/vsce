// 测试编译更新 - 2025年6月7日
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// 调试通道
let outputChannel: vscode.OutputChannel;
let odog: (msg: string) => void;

const marker = '# -----昭-----';
const activeFiles = new Map<string, { leftPath: string; rightPath: string }>();

export function activate(context: vscode.ExtensionContext) {
    // 创建输出通道
    outputChannel = vscode.window.createOutputChannel('KeyDog Debug');
    context.subscriptions.push(outputChannel);
    odog = (msg: string) => {
        outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${msg}`);
        console.log(`[KeyDog] ${msg}`);
    };
    odog('KeyDog 插件已激活');

    // 文件打开拦截器
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(async doc => {
            if (doc.languageId === 'ye' && !doc.isUntitled) {
                await processYeFile(doc);
            }
        })
    );
}

async function processYeFile(doc: vscode.TextDocument) {
    const fileId = doc.uri.fsPath;
    const fileName = path.basename(fileId);
    odog(`处理文件: ${fileName}`);
    
    // 检查是否已在处理中
    if (activeFiles.has(fileId)) {
        odog(`文件已在编辑中: ${fileName}`);
        vscode.window.showWarningMessage(`文件已在编辑中: ${fileName}`);
        await closeEditor(doc.uri); // 关闭重复打开的文件
        return;
    }
    
    try {
        // 解析内容
        const content = doc.getText();
        const markerIndex = content.indexOf(marker);
        const right = markerIndex === -1 ? content : content.substring(0, markerIndex);
        const left = markerIndex === -1 ? '' : content.substring(markerIndex + marker.length);
        
        // 创建临时文件
        const tempDir = os.tmpdir();
        const leftPath = path.join(tempDir, `${fileName}_left.md`);
        const rightPath = path.join(tempDir, `${fileName}_right.md`);
        
        fs.writeFileSync(leftPath, left);
        fs.writeFileSync(rightPath, right);
        odog(`创建临时文件: ${path.basename(leftPath)}, ${path.basename(rightPath)}`);
        
        // 记录活动文件
        activeFiles.set(fileId, { leftPath, rightPath });
        
        // 关闭原始文件
        await closeEditor(doc.uri);
        odog(`已关闭原始文件`);
        
        // 分栏打开临时文件
        await openEditor(leftPath, vscode.ViewColumn.One);
        await openEditor(rightPath, vscode.ViewColumn.Two);
        odog(`已打开临时文件分栏`);
        
        // 设置关闭监听
        setupCloseHandler(fileId);
    } catch (error) {
        odog(`处理文件失败: ${fileName} - ${error}`);
        vscode.window.showErrorMessage(`处理文件失败: ${error}`);
    }
}

async function openEditor(filePath: string, viewColumn: vscode.ViewColumn) {
    try {
        const uri = vscode.Uri.file(filePath);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { viewColumn });
        odog(`打开编辑器: ${path.basename(filePath)}`);
    } catch (error) {
        odog(`打开编辑器失败: ${path.basename(filePath)} - ${error}`);
    }
}

async function closeEditor(uri: vscode.Uri) {
    const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === uri.toString());
    if (editor) {
        try {
            // 直接关闭编辑器
            await vscode.window.showTextDocument(editor.document, {
                viewColumn: editor.viewColumn,
                preserveFocus: false
            });
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            odog(`已关闭编辑器: ${path.basename(uri.fsPath)}`);
        } catch (error) {
            odog(`关闭编辑器失败: ${path.basename(uri.fsPath)} - ${error}`);
        }
    } else {
        odog(`编辑器未找到: ${path.basename(uri.fsPath)}`);
    }
}

function setupCloseHandler(fileId: string) {
    const session = activeFiles.get(fileId);
    if (!session) return;
    
    // 单次关闭监听器
    const closeDisposable = vscode.workspace.onDidCloseTextDocument(async doc => {
        if (doc.uri.fsPath === session.leftPath || doc.uri.fsPath === session.rightPath) {
            try {
                odog(`检测到文件关闭: ${path.basename(doc.uri.fsPath)}`);
                
                // 立即移除监听器防止重复处理
                closeDisposable.dispose();
                
                // 关闭另一个文件
                const otherPath = doc.uri.fsPath === session.leftPath ? session.rightPath : session.leftPath;
                odog(`尝试关闭另一文件: ${path.basename(otherPath)}`);
                await closeEditor(vscode.Uri.file(otherPath));
                
                // 保存原始文件（一次性操作）
                saveOriginalFile(fileId, session);
                
                // 删除临时文件
                try {
                    fs.unlinkSync(session.leftPath);
                    fs.unlinkSync(session.rightPath);
                    odog(`已删除临时文件`);
                } catch (error) {
                    odog(`删除临时文件失败: ${error}`);
                }
                
                // 清理会话
                activeFiles.delete(fileId);
                odog(`会话清理完成`);
            } catch (error) {
                odog(`关闭处理失败: ${error}`);
            }
        }
    });
}

function saveOriginalFile(fileId: string, session: { leftPath: string; rightPath: string }) {
    try {
        const left = fs.readFileSync(session.leftPath, 'utf8');
        const right = fs.readFileSync(session.rightPath, 'utf8');
        const newContent = left ? `${right}\n${marker}\n${left}` : right;
        
        fs.writeFileSync(fileId, newContent);
        odog(`已保存原始文件: ${path.basename(fileId)}`);
    } catch (error) {
        odog(`保存原始文件失败: ${error}`);
        vscode.window.showErrorMessage(`保存失败: ${error}`);
    }
}
