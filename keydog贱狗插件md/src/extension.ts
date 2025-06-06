import * as vscode from 'vscode';
const LEFT_MARKER = '# -----昭-----';   // 改为您的格式
const RIGHT_MARKER = '# -----穆------';  // 改为您的格式
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

  // 注册命令
  context.subscriptions.push(
    vscode.commands.registerCommand('ye.splitEditor', () => {
      createTreeSplitEditor();
    })
  );
  // +++ 添加自动分栏逻辑 +++
  vscode.workspace.onDidOpenTextDocument((document) => {
    // 检查是否为.ye文件
    if (document.languageId === 'ye') {
      // 延迟500ms确保编辑器完全加载
      setTimeout(() => {
        // 执行分栏命令
        vscode.commands.executeCommand('ye.splitEditor');
      }, 500);
    }
  });
}





function createTreeSplitEditor() {
  odog('调试：开始分栏流程');

  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) return;

  odog(`调试：当前文件URI', ${activeEditor.document.uri.toString()}`);

  // 保存原始文档引用
  const originalDoc = activeEditor.document;

  // 创建左侧编辑器（左子树）
  vscode.commands.executeCommand('workbench.action.splitEditorLeft')
    .then(() => {
      const leftEditor = vscode.window.activeTextEditor;

      // 创建右侧编辑器（右子树）
      vscode.commands.executeCommand('workbench.action.splitEditorRight')
        .then(() => {
          const rightEditor = vscode.window.activeTextEditor;

          // 加载内容到编辑器
          loadContent(originalDoc, leftEditor!, rightEditor!);

          // 设置内容同步
          setupSync(originalDoc, leftEditor!, rightEditor!);
        });
    });
}

// 加载内容到左右窗口
function loadContent(originalDoc: vscode.TextDocument,
  leftEditor: vscode.TextEditor,
  rightEditor: vscode.TextEditor) {
  const content = originalDoc.getText();
  const splitIndex = content.indexOf(LEFT_MARKER);

  const leftContent = content.substring(splitIndex + LEFT_MARKER.length);
  const rightContent = content.substring(
    content.indexOf(RIGHT_MARKER) + RIGHT_MARKER.length,
    splitIndex
  );

  // 使用WorkspaceEdit设置内容
  const edit = new vscode.WorkspaceEdit();
  edit.replace(leftEditor.document.uri,
    new vscode.Range(0, 0, leftEditor.document.lineCount, 0),
    leftContent);
  edit.replace(rightEditor.document.uri,
    new vscode.Range(0, 0, rightEditor.document.lineCount, 0),
    rightContent);

  vscode.workspace.applyEdit(edit);
}

// 设置内容同步, 
// ? 这里很可能有问题 
function setupSync(originalDoc: vscode.TextDocument,
  leftEditor: vscode.TextEditor,
  rightEditor: vscode.TextEditor) {
  const save = debounce(() => {
    const newContent = [
      originalDoc.getText().split(RIGHT_MARKER)[0], // 保留头部
      RIGHT_MARKER,
      rightEditor.document.getText(),
      LEFT_MARKER,
      leftEditor.document.getText()
    ].join('\n\n');

    const edit = new vscode.WorkspaceEdit();
    edit.replace(originalDoc.uri,
      new vscode.Range(0, 0, originalDoc.lineCount, 0),
      newContent);

    vscode.workspace.applyEdit(edit);
  }, 500);

  // 监听两个编辑器的变化
  const disposable1 = vscode.workspace.onDidChangeTextDocument(e => {
    if (e.document === leftEditor.document ||
      e.document === rightEditor.document) {
      save();
    }
  });

  // 清理时取消监听
  // 使用editorDisposable保存监听器引用，以便后续清理
  const editorDisposable = vscode.window.onDidChangeVisibleTextEditors(editors => {
    const leftClosed = !editors.includes(leftEditor);
    const rightClosed = !editors.includes(rightEditor);

    if (leftClosed || rightClosed) {
      disposable1.dispose();
      editorDisposable.dispose(); // 清理自身
    }
  });
}

function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
