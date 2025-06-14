vscode = require 'vscode'
{ tmpdir } = require 'os'
{ readFile: readFileAsync, writeFile: writeFileAsync } = require('fs').promises
# import { basename as fname, join as fjoin } from 'path';
{ basename: fname, join: fjoin } = require 'path'


# 分隔符
marker = '# -----昭-----'

# ye文件映射表
yefamily={}

# doc映射表
docdic={}
# webview映射表
webviewdic={}


# 调试通道
odog = null
ddog=null

activate = (context) ->
  # 创建输出通道
  otC = vscode.window.createOutputChannel '贱狗'
  context.subscriptions.push otC
  
  odog = (msg) ->
    time = new Date().toLocaleTimeString()
    otC.appendLine "[#{time}] #{msg}"
    console.log "[贱狗#{time}]: #{msg}"
  
  ddog = (msg) ->
    time = new Date().toLocaleTimeString()
    otC.appendLine "[#{time}] [调试] #{JSON.stringify(msg)}"
    console.log "[贱狗#{time}][调试]: #{JSON.stringify(msg)}"
  odog 'KeyDog 插件已激活'

  reasons = ['未知', '人工保存', '自动保存', '失焦保存']
  
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument (doc) ->
      odog "DidClose: #{vscode.workspace.asRelativePath doc.fileName}"

    vscode.window.onDidChangeVisibleTextEditors (es) ->
      names = (if e.document.uri.scheme is 'file' then fname(e.document.fileName) else "[#{e.document.uri.scheme}]" for e in es).join ','
      odog "DidChangeVisible: #{names}"

    vscode.workspace.onWillSaveTextDocument (e) ->
      odog "WillSave: #{reasons[e.reason] or e.reason}: #{vscode.workspace.asRelativePath e.document.fileName}"

    vscode.workspace.onDidOpenTextDocument (doc) ->
      name = if doc.uri.scheme is 'file' then fname(doc.fileName) else "[#{doc.uri.scheme}]"
      odog "DidOpen: #{name}"

    vscode.window.onDidChangeTextEditorViewColumn (e) ->
      odog "DidChangeViewColumn: #{fname e.textEditor.document.fileName} -> 第#{e.textEditor.viewColumn}栏"

    vscode.window.onDidChangeTextEditorOptions (e) ->
      odog "DidChangeOptions: #{fname e.textEditor.document.fileName}"

    vscode.window.onDidChangeWindowState (e) ->
      odog "DidChangeWindowState: focused=#{e.focused}"
    

  )





  
  disposable = vscode.commands.registerCommand 'cofee.helloWorld', ->
      vscode.window.showInformationMessage 'H道动!'
  context.subscriptions.push disposable

  # 验证热退出
  hotExitSetting = vscode.workspace.getConfiguration('files').get('hotExit')
  odog "当前热退出设置: #{hotExitSetting}"


  # 注册自定义编辑器
  cep = vscode.window.registerCustomEditorProvider '贱狗.编辑器', {openCustomDocument,resolveCustomEditor}
  context.subscriptions.push cep
  
  odog '注册自定义编辑器成功'
  
  # 监听保存事件
  saveListener = vscode.workspace.onDidSaveTextDocument (doc) ->
   odog '保存事件: 开始'
   fsPath = doc.uri.fsPath
   odog "保存事件: path: #{fname(fsPath)}"
   unless fsPath of yefamily
    odog "保存事件: #{fname fsPath}, 不是贱狗文件, 跳过"
    return
   content=await handlesavefile(fsPath)
   {dad} = yefamily[fsPath]
   await updateWebview dad,content
   odog "更新webview: #{fname dad}"
  # 只需要在插件卸载时清理一次
  context.subscriptions.push saveListener
  odog '注册保存事件监听成功'

  # * 注册tab变化.
  tabCloseListener = vscode.window.tabGroups.onDidChangeTabs (e) ->
    odog "onDidChangeTabs: focused=#{e.closed.length}"
    for tab in e.closed
      fp=tab.input?.uri?.fsPath
      unless fp of yefamily
        odog "关闭事件:跳过: #{fname fp}, "
        odog "onDidChangeTabs 不是贱狗文件, 跳过:  - #{tab.label} (#{tab.group.viewColumn})"
        continue
      odog "onDidChangeTabs: #{tab.label} 分栏:(#{tab.group.viewColumn})\n  路径: #{fp}"
      await handlesavefile fp
      await handleclose fp 
  
  # 注册销毁
  context.subscriptions.push tabCloseListener

  # * 监听焦点同步
  vscode.window.onDidChangeActiveTextEditor (editor) ->
    name = editor and (if editor.document.uri.scheme is 'file' then vscode.workspace.asRelativePath(editor.document.fileName) else "[#{editor.document.uri.scheme}]") or 'none'
    odog "DidChangeActive: #{name}"
    fp=editor?.document?.uri?.fsPath
    unless fp of yefamily
      odog "关闭事件:跳过: #{fname fp}, "
      return
    odog "焦点同步: 文件获得焦点: #{fname fp}"
    await handlefocusfile fp



deactivate = ->

module.exports = { activate, deactivate }

handlesavefile = (fsPath) ->
  odog "保存文件: 开始: #{fsPath}"
  {dad, brother, isright} = yefamily[fsPath]
  brocon=docdic[brother]?.getText()
  mycon=docdic[fsPath]?.getText()
  unless brocon? and mycon?
    odog "保存文件: 兄弟或我的内容不存在, 无法保存"
    return
  dadcon = if isright then mycon+marker+brocon  else brocon+marker+mycon
  await writeFileAsync dad, dadcon, 'utf8'
  odog "保存文件:完成: #{fname dad}"
  return dadcon





