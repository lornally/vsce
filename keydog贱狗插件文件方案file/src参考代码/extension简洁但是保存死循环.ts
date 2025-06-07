import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';  // ✅ 正确：导入 path 模块
import * as os from 'os';      // ✅ 正确：导入 os 模块// 声明输出通道引用（不初始化）
let outputChannel: vscode.OutputChannel;
// 声明日志函数（延迟初始化）
let odog: (msg: string) => void;
const marker= '# -----昭-----';



export function activate(context: vscode.ExtensionContext) {
   // 创建全局输出通道
    outputChannel = vscode.window.createOutputChannel('KeyDog Debug');
    outputChannel.show(true); // true参数强制聚焦到输出面板
    context.subscriptions.push(outputChannel); // 关键：注册到上下文
    odog = (msg: string) => {
      outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${msg}`);
      console.log(`[KeyDog] ${msg}`);
    };
  
    odog('KeyDog 插件已激活');
        // 注册文件打开拦截器  
  
  vscode.workspace.onDidOpenTextDocument(doc => {
        if (doc.languageId === 'ye' && !doc.isUntitled) {
            processYeFile(doc);
        }
    });
}

async function processYeFile(originalDoc: vscode.TextDocument) {
    // 解析内容
    const content = originalDoc.getText();
    const markerIndex = content.indexOf('# -----昭-----');
    const right = markerIndex === -1 ? content : content.substring(0, markerIndex);
    const left = markerIndex === -1 ? '' : content.substring(markerIndex + 14); // 14是标记长度
    
    // 创建临时文件
    const tempDir = os.tmpdir();
    const leftPath = path.join(tempDir, `ye_left_${Date.now()}.md`);
    const rightPath = path.join(tempDir, `ye_right_${Date.now()}.md`);
    fs.writeFileSync(leftPath, left);
    fs.writeFileSync(rightPath, right);
    
    // 关闭原始文件
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    
    // 分栏打开临时文件
    await openEditor(leftPath, vscode.ViewColumn.One);
    await openEditor(rightPath, vscode.ViewColumn.Two);
    
    // 设置自动保存
    setupAutoSave(originalDoc.uri, leftPath, rightPath);
}

async function openEditor(filePath: string, viewColumn: vscode.ViewColumn) {
    const uri = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri), { viewColumn });
}

function setupAutoSave(originalUri: vscode.Uri, leftPath: string, rightPath: string) {
    const save = () => {
        try {
            const left = fs.readFileSync(leftPath, 'utf8');
            const right = fs.readFileSync(rightPath, 'utf8');
            const newContent = left ? `${right}\n# -----昭-----\n${left}` : right;
            const currentContent = fs.existsSync(originalUri.fsPath) ? 
                fs.readFileSync(originalUri.fsPath, 'utf8') : '';
            // ❌ 不要直接写文件，这会触发 VS Code 监听器
            // fs.writeFileSync(originalUri.fsPath, newContent);
            if (newContent == currentContent) return; // 如果内容没有变化，则不保存
            // ✅ 使用 VS Code API，并标记为程序修改
            const edit = new vscode.WorkspaceEdit();
            edit.replace(originalUri, new vscode.Range(0, 0, Number.MAX_VALUE, 0), newContent);
            vscode.workspace.applyEdit(edit);
        } catch (error) {
            console.warn('自动保存失败:', error);
        }
    };
    
    // 使用 VS Code 的文件保存事件（更可靠）
    const saveDisposable = vscode.workspace.onDidSaveTextDocument(doc => {
        if (doc.uri.fsPath === leftPath || doc.uri.fsPath === rightPath) save();
    });
    
    // 清理资源
    vscode.workspace.onDidCloseTextDocument(doc => {
        if (doc.uri.fsPath === leftPath || doc.uri.fsPath === rightPath) {
            saveDisposable.dispose();
            handleClose(originalUri, leftPath, rightPath);
        }
    });
}

async function handleClose(originalUri: vscode.Uri, leftPath: string, rightPath: string) {
    // 关闭编辑器
    await closeEditor(leftPath);
    await closeEditor(rightPath);
    
    // 删除文件
    try {
        fs.unlinkSync(leftPath);
        fs.unlinkSync(rightPath);
    } catch {}
    
    // 可选：重新打开原始文件
    await vscode.window.showTextDocument(originalUri);
}

async function closeEditor(filePath: string) {
    const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === filePath);
    if (editor) {
        await vscode.window.showTextDocument(editor.document.uri, {
            viewColumn: editor.viewColumn,
            preserveFocus: false
        });
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    }
}