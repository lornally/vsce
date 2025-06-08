 const vscode = require('vscode');
   function activate() {
     const testChannel = vscode.window.createOutputChannel('测试通道');
     testChannel.appendLine('输出通道API测试成功');
     testChannel.show();
   }
   module.exports = { activate }