import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "origin" is now active!');

    // Decoration type for hiding '## '
    const hideHashDecorationType = vscode.window.createTextEditorDecorationType({
        textDecoration: 'none',
        color: 'transparent', // Make the text invisible
    });

    // Decoration type for styling the remaining line content
    const contentDecorationType = vscode.window.createTextEditorDecorationType({
        textDecoration: 'line-height: 1; font-size: 14px;',//border:1px solid yellow;padding: 1px;margin:1px;display: inline-block;', // Adjust line height and font size
        fontWeight: '100',
        border: '1px solid green', // 透明边框，增加 8px 间距
        backgroundColor: 'rgba(38, 79, 120, 0.1)', // 标题背景
        before: {
            contentText: '▶ ', // Vector symbol
            margin: '5px;',
        },
        after: {
          contentText: '   ', // 空内容，仅用于占位
          backgroundColor: 'rgba(255, 0, 0, 0.2)', // 调试用
          height: '14px', // 增加装饰高度

          margin: '0 0 0 0; padding-bottom: 6px', // 增加底部间距，模拟行间距
      }
    });

    // Function to update decorations
    const updateDecorations = (editor: vscode.TextEditor) => {
        if (editor.document.languageId !== 'tea') return; // Ensure it's a .tea file

        const text = editor.document.getText();
        const lines = text.split('\n');
        const hashDecorations: vscode.DecorationOptions[] = [];
        const contentDecorations: vscode.DecorationOptions[] = [];

        lines.forEach((line, lineNumber) => {
            if (line.startsWith('## ')) {
                // Hide '## '
                const hashStartPos = new vscode.Position(lineNumber, 0);
                const hashEndPos = new vscode.Position(lineNumber, 3);
                const hashRange = new vscode.Range(hashStartPos, hashEndPos);
                hashDecorations.push({ range: hashRange });

                // Style the remaining content
                const contentStartPos = new vscode.Position(lineNumber, 3);
                const contentEndPos = new vscode.Position(lineNumber, line.length);
                const contentRange = new vscode.Range(contentStartPos, contentEndPos);
                contentDecorations.push({ range: contentRange });
            }
        });

        editor.setDecorations(hideHashDecorationType, hashDecorations);
        editor.setDecorations(contentDecorationType, contentDecorations);
    };

    // Listen to active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateDecorations(editor);
        }
    }, null, context.subscriptions);

    // Listen to document changes
    vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            updateDecorations(editor);
        }
    }, null, context.subscriptions);

    // Apply decorations to the active editor on activation
    if (vscode.window.activeTextEditor) {
        updateDecorations(vscode.window.activeTextEditor);
    }
}

export function deactivate() {}
