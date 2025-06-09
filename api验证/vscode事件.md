| 事件类型     | 关键事件                          | 触发时机     | 编辑器状态 |
| :----------- | :-------------------------------- | :----------- | :--------- |
| **文件打开** |                                   |              |            |
|              | `onDidOpenTextDocument`           | 内容加载后   | **未创建** |
|              | `onDidChangeVisibleTextEditors-1  | 编辑器创建后 | 已创建     |
|              | `onDidChangeActiveTextEditor-1    | 编辑器激活后 | 已激活     |
| **文件关闭** | `onWillSaveTextDocument`          | 保存前       | 存在       |
|              | `onDidSaveTextDocument`           | 保存后       | 存在       |
|              | `onDidChangeActiveTextEditor-2    | 焦点转移     | 存在       |
|              | `onDidChangeVisibleTextEditors-2  | 编辑器隐藏   | 存在       |
|              | `onDidCloseTextDocument`          | 内存卸载     | 已销毁     |
| **标签切换** | `onDidChangeActiveTextEditor-3    | 焦点变化     | 存在       |
|              | `onDidChangeTextEditorViewColumn` | 面板移动     | 存在       |



| 时序 | 文件打开                      |                  |        |
| ---- | ----------------------------- | ---------------- | ------ |
|      | 事件                          | vscode工作       | 可能性 |
|      |                               |                  |        |
| 2    |                               | 文件加载         |        |
| 3    | onDidOpenTextDocument         | TextDocument可用 |        |
| 4    |                               | 编辑器创建       |        |
| 5    | onDidChangeVisibleTextEditors | editor可用       |        |
| 6    |                               | 激活编辑器(焦点) |        |
| 7    | onDidChangeActiveTextEditor   |                  |        |
|      |                               |                  |        |

#### 打开命令是可以拦截的

* 拦截vscode默认打开行为(不建议)

```typescript
vscode.commands.registerCommand('vscode.open', (uri) => {
    if (uri.path.endsWith('.lock')) {
        vscode.window.showErrorMessage('禁止打开锁文件！');
        return; // 阻断默认打开行为
    }
    return vscode.commands.executeCommand('_originalOpen', uri); // 调用原始命令
});
```

需在`package.json`中声明覆盖默认打开命令:

```json
"contributes": {
    "commands": [{
        "command": "vscode.open",
        "title": "Open File (Custom)"
    }]
}
```



**文件关闭**：

## 关闭未保存的激活文件

|      | 文件关闭                        |                          |                                                              |      |
| :--- | :------------------------------ | :----------------------- | :----------------------------------------------------------- | ---- |
| 时序 | 事件                            | VS Code 工作流程         | 干预可能性/触发条件                                          | 必选 |
| 1    | `onWillSaveTextDocument`        | 保存前（如有未保存更改） | 有未保存, 可延迟/取消                                        | 否   |
| 2    |                                 | 文件保存到磁盘           |                                                              |      |
| 3    | `onDidSaveTextDocument`         | 文件保存完成             | 有未保存                                                     | 否   |
| 4    | `onDidChangeVisibleTextEditors` | 编辑器不再可见           | 此瞬间没有editor, 即便还有别的文件打开, 参数editors列表也是空的. | 否   |
|      |                                 |                          |                                                              |      |
| 5    | `onDidChangeActiveTextEditor`   | 激活编辑器转移到其他文件 | 此时本文件的editor=none                                      | 否   |
|      |                                 |                          |                                                              |      |
| 6    |                                 | 编辑器视图销毁           |                                                              |      |
| 7    | `onDidCloseTextDocument`        | TextDocument 从内存卸载  | 所有编辑器关闭后触发                                         | 是   |

- **`onDidCloseTextDocument` 触发条件**:当文件的所有编辑器标签都关闭时
- **自动保存**:会触发 `onWillSaveTextDocument` 和 `onDidSaveTextDocument`, 判断使用e.reason值: ['未知','人工保存', '自动保存', '失焦保存']

```sh
# 一次关闭的完整log
[12:16:27] WillSave: 失焦保存: 脑图_keydog_贱狗/业务和系统分析BASA/数据结构/测试文件/文件.md
[12:16:27] DidSave: 脑图_keydog_贱狗/业务和系统分析BASA/数据结构/测试文件/文件.md
[12:16:27] DidChangeVisible: [output] # 这里出现的是output通道, 如果没开下方面板, 则此时editors列表为空.
[12:16:27] DidChangeActive: none
[12:16:27] DidClose: 脑图_keydog_贱狗/业务和系统分析BASA/数据结构/测试文件/文件.md
[12:16:27] DidChangeVisible: [output],文本文件示例-家谱.ye
[12:16:27] DidChangeActive: 脑图_keydog_贱狗/业务和系统分析BASA/数据结构/测试文件/文本文件示例-家谱.ye
```





**标签切换事件补充**：

| 时序 | 事件                              | 触发场景               | 插件干预可能性      |
| :--- | :-------------------------------- | :--------------------- | :------------------ |
| 1    | `onDidChangeActiveTextEditor`     | 切换到不同编辑器标签   | ❌ 无法阻止切换      |
| 2    | `onDidChangeTextEditorSelection`  | 光标位置或选择区域变化 | ❌ 无法阻止选择      |
| 3    | `onDidChangeTextEditorViewColumn` | 编辑器移动到不同面板   | ❌ 无法阻止移动      |
| 4    | `onDidChangeVisibleTextEditors`   | 编辑器集合变化         | ❌ 无法阻止显示/隐藏 |



|      | tab切换                              |                        |                     |
| :--- | :----------------------------------- | :--------------------- | :------------------ |
| 时序 | 事件                                 | VS Code 工作流程       | 插件干预可能性      |
| 1    | `onDidChangeActiveTextEditor`        | 激活编辑器变化         | ❌ 无法阻止切换      |
| 2    | `onDidChangeTextEditorSelection`     | 选择区域变化           | ❌ 无法阻止选择      |
| 3    | `onDidChangeTextEditorVisibleRanges` | 可见区域变化           | ❌ 无法阻止滚动      |
| 4    | `onDidChangeTextEditorViewColumn`    | 编辑器在不同面板间移动 | ❌ 无法阻止移动      |
| 5    | `onDidChangeVisibleTextEditors`      | 可见编辑器集合变化     | ❌ 无法阻止显示/隐藏 |





