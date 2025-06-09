// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { basename as fname } from 'path';


// 调试通道
let outputChannel: vscode.OutputChannel;
let odog: (msg: string) => void;
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // 创建输出通道
  outputChannel = vscode.window.createOutputChannel('贱狗');
  context.subscriptions.push(outputChannel);
  odog = (msg: string) => {
    const time=new Date().toLocaleTimeString();
    outputChannel.appendLine(`[${time}] ${msg}`);
    console.log(`[贱狗${time}]: ${msg}`);
  };
  odog('KeyDog 插件已激活');
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log('Congratulations, your extension "event" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('event.helloWorld', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from event!');
  });
    context.subscriptions.push(disposable);

  // let eventLog: string[] = [];


  const reasons = ['未知','人工保存', '自动保存', '失焦保存'];
  context.subscriptions.push(
  vscode.workspace.onDidCloseTextDocument((doc) => odog(`DidClose: ${vscode.workspace.asRelativePath(doc.fileName)}`)),

  vscode.window.onDidChangeActiveTextEditor((editor) => odog(`DidChangeActive: ${editor ? (editor.document.uri.scheme === 'file' ? vscode.workspace.asRelativePath(editor.document.fileName) : `[${editor.document.uri.scheme}]`) : 'none'}`)),

  vscode.window.onDidChangeVisibleTextEditors(es => odog(`DidChangeVisible: ${es.map(e => e.document.uri.scheme === 'file' ? fname(e.document.fileName) : `[${e.document.uri.scheme}]`).join(',')}`)),
  vscode.workspace.onWillSaveTextDocument((e) => odog(`WillSave: ${reasons[e.reason] || e.reason}: ${vscode.workspace.asRelativePath(e.document.fileName)}`)),
  vscode.workspace.onDidSaveTextDocument((doc) => odog(`DidSave: ${vscode.workspace.asRelativePath(doc.fileName)}`)),

  vscode.workspace.onDidOpenTextDocument((doc) => odog(`DidOpen: ${doc.uri.scheme === 'file' ? fname(doc.fileName) : `[${doc.uri.scheme}]`}`)),

  vscode.window.onDidChangeTextEditorViewColumn((e) => odog(`DidChangeViewColumn: ${fname(e.textEditor.document.fileName)} -> 第${e.textEditor.viewColumn}栏`)),
  vscode.window.onDidChangeTextEditorOptions((e) => odog(`DidChangeOptions: ${fname(e.textEditor.document.fileName)}`)),
  vscode.window.onDidChangeWindowState((e) => odog(`DidChangeWindowState: focused=${e.focused}`)),

);


  // 关闭文件后打印事件顺序
  // setTimeout(() => {
  //   console.log('事件触发顺序:', eventLog.join(' → '));
  //   eventLog = [];
  // }, 1000);

}

// This method is called when your extension is deactivated
export function deactivate() { }