handleclose = (fsPath) ->
 # 处理关闭事件
 odog "处理handleclose开始: #{fname fsPath}"
 {dad, brother, isright} = yefamily[fsPath]
 delete yefamily[fsPath]
 delete yefamily[brother]


 await closebyfspath dad
 odog "处理handleclose:关闭父文件: #{fname dad}"
 await closebyfspath brother
 odog "处理handleclose: 关闭兄弟文件: #{fname brother}"


closebyfspath= (fspath) ->
  odog "处理closebyfspath开始: #{fname fspath}"
  # * 这个方案有bug, 会关闭不干净, 因为事件之间互相影响了.
  # await vscode.window.showTextDocument(vscode.Uri.file(fspath))
  # await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
  # * 原本的方案, 找到tab再关闭, 这个方案更稳妥
  target = vscode.window.tabGroups.all
    .flatMap((group) -> group.tabs)
    .find((t) -> t.input?.uri?.fsPath == fspath)
  await vscode.window.tabGroups.close(target) if target?
  odog "处理closebyfspath完成: #{fname fspath}, 存在: #{target?}" 



handlefocusfile = (fsPath) ->
  # 处理焦点同步事件
  odog "处理 handlefocusfile 开始: #{fname fsPath}"
  {brother, isright} = yefamily[fsPath]
  viewColumn = if isright then vscode.ViewColumn.One else vscode.ViewColumn.Two
  # 其实这个方案更稳妥....
  # 找到兄弟tab
  # target = vscode.window.tabGroups.all
  #   .flatMap((group) -> group.tabs)
  #   .find((t) -> t.input?.uri?.fsPath == brother)
  await vscode.window.showTextDocument(vscode.Uri.file(brother), {
    viewColumn: viewColumn
    preserveFocus: true  # 显示但不抢焦点
  }) # if target?




# 平铺函数1：创建文档
openCustomDocument = (uri) ->
  # 在 CoffeeScript 中，函数最后一行自动返回
  uri: uri # 给resolve用的uri
  dispose: -> # 销毁的回调

# 平铺函数3：处理编辑器
resolveCustomEditor = (webviewdoc, webviewPanel) ->
  yepath= webviewdoc.uri.fsPath
  webviewdic[yepath]= {webviewdoc, webviewPanel}

  # 初始显示
  await updateWebview yepath
  # 直接打开我们的分栏
  odog '编辑器完成, 可以操作了'
  await processYeFile webviewdoc
  odog "编辑器完成,处理贱狗文件完成#{yepath}"
  odog "编辑器完成,yefamily:#{(fname i for i in Object.keys(yefamily))}"

# 第一步, 更新 webview 内容, 并且赋值webviewdoc.content

updateWebview = (yepath, content=null) ->
  {webviewPanel, webviewdoc} = webviewdic[yepath]
  unless webviewPanel? and webviewdoc?
    odog "webviewPanel 或 webviewdoc 不存在, 无法更新"
    return 
  webviewdoc.content = if content? then content else await readFileAsync yepath, 'utf8'
  webviewPanel.webview.html = """
    <h1> 贱狗只读展示, 请于分栏编辑文件: #{fname(yepath)}</h1>
    <p><small>Updated: #{new Date().toLocaleTimeString()}</small></p>
    <pre>#{escapeHtml webviewdoc.content}</pre>"""


# HTML 转义函数
escapeHtml = (text) ->
 text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')

# 第二步, 处理webviewdoc.content
processYeFile = (webviewdoc) ->
  fileId = webviewdoc.uri.fsPath
  fileName = fname fileId
  odog "处理文件: #{fileName}"
      

  # 解析内容
  [right, left...] = webviewdoc.content.split marker
  left = left.join marker
  # 创建临时文件
  tempDir = tmpdir()
  leftPath = fjoin tempDir, "#{fileName}_left.md"
  rightPath = fjoin tempDir, "#{fileName}_right.md"

    
  # 并行异步写入两个文件
  await Promise.all [
    writeFileAsync leftPath, left, 'utf8'
    writeFileAsync rightPath, right, 'utf8'
  ]
  odog "创建临时文件: #{fname(leftPath)}, #{fname(rightPath)}"
    
  # 记录活动文件
  recordfile {dad:fileId, left:leftPath, right:rightPath}
              
  # 分栏打开临时文件
  # ✅ 用数组字面量 + Promise.all
  await Promise.all [
    openEditor {filePath: leftPath, viewColumn: vscode.ViewColumn.One, preserveFocus: true }
    openEditor {filePath: rightPath, viewColumn: vscode.ViewColumn.Two, preserveFocus: false }
  ]
  odog '已打开临时文件分栏'


# * 更新yefamily
recordfile = ({dad,left,right}) ->
 yefamily[left] ={dad, brother: right, isright: false}
 yefamily[right] = {dad, brother: left, isright: true}
 # * 虽然简洁, 但是, 不如上面直白
 # yefamily[s]={dad, brother:twin[1-i] } for s,i in twin
 # 记录活动文件
 odog "记录活动文件: #{fname dad}, #{fname left}, #{fname right}"



openEditor=({filePath, viewColumn, preserveFocus}) ->
  odog "openEditor打开编辑器: #{fname filePath}, viewColumn: #{viewColumn}, preserveFocus: #{preserveFocus}"
  uri = vscode.Uri.file filePath
  doc = await vscode.workspace.openTextDocument uri 
  editor = await vscode.window.showTextDocument doc, { viewColumn, preserveFocus }

  # 全局docdic
  docdic[filePath] = doc


  odog "openEditor文件状态: #{fname filePath}, isDirty: #{doc.isDirty}, isUntitled: #{doc.isUntitled}"
  
