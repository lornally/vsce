vscode = require 'vscode'

exports.activate = (context) ->
  console.log 'Congratulations, your extension "origin" is now active!'

  # Decoration type for hiding '## '
  hideHashDecorationType = vscode.window.createTextEditorDecorationType
    textDecoration: 'none'
    color: 'transparent' # Make the text invisible

  # Decoration type for styling the remaining line content
  contentDecorationType = vscode.window.createTextEditorDecorationType
    textDecoration: 'line-height: 1; font-size: 14px;'
    fontWeight: '100'
    border: '1px solid green' # Transparent border for spacing
    backgroundColor: 'rgba(38, 79, 120, 0.1)' # Title background
    before:
      contentText: '▶ ' # Vector symbol
      margin: '5px;'
    after:
      contentText: '   ' # Empty content for spacing
      backgroundColor: 'rgba(255, 0, 0, 0.2)' # Debugging background
      height: '14px' # Increase decoration height
      margin: '0 0 0 0; padding-bottom: 6px' # Simulate line spacing

  # Function to update decorations
  updateDecorations = (editor) ->
    return unless editor.document.languageId is 'tea' # Ensure it's a .tea file

    text = editor.document.getText()
    lines = text.split '\n'
    hashDecorations = []
    contentDecorations = []

    lines.forEach (line, lineNumber) ->
      if line.startsWith '## '
        # Hide '## '
        hashStartPos = new vscode.Position lineNumber, 0
        hashEndPos = new vscode.Position lineNumber, 3
        hashRange = new vscode.Range hashStartPos, hashEndPos
        hashDecorations.push range: hashRange

        # Style the remaining content
        contentStartPos = new vscode.Position lineNumber, 3
        contentEndPos = new vscode.Position lineNumber, line.length
        contentRange = new vscode.Range contentStartPos, contentEndPos
        contentDecorations.push range: contentRange

    editor.setDecorations hideHashDecorationType, hashDecorations
    editor.setDecorations contentDecorationType, contentDecorations

  # Listen to active editor changes
  vscode.window.onDidChangeActiveTextEditor (editor) ->
    updateDecorations editor if editor
  , null, context.subscriptions

  # Listen to document changes
  vscode.workspace.onDidChangeTextDocument (event) ->
    editor = vscode.window.activeTextEditor
    updateDecorations editor if editor and event.document is editor.document
  , null, context.subscriptions

  # Apply decorations to the active editor on activation
  updateDecorations vscode.window.activeTextEditor if vscode.window.activeTextEditor

exports.deactivate = ->