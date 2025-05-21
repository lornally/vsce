// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // 创建状态栏项
  let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  context.subscriptions.push(statusBarItem);

  // 监听文本变化和编辑器切换
  context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument(() => updateCharCount(statusBarItem)),
      vscode.window.onDidChangeActiveTextEditor(() => updateCharCount(statusBarItem))
  );

  // 初始更新
  updateCharCount(statusBarItem);

	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "sta-py-code" is now active!');



}


// This method is called when your extension is deactivated
export function deactivate() {}


function updateCharCount(statusBarItem: vscode.StatusBarItem) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'python') {
      statusBarItem.hide();
      return;
  }

  const filePath = editor.document.fileName;
  const scriptPath = path.join(__dirname, '..', 'c_i.py');

  // 调用 Python 脚本
  exec(`python3 "${scriptPath}" "${filePath}"`, (err, stdout,stderr) => {
      if (err) {
          statusBarItem.text = "sta.py.code统计错误";
          console.error('Error object:', err);   // 输出 err 对象
          console.error('STDERR:', stderr);     // 输出标准错误流
      } else {
          const count = stdout.trim();
          statusBarItem.text = `有效字符: ${count}`;
      }
      statusBarItem.show();
  });
}