vscode = require 'vscode'
{ basename: fname, join: fjoin } = require 'path'
# 需要添加
{ tmpdir } = require 'os'
{ writeFile: writeFileAsync } = require('fs').promises
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

    vscode.window.onDidChangeActiveTextEditor (editor) ->
      name = editor and (if editor.document.uri.scheme is 'file' then vscode.workspace.asRelativePath(editor.document.fileName) else "[#{editor.document.uri.scheme}]") or 'none'
      odog "DidChangeActive: #{name}"

    vscode.window.onDidChangeVisibleTextEditors (es) ->
      names = (if e.document.uri.scheme is 'file' then fname(e.document.fileName) else "[#{e.document.uri.scheme}]" for e in es).join ','
      odog "DidChangeVisible: #{names}"

    vscode.workspace.onWillSaveTextDocument (e) ->
      odog "WillSave: #{reasons[e.reason] or e.reason}: #{vscode.workspace.asRelativePath e.document.fileName}"

    vscode.workspace.onDidSaveTextDocument (doc) ->
      odog "DidSave: #{vscode.workspace.asRelativePath doc.fileName}"

    vscode.workspace.onDidOpenTextDocument (doc) ->

      name = if doc.uri.scheme is 'file' then fname(doc.fileName) else "[#{doc.uri.scheme}]"
      odog "DidOpen: #{name}"
      unless doc.uri.scheme is 'file'
        odog "DidOpen: 不是文件类型, 跳过处理: #{name}"
        return
      # 判断文件扩展名
      
      if name.endsWith('.贱狗') or name.endsWith('.jian')
        odog "DidOpen: 发现贱狗文件: #{name}"
        # 记录文件
        recordfile {dad:doc.fileName, left:doc.fileName, right:doc.fileName}
        # 打开编辑器
        openEditor {filePath: doc.fileName, viewColumn: vscode.ViewColumn.One, preserveFocus: true }
      else
        odog "DidOpen: 不是贱狗文件, 跳过处理: #{name}"

    vscode.window.onDidChangeTextEditorViewColumn (e) ->
      odog "DidChangeViewColumn: #{fname e.textEditor.document.fileName} -> 第#{e.textEditor.viewColumn}栏"

    vscode.window.onDidChangeTextEditorOptions (e) ->
      odog "DidChangeOptions: #{fname e.textEditor.document.fileName}"

    vscode.window.onDidChangeWindowState (e) ->
      odog "DidChangeWindowState: focused=#{e.focused}"
    vscode.window.tabGroups.onDidChangeTabs (e) ->
      odog "onDidChangeTabs: focused=#{e.closed.length}"

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
  # 全局Tab关闭事件监听
  tabCloseListener = vscode.workspace.onDidCloseTextDocument (doc) -> 
   # 处理关闭事件
   odog '关闭事件: 开始'
   # fsPath = doc.uri.fsPath
   # odog "关闭事件: path: #{fname fsPath}"
   # odog "关闭事件: yefamily[fsPath]: #{yefamily[fsPath]}"
   # unless fsPath of yefamily
   #  odog "关闭事件:跳过: #{fname fsPath}, 不是贱狗文件, 跳过"
   #  return
   odog "关闭事件: 匹配字典:#{(fname i for i in Object.keys(yefamily))}"
   # await handlesavefile fsPath
   # await handleclose fsPath 
  odog '关闭事件: 监听成功'
  # 在第79行后添加这些行
  odog "关闭事件监听器类型: #{typeof tabCloseListener}"
  odog "监听器对象存在: #{tabCloseListener?}"

  
  # 注册销毁
  context.subscriptions.push tabCloseListener


deactivate = ->

module.exports = { activate, deactivate }

handlesavefile = (fsPath) ->
  odog "保存文件: 开始: #{fsPath}"



handleclose = (fsPath) ->
 # 处理关闭事件
 odog "处理handleclose开始: #{fname fsPath}"



# 平铺函数1：创建文档
openCustomDocument = (uri) ->
  odog "openCustomDocument: #{uri.fsPath}"
  # 在 CoffeeScript 中，函数最后一行自动返回
  uri: uri # 给resolve用的uri
  dispose: -> # 销毁的回调

# 平铺函数3：处理编辑器
resolveCustomEditor = (webviewdoc, webviewPanel) ->
  odog "resolveCustomEditor开始"
  odog "resolveCustomEditor: #{webviewdoc.uri.fsPath}"
  
  fileId = webviewdoc.uri.fsPath
  webviewdic[fileId]= {webviewdoc, webviewPanel}
  fileName = fname fileId
  odog "处理文件: #{fileName}"
  updateWebview fileId, "贱狗编辑器已打开: #{fileName}"
      

  # 解析内容
  [right, left...] = webviewdoc.content.split marker
  left = left.join marker
  # 创建临时文件
  tempDir = tmpdir()
  leftPath = fjoin tempDir, "#{fileName}_left.md"
  rightPath = fjoin tempDir, "#{fileName}_right.md"
  # leftPath =  "#{fileId}_left.md"
  # rightPath = "#{fileId}_right.md"
  # * ai说是临时目录问题. 咱们尝试下.
    
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


updateWebview = (yepath, content=null) ->
  {webviewPanel, webviewdoc} = webviewdic[yepath]
  unless webviewPanel? and webviewdoc?
    odog "webviewPanel 或 webviewdoc 不存在, 无法更新"
    return 
  webviewdoc.content += if content? then content else '没有内容'
  webviewPanel.webview.html = """
    <h1> 贱狗只读展示, 请于分栏编辑文件: #{fname(yepath)}</h1>
    <p><small>Updated: #{new Date().toLocaleTimeString()}</small></p>
    <pre>#{escapeHtml webviewdoc.content}</pre>"""

# HTML 转义函数
escapeHtml = (text) ->
 text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')



openEditor=({filePath, viewColumn, preserveFocus}) ->
  odog "openEditor打开编辑器: #{fname filePath}, viewColumn: #{viewColumn}, preserveFocus: #{preserveFocus}"
  uri = vscode.Uri.file filePath
  doc = await vscode.workspace.openTextDocument uri 
  editor = await vscode.window.showTextDocument doc, { viewColumn, preserveFocus }

  # 全局docdic
  docdic[filePath] = doc


  odog "openEditor文件状态: #{fname filePath}, isDirty: #{doc.isDirty}, isUntitled: #{doc.isUntitled}"
  
