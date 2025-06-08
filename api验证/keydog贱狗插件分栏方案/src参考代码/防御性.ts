function createTreeSplitEditor() {
    outputChannel.show(); // 确保输出通道可见
    outputChannel.appendLine('调试：开始分栏流程');
    
    try {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            throw new Error("无活动编辑器");
        }
        
        const originalDoc = activeEditor.document;
        
        // 增加分栏延迟和错误处理
        vscode.commands.executeCommand('workbench.action.splitEditorLeft')
            .then(() => new Promise(resolve => setTimeout(resolve, 300))) // 300ms延迟
            .then(() => {
                const leftEditor = vscode.window.activeTextEditor;
                if (!leftEditor) throw new Error("左侧编辑器获取失败");
                
                return vscode.commands.executeCommand('workbench.action.splitEditorRight')
                    .then(() => new Promise(resolve => setTimeout(resolve, 300)))
                    .then(() => {
                        const rightEditor = vscode.window.activeTextEditor;
                        if (!rightEditor) throw new Error("右侧编辑器获取失败");
                        
                        loadContent(originalDoc, leftEditor, rightEditor);
                        setupSync(originalDoc, leftEditor, rightEditor);
                    });
            })
            .catch(err => {
                outputChannel.appendLine(`分栏错误: ${err}`);
                vscode.window.showErrorMessage(`分栏失败: ${err.message}`);
            });
    } catch (err) {
        outputChannel.appendLine(`初始化错误: ${err}`);
        vscode.window.showErrorMessage(`分栏初始化失败: ${err.message}`);
    }
}
