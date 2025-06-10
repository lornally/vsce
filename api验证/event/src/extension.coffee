# * coffee 版本, 但是, 并未配置编译, 所以仅供参考
vscode = require 'vscode'
{basename: fname} = require 'path'

outputChannel = null
odog = null

activate = (context) ->
  outputChannel = vscode.window.createOutputChannel '贱狗'
  context.subscriptions.push outputChannel
  
  odog = (msg) ->
    time = new Date().toLocaleTimeString()
    outputChannel.appendLine "[#{time}] #{msg}"
    console.log "[贱狗#{time}]: #{msg}"
  
  odog 'KeyDog 插件已激活'

  context.subscriptions.push vscode.commands.registerCommand 'event.helloWorld', ->
    vscode.window.showInformationMessage 'Hello World from event!'

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

    vscode.window.onDidChangeTextEditorViewColumn (e) ->
      odog "DidChangeViewColumn: #{fname e.textEditor.document.fileName} -> 第#{e.textEditor.viewColumn}栏"

    vscode.window.onDidChangeTextEditorOptions (e) ->
      odog "DidChangeOptions: #{fname e.textEditor.document.fileName}"

    vscode.window.onDidChangeWindowState (e) ->
      odog "DidChangeWindowState: focused=#{e.focused}"
  )

deactivate = ->

module.exports = {activate, deactivate}
