import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // 注册自定义编辑器提供者
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            'treeSplit.editor',
            {
                resolveCustomTextEditor: async (document, webviewPanel) => {
                    setupTreeSplitEditor(document, webviewPanel);
                }
            },
            { webviewOptions: { retainContextWhenHidden: true } }
        )
    );
}

// 设置树形分割编辑器
function setupTreeSplitEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
    // 配置 Webview
    webviewPanel.webview.options = { enableScripts: true };
    
    // 初始渲染
    updateWebviewContent(document, webviewPanel);
    
    // 处理文档变更
    const changeSubscription = vscode.workspace.onDidChangeTextDocument(e => {
        if (e.document.uri.toString() === document.uri.toString()) {
            updateWebviewContent(document, webviewPanel);
        }
    });
    
    // 处理 Webview 消息
    webviewPanel.webview.onDidReceiveMessage(handleWebviewMessage(document));
    
    // 清理资源
    webviewPanel.onDidDispose(() => {
        changeSubscription.dispose();
    });
}

// 更新 Webview 内容
function updateWebviewContent(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
    const { header, leftContent, rightContent } = parseDocument(document.getText());
    webviewPanel.webview.html = renderWebview(header, leftContent, rightContent);
}

// 解析文档内容
function parseDocument(content: string) {
    const LEFT_MARKER = '## -----左-----';
    const RIGHT_MARKER = '## -----右------';
    
    const rightIndex = content.indexOf(RIGHT_MARKER);
    const leftIndex = content.indexOf(LEFT_MARKER);
    
    // 容错处理：找不到标记时使用默认值
    if (rightIndex === -1 || leftIndex === -1) {
        return {
            header: content,
            leftContent: '',
            rightContent: ''
        };
    }
    
    return {
        header: content.substring(0, rightIndex).trim(),
        rightContent: content.substring(
            rightIndex + RIGHT_MARKER.length, 
            leftIndex
        ).trim(),
        leftContent: content.substring(
            leftIndex + LEFT_MARKER.length
        ).trim()
    };
}

// 处理 Webview 消息
function handleWebviewMessage(document: vscode.TextDocument) {
    return async (message: any) => {
        if (message.type === 'update') {
            await updateDocument(document, message.left, message.right);
        }
    };
}

// 更新文档内容
async function updateDocument(document: vscode.TextDocument, leftContent: string, rightContent: string) {
    const { header } = parseDocument(document.getText());
    const newContent = [
        header,
        '## -----右------',
        rightContent,
        '## -----左-----',
        leftContent
    ].join('\n\n');
    
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
        document.uri,
        new vscode.Range(0, 0, document.lineCount, 0),
        newContent
    );
    
    await vscode.workspace.applyEdit(edit);
}

// 渲染 Webview HTML
function renderWebview(header: string, leftContent: string, rightContent: string) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TreeSplit Editor</title>
        <style>
            :root {
                --editor-font: ${vscode.workspace.getConfiguration('editor').fontFamily || 'Consolas, monospace'};
                --editor-font-size: ${vscode.workspace.getConfiguration('editor').fontSize || 14}px;
                --border-color: #ddd;
                --header-color: #555;
            }
            
            body {
                margin: 0;
                padding: 0;
                overflow: hidden;
                background-color: ${vscode.workspace.getConfiguration('workbench').colorTheme.includes('Dark') 
                    ? '#1e1e1e' : '#f3f3f3'};
            }
            
            .container {
                display: flex;
                height: 100vh;
            }
            
            .editor-pane {
                flex: 1;
                padding: 15px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                border-right: 1px solid var(--border-color);
            }
            
            .editor-pane:last-child {
                border-right: none;
            }
            
            .header {
                font-size: 16px;
                margin-bottom: 10px;
                color: var(--header-color);
                font-weight: 500;
            }
            
            textarea {
                flex: 1;
                width: 100%;
                resize: none;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                padding: 10px;
                font-family: var(--editor-font);
                font-size: var(--editor-font-size);
                line-height: 1.5;
                background-color: ${vscode.workspace.getConfiguration('workbench').colorTheme.includes('Dark') 
                    ? '#252526' : '#ffffff'};
                color: ${vscode.workspace.getConfiguration('workbench').colorTheme.includes('Dark') 
                    ? '#d4d4d4' : '#333333'};
            }
            
            textarea:focus {
                outline: none;
                border-color: #0078d4;
                box-shadow: 0 0 0 1px #0078d4;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="editor-pane">
                <div class="header">左子树</div>
                <textarea id="left-editor" spellcheck="false">${escapeHtml(leftContent)}</textarea>
            </div>
            <div class="editor-pane">
                <div class="header">右子树</div>
                <textarea id="right-editor" spellcheck="false">${escapeHtml(rightContent)}</textarea>
            </div>
        </div>
        
        <script>
            const vscode = acquireVsCodeApi();
            const leftEditor = document.getElementById('left-editor');
            const rightEditor = document.getElementById('right-editor');
            
            // 设置编辑器高度
            function resizeEditors() {
                const container = document.querySelector('.container');
                leftEditor.style.height = (container.clientHeight - 50) + 'px';
                rightEditor.style.height = (container.clientHeight - 50) + 'px';
            }
            
            // 初始调整大小
            resizeEditors();
            window.addEventListener('resize', resizeEditors);
            
            // 内容变更处理
            let saveTimeout;
            function handleChange() {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    vscode.postMessage({
                        type: 'update',
                        left: leftEditor.value,
                        right: rightEditor.value
                    });
                }, 500);
            }
            
            leftEditor.addEventListener('input', handleChange);
            rightEditor.addEventListener('input', handleChange);
            
            // 处理来自扩展的消息
            window.addEventListener('message', event => {
                const message = event.data;
                if (message.type === 'update') {
                    if (leftEditor.value !== message.left) {
                        leftEditor.value = message.left;
                    }
                    if (rightEditor.value !== message.right) {
                        rightEditor.value = message.right;
                    }
                }
            });
        </script>
    </body>
    </html>`;
}

// HTML 转义函数
function escapeHtml(unsafe: string) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}