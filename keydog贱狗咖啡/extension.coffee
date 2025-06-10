vscode = require 'vscode'
{ tmpdir } = require 'os'
{ readFile: readFileAsync, writeFile: writeFileAsync } = require('fs').promises
# import { basename as fname, join as fjoin } from 'path';
{ basename: fname, join: fjoin } = require 'path'


##

marker = '# -----昭-----'

# 调试通道
odog = null

activate = (context) ->
  # 创建输出通道
  otC = vscode.window.createOutputChannel '贱狗'
  context.subscriptions.push otC
  
  odog = (msg) ->
    time = new Date().toLocaleTimeString()
    otC.appendLine "[#{time}] #{msg}"
    console.log "[贱狗#{time}]: #{msg}"
  
  odog 'KeyDog 插件已激活'
  
  disposable = vscode.commands.registerCommand 'cofee.helloWorld', ->
      vscode.window.showInformationMessage 'H道动!'
  context.subscriptions.push disposable
  
  # 注册自定义编辑器
  cep = vscode.window.registerCustomEditorProvider '贱狗.编辑器', {openCustomDocument,resolveCustomEditor}
  context.subscriptions.push cep
  

deactivate = ->

module.exports = { activate, deactivate }



# 平铺函数1：创建文档
openCustomDocument = (uri) ->
  # 在 CoffeeScript 中，函数最后一行自动返回
  uri: uri # 给resolve用的uri
  dispose: -> # 销毁的回调

# 平铺函数3：处理编辑器
resolveCustomEditor = (webviewdoc, webviewPanel) ->
  # 初始显示
  await updateWebview webviewPanel, webviewdoc
  # 监听保存事件, 虽然每个文档都注册一遍, 但是, 他们是同一个事件.
  # todo 未来移出去, 用一个注册表管理
  saveListener = vscode.workspace.onDidSaveTextDocument (doc) ->
    if doc.uri.fsPath is webviewdoc.uri.fsPath
      updateWebview webviewPanel, webviewdoc

  webviewPanel.onDidDispose -> saveListener.dispose()
  # 直接打开我们的分栏
  odog 'KeyDog 可以操作了'
  processYeFile webviewdoc

# 平铺函数2：更新 webview 内容

updateWebview = (webviewPanel, webviewdoc) ->
  try
   webviewdoc.content = await readFileAsync webviewdoc.uri.fsPath, 'utf8'
   webviewPanel.webview.html = """
     <h1> 贱狗只读展示, 请于分栏编辑文件: #{fname(webviewdoc.uri.fsPath)}</h1>
     <p><small>Updated: #{new Date().toLocaleTimeString()}</small></p>
     <pre>#{escapeHtml webviewdoc.content}</pre>
    """
  catch error
    odog "更新 webview 失败: #{error}"
    vscode.window.showErrorMessage "更新 webview 失败: #{error}"

# HTML 转义函数
escapeHtml = (text) ->
 text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')


processYeFile = (webviewdoc) ->
    fileId = webviewdoc.uri.fsPath
    fileName = fname fileId
    odog "处理文件: #{fileName}"
    
    # todo 检查是否已在处理中, 只可能是不同分栏打开同一个文件

    # if (activeFiles.has(fileId)) {
    #     odog(`文件已在编辑中: #{fileName}`);
    #     vscode.window.showWarningMessage(`文件已在编辑中: #{fileName}`);
    #     await closeEditor(doc.uri); # * 关闭重复打开的文件
    #     return;
    # }
    
    try 
      # 解析内容
      [right, left...] = webviewdoc.content.split marker
      left = left.join marker
      # 创建临时文件
      tempDir = tmpdir()
      leftPath = fjoin tempDir, "#{fileName}_left.md"
      rightPath = fjoin tempDir, "#{fileName}_right.md"
        
      # 并行异步写入两个文件
      await Promise.all [
        writeFileAsync leftPath, left
        writeFileAsync rightPath, right
      ]
      odog "创建临时文件: #{fname(leftPath)}, #{fname(rightPath)}"
        
      # 记录活动文件
      recordfile fileId, leftPath, rightPath
                  
      # 分栏打开临时文件
      # ✅ 用数组字面量 + Promise.all
      await Promise.all [
        openEditor {filePath: leftPath, viewColumn: vscode.ViewColumn.One, preserveFocus: true }
        openEditor {filePath: rightPath, viewColumn: vscode.ViewColumn.Two, preserveFocus: false }
      ]
      odog '已打开临时文件分栏'
        
    catch error
        odog "处理文件失败: #{fileName} - #{error}"
        vscode.window.showErrorMessage "处理文件失败: #{error}"
    
recordfile = (f1, f2, f3) ->
  # 记录活动文件
  # activeFiles.set fileId, { leftPath, rightPath }
  odog "记录活动文件: #{f1}, #{f2}, #{f3}"


openEditor=({filePath, viewColumn, preserveFocus}) ->
    try 
        uri = vscode.Uri.file filePath
        doc = await vscode.workspace.openTextDocument uri 
        await vscode.window.showTextDocument doc, { viewColumn, preserveFocus }
        odog "打开编辑器: #{fname filePath}"
    catch error
        odog "打开编辑器失败: #{fname filePath} - #{error}"
    
