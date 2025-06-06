import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // 注册 .ye 文件为 Markdown 类型
    vscode.languages.registerDocumentFormattingEditProvider('ye', {
        provideDocumentFormattingEdits(document) {
            // 使用 Markdown 格式化器
            return vscode.commands.executeCommand(
                'vscode.executeFormatDocumentProvider',
                document.uri,
                { insertSpaces: true, tabSize: 2 }
            );
        }
    });

    // 设置 .ye 文件关联为 Markdown
    vscode.workspace.onDidOpenTextDocument(doc => {
        if (doc.languageId === 'plaintext' && doc.fileName.endsWith('.ye')) {
            vscode.languages.setTextDocumentLanguage(doc, 'markdown');
        }
    });

    // 注册命令
    context.subscriptions.push(
        vscode.commands.registerCommand('ye.splitEditor', () => {
            splitYeEditor();
        })
    );

    // 自动为 .ye 文件执行分栏
    vscode.workspace.onDidOpenTextDocument(document => {
        if (document.fileName.endsWith('.ye')) {
            setTimeout(() => splitYeEditor(), 500);
        }
    });
}

// 分栏编辑器实现
async function splitYeEditor() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || !activeEditor.document.fileName.endsWith('.ye')) {
        return;
    }

    const document = activeEditor.document;
    const content = document.getText();
    
    // 解析文件内容
    const { leftContent, rightContent } = parseYeContent(content);
    
    // 保存当前活动编辑器
    const originalEditor = vscode.window.activeTextEditor;
    
    try {
        // 创建左侧编辑器
        await vscode.commands.executeCommand('workbench.action.splitEditorLeft');
        const leftEditor = vscode.window.activeTextEditor;
        await setEditorContent(leftEditor!, leftContent);
        
        // 创建右侧编辑器
        await vscode.commands.executeCommand('workbench.action.splitEditorRight');
        const rightEditor = vscode.window.activeTextEditor;
        await setEditorContent(rightEditor!, rightContent);
        
        // 恢复原始活动编辑器
        if (originalEditor) {
            await vscode.window.showTextDocument(originalEditor.document, originalEditor.viewColumn);
        }
        
        // 设置内容同步
        setupContentSync(document, leftEditor!, rightEditor!);
        
    } catch (error) {
        vscode.window.showErrorMessage(`分栏失败: ${error}`);
    }
}

// 解析 .ye 文件内容
function parseYeContent(content: string) {
    const LEFT_MARKER = '# -----昭-----';
    const RIGHT_MARKER = '# -----穆------';
    
    const leftIndex = content.indexOf(LEFT_MARKER);
    const rightIndex = content.indexOf(RIGHT_MARKER);
    
    // 处理标记存在情况
    if (leftIndex !== -1 && rightIndex !== -1) {
        return {
            leftContent: content.substring(leftIndex + LEFT_MARKER.length).trim(),
            rightContent: content.substring(rightIndex + RIGHT_MARKER.length, leftIndex).trim()
        };
    }
    
    // 只有右子树的情况
    if (rightIndex !== -1) {
        return {
            leftContent: '',
            rightContent: content.substring(rightIndex + RIGHT_MARKER.length).trim()
        };
    }
    
    // 只有左子树的情况
    if (leftIndex !== -1) {
        return {
            leftContent: content.substring(leftIndex + LEFT_MARKER.length).trim(),
            rightContent: ''
        };
    }
    
    // 无标记情况 - 默认为右子树
    return {
        leftContent: '',
        rightContent: content.trim()
    };
}

// 设置编辑器内容
async function setEditorContent(editor: vscode.TextEditor, content: string) {
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(editor.document.getText().length)
    );
    
    edit.replace(editor.document.uri, fullRange, content);
    await vscode.workspace.applyEdit(edit);
    
    // 格式化文档
    try {
        await vscode.commands.executeCommand('editor.action.formatDocument');
    } catch {
        // 忽略格式化错误
    }
}

// 设置内容同步
function setupContentSync(
    originalDocument: vscode.TextDocument,
    leftEditor: vscode.TextEditor,
    rightEditor: vscode.TextEditor
) {
    let isSaving = false;
    
    const saveContent = debounce(async () => {
        if (isSaving) return;
        isSaving = true;
        
        try {
            const leftContent = leftEditor.document.getText();
            const rightContent = rightEditor.document.getText();
            
            const newContent = [
                rightContent ? '# -----穆------' : '',
                rightContent,
                leftContent ? '# -----昭-----' : '',
                leftContent
            ].filter(Boolean).join('\n\n');
            
            const edit = new vscode.WorkspaceEdit();
            edit.replace(
                originalDocument.uri,
                new vscode.Range(0, 0, originalDocument.lineCount, 0),
                newContent
            );
            
            await vscode.workspace.applyEdit(edit);
            await originalDocument.save();
            
        } catch (error) {
            vscode.window.showErrorMessage(`保存失败: ${error}`);
        } finally {
            isSaving = false;
        }
    }, 1000);
    
    // 监听内容变更
    const disposableLeft = vscode.workspace.onDidChangeTextDocument(e => {
        if (e.document === leftEditor.document) saveContent();
    });
    
    const disposableRight = vscode.workspace.onDidChangeTextDocument(e => {
        if (e.document === rightEditor.document) saveContent();
    });
    
    // 清理监听器
    const cleanUp = () => {
        disposableLeft.dispose();
        disposableRight.dispose();
    };
    
    // 编辑器关闭时清理
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (!editor || (editor !== leftEditor && editor !== rightEditor)) {
            cleanUp();
        }
    });
}

// 防抖函数
function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout | null;
    return (...args: any[]) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}