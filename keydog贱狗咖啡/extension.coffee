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
    otC.appendLine "[#{time}] [调试] #{JSON.stringify(msg)
}"
    console.log "[贱狗#{time}][调试]: #{JSON.stringify(msg)
}"
  odog 'KeyDog 插件已激活'
  
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
  target = vscode.window.tabGroups.all
    .flatMap((group) -> group.tabs)
    .find((t) -> t.input?.uri?.fsPath == fspath)
  await vscode.window.tabGroups.close(target) if target?
  odog "处理closebyfspath完成: #{fname fspath}, 存在: #{target?}" 



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
  # 监听保存事件, 虽然每个文档都注册一遍, 但是, 他们是同一个事件.
  # *  这个可以正常使用, 直接把分栏注册在onWillSaveTextDocument就OK了.
  # * 还是拿出去更合理, 因为他其实只是更新webview展示
  # saveListener = vscode.workspace.onDidSaveTextDocument (doc) ->
  #   if doc.uri.fsPath is webviewdoc.uri.fsPath
  #     updateWebview webviewPanel, webviewdoc
  
  # * 这个也很关键, 他会自动销毁注册的listener, 哈哈哈, 完美
  # webviewPanel.onDidDispose -> saveListener.dispose()
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
  try
   webviewdoc.content = if content? then content else await readFileAsync yepath, 'utf8'
   webviewPanel.webview.html = """
     <h1> 贱狗只读展示, 请于分栏编辑文件: #{fname(yepath)}</h1>
     <p><small>Updated: #{new Date().toLocaleTimeString()}</small></p>
     <pre>#{escapeHtml webviewdoc.content}</pre>
    """
  catch error
    odog "更新 webview 失败: #{error}"
    vscode.window.showErrorMessage "更新 webview 失败: #{error}"

# HTML 转义函数
escapeHtml = (text) ->
 text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')

# 第二步, 处理webviewdoc.content
processYeFile = (webviewdoc) ->
    fileId = webviewdoc.uri.fsPath
    fileName = fname fileId
    odog "处理文件: #{fileName}"
        
    try 
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
        
    catch error
        odog "处理文件失败: #{fileName} - #{error}"
        vscode.window.showErrorMessage "处理文件失败: #{error}"

# * 更新yefamily
recordfile = ({dad,left,right}) ->
 yefamily[left] ={dad, brother: right, isright: false}
 yefamily[right] = {dad, brother: left, isright: true}
 # * 虽然简洁, 但是, 不如上面直白
 # yefamily[s]={dad, brother:twin[1-i] } for s,i in twin
 # 记录活动文件
 odog "记录活动文件: #{fname dad}, #{fname left}, #{fname right}"



openEditor=({filePath, viewColumn, preserveFocus}) ->
    try 
        uri = vscode.Uri.file filePath
        doc = await vscode.workspace.openTextDocument uri 
        editor = await vscode.window.showTextDocument doc, { viewColumn, preserveFocus }

        # 全局docdic
        docdic[filePath] = doc


        odog "openEditor文件状态: #{fname filePath}, isDirty: #{doc.isDirty}, isUntitled: #{doc.isUntitled}"
        

    catch error
        odog "打开编辑器失败: #{fname filePath} - #{error}"
    