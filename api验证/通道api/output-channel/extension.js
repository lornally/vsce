const vscode = require('vscode');

function activate() {
  // 测试1：基础输出通道
  const testChannel = vscode.window.createOutputChannel('基础测试通道');
  testChannel.appendLine('通道创建时间: ' + new Date().toISOString());
  
  // 测试2：日志API通道
  const logger = vscode.window.createOutputChannel('日志API测试', { log: true });
  logger.info('日志API测试成功');
  
  // 测试3：显示通知
  vscode.window.showInformationMessage('测试扩展已激活', { modal: true });
  
  // 全部显示
  testChannel.show(true);
}

module.exports = {
  activate
}
