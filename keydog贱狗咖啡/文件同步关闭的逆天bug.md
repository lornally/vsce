### 核心bug, 极为逆天

###### 症状
* 一开始并没有搞清楚状况, 导致后面一通瞎分析. 一开始以为:onDidCloseTextDocument不响应.
* 6.11晚上后来发现:
  1. 对于所有其他文件都正常响应, 唯有我们的3个文件, ye源文件, 左右临时分栏markdown文件不响应
  2. 再后来, 经过等待, 发现不是不响应, 而是180s之后响应.
  3. 并且逆天的是, 之前搞得同步保存, 保存之后还要预览, 这一套都很正常....好奇怪.
  4. 并且这些临时文件关闭之后, 我如果直接打开他们, 再关闭的时候, 这个回调是正常的. 立刻执行.
* 6.12第二天发现: 
  * 把所有事件都加了log, 这样就彻底发现问题了.  didclose的延迟3分钟不是相对关闭事件本身的延迟, 而是相对registerCustomEditorProvider的resolveCustomEditor完成时间延迟.
  * 果然等待3分钟之后, 关闭事件就正常了...



### 第一天, 一通瞎分析, 都不靠谱
* 问题是出现了事件循环, 关闭a的时候, 会关闭b和父亲, 此时又触发了关闭b的事件,这里面又去关闭父亲和a......
  * 这个bug好狠, 幸亏代码是逐步添加逐步测试的, 不然根本想不到....
* 解决
  * 判断爸爸是不是还在, 如果爸爸不在, 就不要做任何操作了.
  * 干活之前把兄弟删除了, 这样兄弟的关闭事件就不会触发进一步的操作.
  * 保存文件的时候, 如果无法读取, 那么就阻断后面所有操作.
###### 尝试修改:
1. 容错
    brocon=docdic[brother]?.getText()
    mycon=docdic[fsPath]?.getText()
    unless brocon? and mycon?
    odog "兄弟或我的内容不存在, 无法保存"
    return
2. 打断循环
   * 在关闭处理中, 把兄弟爸爸等等都删除.
    delete yefamily[fsPath]
    delete yefamily[brother]
     此时依旧没有解决:
3. 不能一直盯着出错的地方看, 这次问题应该是在save因为在那里我更新了webview视图, 而这个更新是比较占用时间的. 并且他不在焦点....
   拆分了updatewebview, 把保存和显示更新分开, 依旧没有解决:
###### 此时给ai分析, ai已经黔驴了
* claude认为是临时文件夹的保护机制
* ds认为是热退出（Hot Exit）机制
* 他们都建议:
 * 换保存目录, 换了, 没用.
 * 改为监控tab事件...
###### 唯一的收获: 经过反复测试, 症状更清晰了:
* 并不是不响应关闭事件, 而是180s之后响应.

### 第二天, 逐步排查
1. 测试下, 究竟都有哪些事件, 看看180s都影响哪些事件.
2. 删减项目, 找到触发180s的最小项目, 最准确的触发方式.
###### 第一步, 拆除所有try-catch
* 这些try-catch可能掩盖了问题.

###### 第二步, 增加所有事件的日志
* vscode插件特性, 事件可以重复注册, 没毛病.
* 瞬时触发的是这两个事件: 
[09:23:18] DidChangeActive: /var/folders/cm/rz590ndn521cb7bgr_5xql800000gn/T/文本文件示例-家谱.ye_left.md
[09:23:18] onDidChangeTabs: focused=1
* 等待3分钟, 此时发现问题
[09:22:38] 编辑器完成,yefamily:文本文件示例-家谱.ye_left.md,文本文件示例-家谱.ye_right.md
[09:23:18] DidChangeActive: /var/folders/cm/rz590ndn521cb7bgr_5xql800000gn/T/文本文件示例-家谱.ye_left.md
[09:23:18] onDidChangeTabs: focused=1
[09:25:38] DidClose: /var/folders/cm/rz590ndn521cb7bgr_5xql800000gn/T/文本文件示例-家谱.ye_right.md
[09:25:38] 关闭事件: 开始
[09:25:38] 关闭事件: 匹配字典:文本文件示例-家谱.ye_left.md,文本文件示例-家谱.ye_right.md
[09:25:38] DidChangeActive: /var/folders/cm/rz590ndn521cb7bgr_5xql800000gn/T/文本文件示例-家谱.ye_left.md

* 此时发现: didclose的延迟3分钟不是相对关闭事件本身的延迟, 而是相对registerCustomEditorProvider的resolveCustomEditor完成时间延迟.


###### 第三步, 逐步拆干净.
步骤:
* 移除所有 await 操作
* 移除文件读写操作
* 移除webview更新
* 只保留基本的编辑器注册和临时文件创建

策略
* 如果逐步移除, 要测试到猴年, 所以我直接新建从0开始, 批量添加, 利于测试问题.
观察
* 果然等待3分钟之后, 关闭事件就正常了...

目前问题已经复现了.
* 排除registerCustomEditorProvider试试, 如果就是生成的临时文档, 会不会有同样的问题.

基本破案了.
* 程序新建的文件, 响应关闭操作必须在新建3分钟之后, 和CustomEditor无关, 随便什么地方新建的文件, 关闭的响应都在3分钟之后.....为毛啊?

此时还保持理智的只有ds了, 他提出3个方案:
1. 使用内存文档Untitled Documents
2. 自定义一个1s死循环, 自己控制
3. 强制标记持久化文件, 这个不见得是真的: 
await vscode.commands.executeCommand('workbench.action.files.saveAs', uri);
4. 修改vscode配置
我的想法是, 换个事件, 去监听他响应的两个事件: onDidChangeTabs

| 方案               | 靠谱程度                       |
| ------------------ | ------------------------------ |
| 内存文档           | 可能是最靠谱                   |
| 死循环             | 工作量大, 而且bug难搞          |
| vscode改配置       | 没有可执行性, 而且鬼知道会怎样 |
| 改为ondidchangetab | 还算靠谱, 但是代码要改         |


#### 不论尝试哪个方案, 都需要新建文件做尝试
###### 方案1: 内存文档
* 果然天底下没有那么好的事, 内存文档需要处理保存. 
* 用户保存内存文件时, 咱们在onDidSaveTextDocument这里处理, 但是, 此时用户已经保存了这个内存文件为实际文件了.
* 虽然咱们可以卡willsave, 然后打断事件流. 但是, 整件事又变得复杂起来了......

###### 方案2: ondidchangetab
* 好特性, 即便是在背后被关闭, 这个事件也会被唤醒.
* 基本OK. 目前没啥问题:
# * 这个可能才是该搞的.  
```coffee
    vscode.window.tabGroups.onDidChangeTabs (e) ->
      odog "onDidChangeTabs: focused=#{e.closed.length}"
      # fsPaths = (tab.input.uri.fsPath for tab in e.closed when tab.input?.uri?.fsPath)

      for tab in e.closed
        fp=tab.input?.uri?.fsPath
        unless fp && fp.endsWith(endlabel)
          odog "onDidChangeTabs不是文本:  - #{tab.label} (#{tab.group.viewColumn})"
          continue
        odog "onDidChangeTabs: #{tab.label} 分栏:(#{tab.group.viewColumn})\n  路径: #{fp}"
```