import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';


// 声明输出通道引用（不初始化）
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
    vscode.workspace.onDidOpenTextDocument(async doc => {
        if (doc.languageId === 'ye' && !doc.isUntitled) {
            handleYeFile(doc);
        }
    });


  
}

async function handleYeFile(originalDoc: vscode.TextDocument) {
    // 1. 解析内容
    const content = originalDoc.getText();
    const markerIndex = content.indexOf(marker);
    
    // 2. 创建临时文件
    const tempDir = path.dirname(originalDoc.uri.fsPath);
    const leftPath = path.join(tempDir, `${Date.now()}_left.md`);
    const rightPath = path.join(tempDir, `${Date.now()}_right.md`);
    
    // 3. 写入内容（简化解析）
    const rightContent = markerIndex === -1 ? content : content.substring(0, markerIndex);
    const leftContent = markerIndex === -1 ? '' : content.substring(markerIndex + marker.length);
    
    fs.writeFileSync(leftPath, leftContent);
    fs.writeFileSync(rightPath, rightContent);
    
    // 4. 关闭原始文件
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    
    // 5. 打开临时文件（分栏）
    const leftUri = vscode.Uri.file(leftPath);
    const rightUri = vscode.Uri.file(rightPath);
    
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(leftUri), {
        viewColumn: vscode.ViewColumn.One
    });
    
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(rightUri), {
        viewColumn: vscode.ViewColumn.Two
    });
    
    // 6. 设置保存监听（简化）
    setupSaveHandler(originalDoc.uri, leftPath, rightPath);
}

function setupSaveHandler(originalUri: vscode.Uri, leftPath: string, rightPath: string) {
    const save = () => {
        try {
            // 读取临时文件内容
            const leftContent = fs.readFileSync(leftPath, 'utf8');
            const rightContent = fs.readFileSync(rightPath, 'utf8');
            
            // 合并内容
            const newContent = leftContent 
                ? `${rightContent}\n${marker}\n${leftContent}` 
                : rightContent;
            
            // 写入原始文件
            fs.writeFileSync(originalUri.fsPath, newContent);
        } catch (error) {
            console.warn('保存失败:', error);
        }
    };
    
    // 监听临时文件保存事件
    const watcher = fs.watch(path.dirname(leftPath), (event, filename) => {
        if (filename === path.basename(leftPath) || filename === path.basename(rightPath)) {
            if (event === 'change') save();
        }
    });
    
    // 清理监听器
    const closeDisposable = vscode.workspace.onDidCloseTextDocument(doc => {
        if (doc.uri.fsPath === leftPath || doc.uri.fsPath === rightPath) {
            watcher.close(); // 停止监听
            closeDisposable.dispose();
            
            // 可选：删除临时文件
            try {
                fs.unlinkSync(leftPath);
                fs.unlinkSync(rightPath);
            } catch {}
        }
    });
}