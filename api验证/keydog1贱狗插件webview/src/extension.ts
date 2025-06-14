// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { setupTreeSplitEditor } from './editorProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('贱狗插件已经激活!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('keydog.helloWorld', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from keydog贱狗!');
  });

  // 注册自定义编辑器提供器
  const providerRegistration = vscode.window.registerCustomEditorProvider(
    'keydog.editor', // 这个要和package.json中的viewType一致
    {
            resolveCustomTextEditor: async (document, webviewPanel) => {
                setupTreeSplitEditor(document, webviewPanel, context);
            }
        },
    {
      webviewOptions: {
        retainContextWhenHidden: true, // 保持webview状态
      },
      supportsMultipleEditorsPerDocument: false, // 每个文档只允许一个编辑器
    }
  );



  context.subscriptions.push(disposable, providerRegistration);
}

// This method is called when your extension is deactivated
export function deactivate() { }
