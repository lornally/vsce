// Generated by CoffeeScript 2.7.0
(function() {
  var activate, closebyfspath, ddog, deactivate, docdic, escapeHtml, fjoin, fname, handleclose, handlefocusfile, handlesavefile, marker, odog, openCustomDocument, openEditor, processYeFile, readFileAsync, recordfile, resolveCustomEditor, tmpdir, updateWebview, vscode, webviewdic, writeFileAsync, yefamily;

  vscode = require('vscode');

  ({tmpdir} = require('os'));

  ({
    readFile: readFileAsync,
    writeFile: writeFileAsync
  } = require('fs').promises);

  ({
    // import { basename as fname, join as fjoin } from 'path';
    basename: fname,
    join: fjoin
  } = require('path'));

  // 分隔符
  marker = '# -----昭-----';

  // ye文件映射表
  yefamily = {};

  // doc映射表
  docdic = {};

  // webview映射表
  webviewdic = {};

  // 调试通道
  odog = null;

  ddog = null;

  activate = function(context) {
    var cep, disposable, hotExitSetting, otC, reasons, saveListener, tabCloseListener;
    // 创建输出通道
    otC = vscode.window.createOutputChannel('贱狗');
    context.subscriptions.push(otC);
    odog = function(msg) {
      var time;
      time = new Date().toLocaleTimeString();
      otC.appendLine(`[${time}] ${msg}`);
      return console.log(`[贱狗${time}]: ${msg}`);
    };
    ddog = function(msg) {
      var time;
      time = new Date().toLocaleTimeString();
      otC.appendLine(`[${time}] [调试] ${JSON.stringify(msg)}`);
      return console.log(`[贱狗${time}][调试]: ${JSON.stringify(msg)}`);
    };
    odog('KeyDog 插件已激活');
    reasons = ['未知', '人工保存', '自动保存', '失焦保存'];
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(function(doc) {
      return odog(`DidClose: ${vscode.workspace.asRelativePath(doc.fileName)}`);
    }), vscode.window.onDidChangeVisibleTextEditors(function(es) {
      var e, names;
      names = ((function() {
        var j, len, results;
        if (e.document.uri.scheme === 'file') {
          return fname(e.document.fileName);
        } else {
          results = [];
          for (j = 0, len = es.length; j < len; j++) {
            e = es[j];
            results.push(`[${e.document.uri.scheme}]`);
          }
          return results;
        }
      })()).join(',');
      return odog(`DidChangeVisible: ${names}`);
    }), vscode.workspace.onWillSaveTextDocument(function(e) {
      return odog(`WillSave: ${reasons[e.reason] || e.reason}: ${vscode.workspace.asRelativePath(e.document.fileName)}`);
    }), vscode.workspace.onDidOpenTextDocument(function(doc) {
      var name;
      name = doc.uri.scheme === 'file' ? fname(doc.fileName) : `[${doc.uri.scheme}]`;
      return odog(`DidOpen: ${name}`);
    }), vscode.window.onDidChangeTextEditorViewColumn(function(e) {
      return odog(`DidChangeViewColumn: ${fname(e.textEditor.document.fileName)} -> 第${e.textEditor.viewColumn}栏`);
    }), vscode.window.onDidChangeTextEditorOptions(function(e) {
      return odog(`DidChangeOptions: ${fname(e.textEditor.document.fileName)}`);
    }), vscode.window.onDidChangeWindowState(function(e) {
      return odog(`DidChangeWindowState: focused=${e.focused}`);
    }));
    disposable = vscode.commands.registerCommand('cofee.helloWorld', function() {
      return vscode.window.showInformationMessage('H道动!');
    });
    context.subscriptions.push(disposable);
    // 验证热退出
    hotExitSetting = vscode.workspace.getConfiguration('files').get('hotExit');
    odog(`当前热退出设置: ${hotExitSetting}`);
    // 注册自定义编辑器
    cep = vscode.window.registerCustomEditorProvider('贱狗.编辑器', {openCustomDocument, resolveCustomEditor});
    context.subscriptions.push(cep);
    odog('注册自定义编辑器成功');
    
    // 监听保存事件
    saveListener = vscode.workspace.onDidSaveTextDocument(async function(doc) {
      var content, dad, fsPath;
      odog('保存事件: 开始');
      fsPath = doc.uri.fsPath;
      odog(`保存事件: path: ${fname(fsPath)}`);
      if (!(fsPath in yefamily)) {
        odog(`保存事件: ${fname(fsPath)}, 不是贱狗文件, 跳过`);
        return;
      }
      content = (await handlesavefile(fsPath));
      ({dad} = yefamily[fsPath]);
      await updateWebview(dad, content);
      return odog(`更新webview: ${fname(dad)}`);
    });
    // 只需要在插件卸载时清理一次
    context.subscriptions.push(saveListener);
    odog('注册保存事件监听成功');
    // * 注册tab变化.
    tabCloseListener = vscode.window.tabGroups.onDidChangeTabs(async function(e) {
      var fp, j, len, ref, ref1, ref2, results, tab;
      odog(`onDidChangeTabs: focused=${e.closed.length}`);
      ref = e.closed;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        tab = ref[j];
        fp = (ref1 = tab.input) != null ? (ref2 = ref1.uri) != null ? ref2.fsPath : void 0 : void 0;
        if (!(fp in yefamily)) {
          odog(`关闭事件:跳过: ${fname(fp)}, `);
          odog(`onDidChangeTabs 不是贱狗文件, 跳过:  - ${tab.label} (${tab.group.viewColumn})`);
          continue;
        }
        odog(`onDidChangeTabs: ${tab.label} 分栏:(${tab.group.viewColumn})\n  路径: ${fp}`);
        await handlesavefile(fp);
        results.push((await handleclose(fp)));
      }
      return results;
    });
    
    // 注册销毁
    context.subscriptions.push(tabCloseListener);
    // * 监听焦点同步
    return vscode.window.onDidChangeActiveTextEditor(async function(editor) {
      var fp, name, ref, ref1;
      name = editor && (editor.document.uri.scheme === 'file' ? vscode.workspace.asRelativePath(editor.document.fileName) : `[${editor.document.uri.scheme}]`) || 'none';
      odog(`DidChangeActive: ${name}`);
      fp = editor != null ? (ref = editor.document) != null ? (ref1 = ref.uri) != null ? ref1.fsPath : void 0 : void 0 : void 0;
      if (!(fp in yefamily)) {
        odog(`关闭事件:跳过: ${fname(fp)}, `);
        return;
      }
      odog(`焦点同步: 文件获得焦点: ${fname(fp)}`);
      return (await handlefocusfile(fp));
    });
  };

  deactivate = function() {};

  module.exports = {activate, deactivate};

  handlesavefile = async function(fsPath) {
    var brocon, brother, dad, dadcon, isright, mycon, ref, ref1;
    odog(`保存文件: 开始: ${fsPath}`);
    ({dad, brother, isright} = yefamily[fsPath]);
    brocon = (ref = docdic[brother]) != null ? ref.getText() : void 0;
    mycon = (ref1 = docdic[fsPath]) != null ? ref1.getText() : void 0;
    if (!((brocon != null) && (mycon != null))) {
      odog("保存文件: 兄弟或我的内容不存在, 无法保存");
      return;
    }
    dadcon = isright ? mycon + marker + brocon : brocon + marker + mycon;
    await writeFileAsync(dad, dadcon, 'utf8');
    odog(`保存文件:完成: ${fname(dad)}`);
    return dadcon;
  };

  handleclose = async function(fsPath) {
    var brother, dad, isright;
    // 处理关闭事件
    odog(`处理handleclose开始: ${fname(fsPath)}`);
    ({dad, brother, isright} = yefamily[fsPath]);
    delete yefamily[fsPath];
    delete yefamily[brother];
    await closebyfspath(dad);
    odog(`处理handleclose:关闭父文件: ${fname(dad)}`);
    await closebyfspath(brother);
    return odog(`处理handleclose: 关闭兄弟文件: ${fname(brother)}`);
  };

  closebyfspath = async function(fspath) {
    var target;
    odog(`处理closebyfspath开始: ${fname(fspath)}`);
    // * 这个方案有bug, 会关闭不干净, 因为事件之间互相影响了.
    // await vscode.window.showTextDocument(vscode.Uri.file(fspath))
    // await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    // * 原本的方案, 找到tab再关闭, 这个方案更稳妥
    target = vscode.window.tabGroups.all.flatMap(function(group) {
      return group.tabs;
    }).find(function(t) {
      var ref, ref1;
      return ((ref = t.input) != null ? (ref1 = ref.uri) != null ? ref1.fsPath : void 0 : void 0) === fspath;
    });
    if (target != null) {
      await vscode.window.tabGroups.close(target);
    }
    return odog(`处理closebyfspath完成: ${fname(fspath)}, 存在: ${target != null}`);
  };

  handlefocusfile = async function(fsPath) {
    var brother, isright, viewColumn;
    // 处理焦点同步事件
    odog(`处理 handlefocusfile 开始: ${fname(fsPath)}`);
    ({brother, isright} = yefamily[fsPath]);
    viewColumn = isright ? vscode.ViewColumn.One : vscode.ViewColumn.Two;
    // 找到兄弟tab
    // target = vscode.window.tabGroups.all
    //   .flatMap((group) -> group.tabs)
    //   .find((t) -> t.input?.uri?.fsPath == brother)
    return (await vscode.window.showTextDocument(vscode.Uri.file(brother), {
      viewColumn: viewColumn,
      preserveFocus: true // 显示但不抢焦点
  // if target?
    }));
  };

  
  // 平铺函数1：创建文档
  openCustomDocument = function(uri) {
    return {
      // 在 CoffeeScript 中，函数最后一行自动返回
      uri: uri, // 给resolve用的uri
      dispose: function() {} // 销毁的回调
    };
  };

  
  // 平铺函数3：处理编辑器
  resolveCustomEditor = async function(webviewdoc, webviewPanel) {
    var i, yepath;
    yepath = webviewdoc.uri.fsPath;
    webviewdic[yepath] = {webviewdoc, webviewPanel};
    // 初始显示
    await updateWebview(yepath);
    // 直接打开我们的分栏
    odog('编辑器完成, 可以操作了');
    await processYeFile(webviewdoc);
    odog(`编辑器完成,处理贱狗文件完成${yepath}`);
    return odog(`编辑器完成,yefamily:${(function() {
      var j, len, ref, results;
      ref = Object.keys(yefamily);
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        i = ref[j];
        results.push(fname(i));
      }
      return results;
    })()}`);
  };

  // 第一步, 更新 webview 内容, 并且赋值webviewdoc.content
  updateWebview = async function(yepath, content = null) {
    var webviewPanel, webviewdoc;
    ({webviewPanel, webviewdoc} = webviewdic[yepath]);
    if (!((webviewPanel != null) && (webviewdoc != null))) {
      odog("webviewPanel 或 webviewdoc 不存在, 无法更新");
      return;
    }
    webviewdoc.content = content != null ? content : (await readFileAsync(yepath, 'utf8'));
    return webviewPanel.webview.html = `<h1> 贱狗只读展示, 请于分栏编辑文件: ${fname(yepath)}</h1>
<p><small>Updated: ${new Date().toLocaleTimeString()}</small></p>
<pre>${escapeHtml(webviewdoc.content)}</pre>`;
  };

  // HTML 转义函数
  escapeHtml = function(text) {
    return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  };

  // 第二步, 处理webviewdoc.content
  processYeFile = async function(webviewdoc) {
    var fileId, fileName, left, leftPath, right, rightPath, tempDir;
    fileId = webviewdoc.uri.fsPath;
    fileName = fname(fileId);
    odog(`处理文件: ${fileName}`);
    
      // 解析内容
    [right, ...left] = webviewdoc.content.split(marker);
    left = left.join(marker);
    // 创建临时文件
    tempDir = tmpdir();
    leftPath = fjoin(tempDir, `${fileName}_left.md`);
    rightPath = fjoin(tempDir, `${fileName}_right.md`);
    
    // 并行异步写入两个文件
    await Promise.all([writeFileAsync(leftPath, left, 'utf8'), writeFileAsync(rightPath, right, 'utf8')]);
    odog(`创建临时文件: ${fname(leftPath)}, ${fname(rightPath)}`);
    
    // 记录活动文件
    recordfile({
      dad: fileId,
      left: leftPath,
      right: rightPath
    });
    
    // 分栏打开临时文件
    // ✅ 用数组字面量 + Promise.all
    await Promise.all([
      openEditor({
        filePath: leftPath,
        viewColumn: vscode.ViewColumn.One,
        preserveFocus: true
      }),
      openEditor({
        filePath: rightPath,
        viewColumn: vscode.ViewColumn.Two,
        preserveFocus: false
      })
    ]);
    return odog('已打开临时文件分栏');
  };

  // * 更新yefamily
  recordfile = function({dad, left, right}) {
    yefamily[left] = {
      dad,
      brother: right,
      isright: false
    };
    yefamily[right] = {
      dad,
      brother: left,
      isright: true
    };
    // * 虽然简洁, 但是, 不如上面直白
    // yefamily[s]={dad, brother:twin[1-i] } for s,i in twin
    // 记录活动文件
    return odog(`记录活动文件: ${fname(dad)}, ${fname(left)}, ${fname(right)}`);
  };

  openEditor = async function({filePath, viewColumn, preserveFocus}) {
    var doc, editor, uri;
    odog(`openEditor打开编辑器: ${fname(filePath)}, viewColumn: ${viewColumn}, preserveFocus: ${preserveFocus}`);
    uri = vscode.Uri.file(filePath);
    doc = (await vscode.workspace.openTextDocument(uri));
    editor = (await vscode.window.showTextDocument(doc, {viewColumn, preserveFocus}));
    // 全局docdic
    docdic[filePath] = doc;
    return odog(`openEditor文件状态: ${fname(filePath)}, isDirty: ${doc.isDirty}, isUntitled: ${doc.isUntitled}`);
  };

}).call(this);
