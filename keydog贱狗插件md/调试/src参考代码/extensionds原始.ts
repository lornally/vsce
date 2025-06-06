import * as vscode from 'vscode';

const LEFT_MARKER = '# -----昭-----';

export function activate(context: vscode.ExtensionContext) {
    // 1. 注册YE文件为Markdown类型
    registerYeAsMarkdown();
    
    // 2. 自动分栏命令
    context.subscriptions.push(
        vscode.commands.registerCommand('ye.split', () => splitYeEditor())
    );
    
    // 3. 打开YE文件时自动分栏
    vscode.workspace.onDidOpenTextDocument(doc => {
        if (doc.fileName.endsWith('.ye')) {
            setTimeout(() => splitYeEditor(), 300);
        }
    });
}

function registerYeAsMarkdown() {
    // 设置新打开的.ye文件为markdown模式
    vscode.workspace.onDidOpenTextDocument(doc => {
        if (doc.languageId === 'plaintext' && doc.fileName.endsWith('.ye')) {
            vscode.languages.setTextDocumentLanguage(doc, 'markdown');
        }
    });
    
    // 提供Markdown格式化支持
    vscode.languages.registerDocumentFormattingEditProvider('ye', {
        async provideDocumentFormattingEdits(document) {
            await vscode.commands.executeCommand('editor.action.formatDocument');
            return [];
        }
    });
}

async function splitYeEditor() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith('.ye')) return;
    
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
        setupSync(doc, leftEditor!, rightEditor!);
        
        // 恢复原始编辑器焦点
        if (originalViewColumn) {
            await vscode.window.showTextDocument(doc, originalViewColumn);
        }
        
    } catch (error) {
        vscode.window.showErrorMessage(`分栏失败: ${error}`);
    }
}

function parseContent(content: string) {
    const markerIndex = content.indexOf(LEFT_MARKER);
    
    // 无标记：全部是右子树
    if (markerIndex === -1) {
        return { left: '', right: content.trim() };
    }
    
    // 有标记：切分内容
    return {
        left: content.substring(markerIndex + LEFT_MARKER.length).trim(),
        right: content.substring(0, markerIndex).trim()
    };
}

async function setContent(editor: vscode.TextEditor, content: string) {
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(editor.document.getText().length)
    );
    
    edit.replace(editor.document.uri, fullRange, content);
    await vscode.workspace.applyEdit(edit);
    
    // 应用Markdown格式
    await vscode.commands.executeCommand('editor.action.formatDocument');
}

function setupSync(originalDoc: vscode.TextDocument, leftEditor: vscode.TextEditor, rightEditor: vscode.TextEditor) {
    let isSaving = false;
    
    const save = debounce(async () => {
        if (isSaving) return;
        isSaving = true;
        
        try {
            const left = leftEditor.document.getText();
            const right = rightEditor.document.getText();
            
            // 根据新规则生成内容
            const newContent = !left ? right : `${right}\n\n${LEFT_MARKER}\n\n${left}`;
            
            const edit = new vscode.WorkspaceEdit();
            edit.replace(
                originalDoc.uri,
                new vscode.Range(0, 0, originalDoc.lineCount, 0),
                newContent
            );
            
            await vscode.workspace.applyEdit(edit);
            await originalDoc.save();
            
        } finally {
            isSaving = false;
        }
    }, 800);
    
    // 监听变更
    const disposables = [
        vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document === leftEditor.document || e.document === rightEditor.document) {
                save();
            }
        })
    ];
    
    // 清理监听器
    const dispose = () => disposables.forEach(d => d.dispose());
    context.subscriptions.push({ dispose });
}

function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}