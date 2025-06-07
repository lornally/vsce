import * as vscode from 'vscode';
import * as path from 'path';

const LEFT_MARKER = '# -----昭-----';

export function activate(context: vscode.ExtensionContext) {
    console.log('KeyDog 插件已激活');
    
    // 自动分栏
    vscode.workspace.onDidOpenTextDocument(async doc => {
        if (doc.languageId === 'ye' && !doc.isUntitled) {
            try {
                // 1. 立即关闭源文件编辑器
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                
                // 2. 创建分栏视图
                await createSplitView(context, doc);
            } catch (error) {
                console.error('自动分栏失败:', error);
            }
        }
    });
}

async function createSplitView(context: vscode.ExtensionContext, originalDoc: vscode.TextDocument) {
    const content = originalDoc.getText();
    const { left, right } = parseContent(content);
    
    try {
        // 创建左编辑器（在新组）
        const leftEditor = await createEditorInNewGroup(left, '左子树');
        
        // 创建右编辑器（在右侧组）
        const rightEditor = await createEditorInNewGroup(right, '右子树', vscode.ViewColumn.Two);
        
        // 设置同步
        setupSync(context, originalDoc, leftEditor, rightEditor);
        
        console.log('分栏视图已成功创建');
        
    } catch (error) {
        console.error('创建分栏失败:', error);
        vscode.window.showErrorMessage(`创建分栏失败: ${error instanceof Error ? error.message : error}`);
    }
}

// 创建新编辑器
async function createEditorInNewGroup(content: string, title: string, viewColumn = vscode.ViewColumn.One): Promise<vscode.TextEditor> {
    // 创建临时文档
    const tempDoc = await vscode.workspace.openTextDocument({
        content,
        language: 'markdown'
    });
    
    // 在新编辑器组显示
    const editor = await vscode.window.showTextDocument(tempDoc, {
        viewColumn,
        preview: false,
        preserveFocus: false
    });
    
    // 设置编辑器标题
    await setEditorTitle(editor, title);
    
    // 添加视觉标识
    addEditorDecoration(editor, title);
    
    return editor;
}

// 设置编辑器标题
async function setEditorTitle(editor: vscode.TextEditor, title: string) {
    try {
        // VS Code 1.52+ 支持重命名编辑器
        await (vscode.window as any).renameEditor(editor, title);
    } catch (error) {
        // 回退方案：使用文档标题
        const uri = editor.document.uri;
        const newUri = uri.with({ path: `${title}${path.extname(uri.path)}` });
        await vscode.workspace.fs.rename(uri, newUri);
    }
}

// 添加视觉标识
function addEditorDecoration(editor: vscode.TextEditor, title: string) {
    const isLeft = title.includes('左');
    const bgColor = isLeft ? 'rgba(0,128,0,0.05)' : 'rgba(0,0,255,0.05)';
    const borderColor = isLeft ? 'green' : 'blue';
    
    const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderWidth: '0 0 0 2px'
    });
    
    // 应用到整个文档
    const range = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(editor.document.getText().length)
    );
    
    editor.setDecorations(decorationType, [{
        range,
        hoverMessage: title
    }]);
    
    // 自动清理
    const disposable = vscode.window.onDidChangeTextEditorViewColumn(e => {
        if (e.textEditor === editor) {
            decorationType.dispose();
            disposable.dispose();
        }
    });
}

// 内容解析
function parseContent(content: string) {
    const markerIndex = content.indexOf(LEFT_MARKER);
    
    if (markerIndex === -1) {
        return { left: '', right: content.trim() };
    }
    
    return {
        left: content.substring(markerIndex + LEFT_MARKER.length).trim(),
        right: content.substring(0, markerIndex).trim()
    };
}

// 设置同步
function setupSync(
    context: vscode.ExtensionContext,
    originalDoc: vscode.TextDocument,
    leftEditor: vscode.TextEditor,
    rightEditor: vscode.TextEditor
) {
    let isSaving = false;
    let lastSavedContent = '';
    
    const save = async () => {
        if (isSaving) return;
        isSaving = true;
        
        try {
            const left = leftEditor.document.getText();
            const right = rightEditor.document.getText();
            const newContent = !left ? right : `${right}\n\n${LEFT_MARKER}\n\n${left}`;
            
            // 检查内容是否变化
            if (newContent === lastSavedContent) return;
            
            // 更新源文件
            const edit = new vscode.WorkspaceEdit();
            edit.replace(
                originalDoc.uri,
                new vscode.Range(0, 0, originalDoc.lineCount, 0),
                newContent
            );
            
            await vscode.workspace.applyEdit(edit);
            lastSavedContent = newContent;
            
        } catch (error) {
            console.error('同步失败:', error);
        } finally {
            isSaving = false;
        }
    };
    
    // 高效防抖保存
    const debouncedSave = debounce(save, 500);
    
    // 监听变更
    const disposable = vscode.workspace.onDidChangeTextDocument(e => {
        if (e.document === leftEditor.document || e.document === rightEditor.document) {
            debouncedSave();
        }
    });
    
    context.subscriptions.push(disposable);
}

// 高性能防抖
function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout | null;
    return (...args: any[]) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}