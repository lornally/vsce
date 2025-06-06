# 特别提示: 本项目已经放弃维护.

格式化Qml为紧凑格式, QML作为界面描述格式, 理应更紧凑一些.




## Features
可以命令面板调用或者者快捷键调用.
* 快捷键:
    * "win": "ctrl+alt+t",
    * "mac": "ctrl+option+tab",
* 命令面板: 
  * qmltight: tight the qml

## Requirements
* 为了和系统的快捷键不冲突, 因此有2个妥协
  * 用户要修改快捷键配置文件, 解除有选区的情况下的系统快捷键绑定.
  * 虽然都是全文格式化/紧凑化, 但是, 为了不冲突, 还是要求用户有任意的选区, 才能格式化/紧凑化
* 用户必须把tab转化为空格, 文件中不应该有tab, 格式化工具并不知道如何处理tab, 一个tab等于多少个空格是完全无法预料的事情. 虽然vscode会自动把tab转化为空格, 但是, 用户直接用vscode打开的文件, 还是可能会有tab的.

* 请用户修改快捷键, 避免系统冲突:
  * keybindings.json
```json
 {
    "key": "ctrl+tab",
    "command": "-workbench.action.quickOpenPreviousRecentlyUsedEditorInGroup",
    "when": "editorHasSelection"
  },
  {
    "key": "ctrl+tab", 
    "command": "-workbench.action.openNextRecentlyUsedEditorInGroup",
    "when": "editorHasSelection"
  },

```


## Extension Settings

无

## Known Issues
* 不处理正则, 因此正则有注释符号或者字符串符号, 就会导致整体解析出错, 结果就不是预期结果.
* ~~因为这个原因,tight之后的文件会单独存放, 本插件并不会修改用户现有的原文件.~~
* 插件目前运转正常, 因此, 改为了更符合习惯的替换原文件的方式, 尽管他依旧不支持正则表达式.


