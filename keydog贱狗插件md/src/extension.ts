import * as vscode from 'vscode';
const LEFT_MARKER = '# -----昭-----';   // 改为您的格式
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


    
    // 2. 自动分栏命令
    context.subscriptions.push(
        vscode.commands.registerCommand('ye.split', () => splitYeEditor(context))
    );
        // 3. 打开YE文件时自动分栏
        vscode.workspace.onDidOpenTextDocument(doc => {
        if (doc.languageId === 'ye' && !doc.isUntitled) {
                setTimeout(() => splitYeEditor(context), 300);
            }
        });
  


}



async function splitYeEditor(context: vscode.ExtensionContext) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'ye') return;
    
    const doc = editor.document;
    const content = doc.getText();
    
    // 解析内容（根据新规则）
    const { left, right } = parseContent(content);
    
    // 保存当前编辑器状态
    const originalViewColumn = editor.viewColumn;
    
    try {
        // 创建左侧编辑器
        await vscode.commands.executeCommand('workbench.action.splitEditorLeft');
        const leftEditor = vscode.window.activeTextEditor;
        await setContent(leftEditor!, left);
        
        // 创建右侧编辑器
        await vscode.commands.executeCommand('workbench.action.splitEditorRight');
        const rightEditor = vscode.window.activeTextEditor;
        await setContent(rightEditor!, right);
        
        // 设置内容同步
        setupSync(context,doc, leftEditor!, rightEditor!);
        // 恢复原始编辑器焦点
        if (originalViewColumn) {
            await vscode.window.showTextDocument(doc, originalViewColumn);
        }
   
        
    } catch (error) {
      odog(`分栏失败: ${error}`);
        vscode.window.showErrorMessage(`分栏失败: ${error}`);
    }
}


function parseContent(content: string) {
    const markerIndex = content.indexOf(LEFT_MARKER);
    
   return markerIndex === -1
        ? { left: '', right: content.trim() }
        : {
            left: content.substring(markerIndex + LEFT_MARKER.length).trim(),
            right: content.substring(0, markerIndex).trim()
        };
}

async function setContent(editor: vscode.TextEditor, content: string) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
        editor.document.uri,
        new vscode.Range(0, 0, editor.document.lineCount, 0),
        content
    );
    await vscode.workspace.applyEdit(edit);
    // 设置语言为Markdown
    await vscode.languages.setTextDocumentLanguage(editor.document, 'markdown');
    
    // 格式化文档
    await vscode.commands.executeCommand('editor.action.formatDocument');
}

function setupSync(
    context: vscode.ExtensionContext,
    originalDoc: vscode.TextDocument,
    leftEditor: vscode.TextEditor,
    rightEditor: vscode.TextEditor
) {
    let isSaving = false;
    
    const save = async () => {
        if (isSaving) return;
        isSaving = true;
        
        try {
            const left = leftEditor.document.getText();
            const right = rightEditor.document.getText();
            const newContent = !left ? right : `${right}\n\n${LEFT_MARKER}\n\n${left}`;
            
            const edit = new vscode.WorkspaceEdit();
            edit.replace(
                originalDoc.uri,
                new vscode.Range(0, 0, originalDoc.lineCount, 0),
                newContent
            );
            
            await vscode.workspace.applyEdit(edit);
            
        } finally {
            isSaving = false;
        }
    };
    
    // 防抖保存（300ms）
    const debouncedSave = debounce(save, 1000);
    
    // 监听变更
    const disposable = vscode.workspace.onDidChangeTextDocument(e => {
        if (e.document === leftEditor.document || e.document === rightEditor.document) {
            debouncedSave();
        }
    });
    
    context.subscriptions.push(disposable);
}

// 简化的防抖函数
function debounce(func:  () => void, wait: number) {
    let timeout: NodeJS.Timeout;
    return () => {
        clearTimeout(timeout);
        timeout = setTimeout(func, wait);
    };
}