// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "qmltight" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json



  // 命令2：格式化QML
  const tightCommand = vscode.commands.registerCommand(
    'qmltight.tight',
    async () => {
      vscode.window.showInformationMessage('tighting from qmltight...');
      const editor = vscode.window.activeTextEditor;
      if (!editor ||
        editor.document.languageId !== 'qml' ||
        editor.selection.isEmpty) {  // 检查是否有选中文本
        vscode.window.showWarningMessage('为了兼容vscode且避免误操作, 请先选中任意代码, 以便格式化整个文件.');
        return;
      }
      // 调用 Python 脚本
      const filePath = editor.document.fileName;

      const scriptPath = path.join(__dirname, '..', 'tight.py');
      exec(`python3 "${scriptPath}" "${filePath}"`, (err, stdout, stderr) => {
        if (err) {
          // 错误处理
          vscode.window.showInformationMessage('紧凑Qml失败...');
          console.error('Error object:', err);   // 输出 err 对象
          console.error('STDERR:', stderr);     // 输出标准错误流
        } else {
          const count = stdout.trim();
          vscode.window.showInformationMessage(`qml紧凑成功: ${count} `);
        }
      });






    }
  );


	context.subscriptions.push(tightCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
