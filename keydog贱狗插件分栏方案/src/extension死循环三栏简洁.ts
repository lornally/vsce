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
    // context.subscriptions.push(
    //     vscode.commands.registerCommand('ye.split', () => splitYeEditor(context))
    // );
        // 3. 打开YE文件时自动分栏
        vscode.workspace.onDidOpenTextDocument(doc => {
        if (doc.languageId === 'ye' && !doc.isUntitled) {
                setTimeout(() => splitYeEditor(context), 300);
            }
        });
  


}



async function splitYeEditor(context: vscode.ExtensionContext) {
    odog('=== 开始分栏流程 ===');
    
    const editor = vscode.window.activeTextEditor;
    odog(`步骤1: 获取活动编辑器 - ${editor ? '成功' : '失败'}`);
    
    if (!editor || editor.document.languageId !== 'ye') {
        odog(`退出原因: editor=${!!editor}, languageId=${editor?.document.languageId}`);
        return;
    }
    
    const doc = editor.document;
    odog(`步骤2: 文档信息 - URI: ${doc.uri.toString()}`);

    // * 解码uri, 让他显示中文
    odog(`步骤2: 文档信息 - URI: ${decodeURIComponent(doc.uri.toString())}`);

    
    const content = doc.getText();
    // 解析内容（根据新规则）
    const { left, right } = parseContent(content);
    odog(`步骤3: 内容解析 - 左侧长度: ${left.length}, 右侧长度: ${right.length}`);
    
    // 保存当前编辑器状态
    const originalViewColumn = editor.viewColumn;
    odog(`步骤4: 原始视图列 - ${originalViewColumn}`);
    
    try {
        // 创建左侧编辑器
        odog('步骤5: 执行左分栏命令...');
        await vscode.commands.executeCommand('workbench.action.splitEditorLeft');
        const leftEditor = vscode.window.activeTextEditor;
        odog(`步骤6: 左编辑器状态 - ${leftEditor ? '成功创建' : '❌ 未创建'}`);
        if (leftEditor) {
            odog(`左编辑器详情: URI=${leftEditor.document.uri.toString()}, 列=${leftEditor.viewColumn}`);
        }
        
        odog('步骤7: 设置左编辑器内容...');
        await setContent(leftEditor!, left);
        odog('步骤8: 左编辑器内容设置完成');
        
        // 创建右侧编辑器
        odog('步骤9: 执行右分栏命令...');
        await vscode.commands.executeCommand('workbench.action.splitEditorRight');
        const rightEditor = vscode.window.activeTextEditor;
        odog(`步骤10: 右编辑器状态 - ${rightEditor ? '成功创建' : '❌ 未创建'}`);
        if (rightEditor) {
            odog(`右编辑器详情: URI=${rightEditor.document.uri.toString()}, 列=${rightEditor.viewColumn}`);
        }
        
        odog('步骤11: 设置右编辑器内容...');
        await setContent(rightEditor!, right);
        odog('步骤12: 右编辑器内容设置完成');
        
        // 设置内容同步
        odog('步骤13: 设置同步...');
        setupSync(context, doc, leftEditor!, rightEditor!);
        odog('步骤14: 同步设置完成');
        
        // 恢复原始编辑器焦点
        if (originalViewColumn) {
            odog(`步骤15: 恢复原始编辑器焦点到列 ${originalViewColumn}`);
            await vscode.window.showTextDocument(doc, originalViewColumn);
            odog('步骤16: 原始编辑器焦点恢复完成');
        }
        
    } catch (error) {
          const err = error as Error;

        odog(`❌ 错误发生在: ${err.message}`);
        odog(`❌ 错误堆栈: ${err.stack}`);
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