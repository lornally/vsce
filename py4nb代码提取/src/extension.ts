// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "py4nb" is now active!');

  // // 动态添加高亮规则到当前主题
  // const config = vscode.workspace.getConfiguration('editor');
  // const tokenColorCustomizations = config.get('tokenColorCustomizations') || {};

  // await config.update('tokenColorCustomizations', {
  //   ...tokenColorCustomizations,


  //   // 覆盖默认暗色主题类型（保险策略）
  //   "[vs-dark]": {  // 适配所有标记为 vs-dark 的主题
  //     "textMateRules": [
  //       {
  //         "scope": "comment.line.export.python",
  //         "settings": {
  //           "foreground": "#00FF00",
  //           "fontStyle": "bold"
  //         }
  //       }
  //     ]
  //   }
  // }, vscode.ConfigurationTarget.Global);

  // 你的其他命令注册代码...





  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  // const disposable = vscode.commands.registerCommand('py4nb.helloWorld', () => {
  //   // The code you place here will be executed every time your command is executed
  //   // Display a message box to the user
  //   vscode.window.showInformationMessage('Hello World from py4nb!');
  // });
  // 命令1：导出标记单元格
  const exportCommand = vscode.commands.registerCommand(
    'py4nb.export',
    async () => {
      vscode.window.showInformationMessage('开始导出 Notebook 到 Python...');

      const editor = vscode.window.activeTextEditor;
      if (!editor || !editor.document.fileName.endsWith('.ipynb')) {
        vscode.window.showWarningMessage('请先打开一个 .ipynb 文件');
        return;
      }
      const filePath = editor.document.fileName;
      const scriptPath = path.join(__dirname, '..', 'export.py');
      // 调用 Python 脚本
      exec(`python3 "${scriptPath}" "${filePath}"`, (err, stdout, stderr) => {
        if (err) {
          vscode.window.showInformationMessage('导出 Notebook 到 Python, 失败...');
          console.log("报错啦");
          console.error('Error object:', err);   // 输出 err 对象
          console.error('STDERR:', stderr);     // 输出标准错误流
          console.error('STDOUT:', stdout);     // 输出标准输出流（可能为空）
        } else {
          const count = stdout.trim();
          vscode.window.showInformationMessage(`导出 Notebook 到 Python, 成功... ${count} `);
        }
      });


    }
  );
  // 命令2：格式化Python代码
  // ? 这里之前想错了, 格式化python不能一段, 必须全文, 所以必须传文件名过去, 但是, 为了避免误操作, 可以要求必须有选区, 选区判断可以保留.
  const formatCommand = vscode.commands.registerCommand(
    'py4nb.formatPython',
    async () => {
      vscode.window.showInformationMessage('format from py4nb!');
      const editor = vscode.window.activeTextEditor;
      if (!editor ||
        editor.document.languageId !== 'python' ||
        editor.selection.isEmpty) {  // 检查是否有选中文本
        vscode.window.showWarningMessage('为了兼容vscode且避免误操作, 请先选中任意代码, 以便格式化整个文件.');
        return;
      }



      // 调用 Python 脚本
      const filePath = editor.document.fileName;

      const scriptPath = path.join(__dirname, '..', 'format.py');
      exec(`python3 "${scriptPath}" "${filePath}"`, (err, stdout, stderr) => {
        if (err) {
          // 错误处理
          vscode.window.showInformationMessage('格式化py失败...');
          console.error('Error object:', err);   // 输出 err 对象
          console.error('STDERR:', stderr);     // 输出标准错误流
        } else {
          const count = stdout.trim();
          vscode.window.showInformationMessage(`py格式化成功... ${count} `);
        }
      });






    }
  );



  context.subscriptions.push( exportCommand, formatCommand);
}

// This method is called when your extension is deactivated
export function deactivate() { }
