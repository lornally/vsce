import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

// 声明输出通道引用（不初始化）
let outputChannel: vscode.OutputChannel;
// 声明日志函数（延迟初始化）
let odog: (msg: string) => void;



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
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(async doc => {
            if (doc.languageId === 'ye' && !doc.isUntitled) {
                // 立即关闭原始文件
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                
                // 创建并打开临时文件
                await openTemporaryFiles(doc);
            }
        })
    );
}

async function openTemporaryFiles(originalDoc: vscode.TextDocument) {
    const content = originalDoc.getText();
    const { leftContent, rightContent } = parseContent(content);
    
    // 创建临时文件路径
    const originalPath = originalDoc.uri.fsPath;
    const leftPath = `${originalPath}.左.md`;
    const rightPath = `${originalPath}.右.md`;
    
    // 写入临时文件
    await writeFile(leftPath, leftContent);
    await writeFile(rightPath, rightContent);
    
    // 打开临时文件（分栏显示）
    const leftUri = vscode.Uri.file(leftPath);
    const rightUri = vscode.Uri.file(rightPath);
    
    const leftDoc = await vscode.workspace.openTextDocument(leftUri);
    const rightDoc = await vscode.workspace.openTextDocument(rightUri);
    
    // 左侧编辑器
    const leftEditor = await vscode.window.showTextDocument(leftDoc, {
        viewColumn: vscode.ViewColumn.One
    });
    
    // 右侧编辑器
    const rightEditor = await vscode.window.showTextDocument(rightDoc, {
        viewColumn: vscode.ViewColumn.Two
    });
    
    // 设置文件关闭监听
    setupCloseHandler(originalDoc, leftEditor, rightEditor);
}

function parseContent(content: string) {
    const LEFT_MARKER = '# -----昭-----';
    const markerIndex = content.indexOf(LEFT_MARKER);
    
    // 无左标记：全部是右子树
    if (markerIndex === -1) {
        return {
            leftContent: '',
            rightContent: content
        };
    }
    
    // 有左标记：切分内容
    return {
        leftContent: content.substring(markerIndex + LEFT_MARKER.length).trim(),
        rightContent: content.substring(0, markerIndex).trim()
    };
}

function setupCloseHandler(
    originalDoc: vscode.TextDocument,
    leftEditor: vscode.TextEditor,
    rightEditor: vscode.TextEditor
) {
    const save = async () => {
        // 读取临时文件内容
        const leftContent = leftEditor.document.getText();
        const rightContent = rightEditor.document.getText();
        
        // 合并内容
        const newContent = !leftContent ? rightContent : 
            `${rightContent}\n\n# -----昭-----\n\n${leftContent}`;
        
        // 保存回原始文件
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            originalDoc.uri,
            new vscode.Range(0, 0, originalDoc.lineCount, 0),
            newContent
        );
        
        await vscode.workspace.applyEdit(edit);
        await originalDoc.save();
        
      
        
       
    };
    const close= async () => {
        // 关闭临时文件编辑器
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        
        // 删除临时文件（可选）
        try {
            await unlink(leftEditor.document.uri.fsPath);
            await unlink(rightEditor.document.uri.fsPath);
        } catch (error) {
            console.warn('临时文件删除失败:', error);
        }

    }


    
    // 监听任意一个临时文件的关闭
    const disposable = vscode.workspace.onDidCloseTextDocument(async doc => {
        if (doc === leftEditor.document || doc === rightEditor.document) {
            await save();
            await close();
            disposable.dispose();
        }
    });
}

// 可选：在插件停用时清理所有临时文件
export function deactivate() {
    const tempFiles = fs.readdirSync(vscode.workspace.rootPath || '')
        .filter(file => file.endsWith('.ye.左.md') || file.endsWith('.ye.右.md'));
    
    tempFiles.forEach(file => {
        try {
            fs.unlinkSync(path.join(vscode.workspace.rootPath || '', file));
        } catch (error) {
            console.warn('清理临时文件失败:', file, error);
        }
    });
}