# py4nb README

提取ipynb代码的插件, 同时提供python格式化服务

## Features
* 用属性tag提取ipynb代码过于隐晦, 很难判断状态
* 改进: 注释代码注入关键字来标识提取代码
```python
# ,export 这里声明从下一行开始导出. 注意export是关键字, 他和#之间有一个空格和一个逗号.
# ,test 这里声明本cell剩余部分是测试代码, 不需要提取, !!! 注意, 忽略所有行, 后面就算有export也不生效了.!!!
```


## 使用
* 命令面板.
  * 打开命令面板 `ctrl+shift+p` 或者 `cmd+shift+p`
  * 输入 `py4nb` 选择命令: `export marked cells to python file`
* 快捷键
  * 提取代码:
  *"key": "ctrl+shift+e",
  * "mac": "ctrl+cmd+e",

## 语法高亮
* 如果需要语法高亮, 需要直接在本插件指定本插件的theme
  * 本插件theme: 这个就是正常的vscode dark加了语法高亮. 
* (建议)可以使用使用支持本语法高亮的theme, 支持本插件语法高亮的theme有:
  * zedme
  * ...





## 附加功能: 统一python缩进(需要配置)
本插件还提供了一个格式化python代码的功能, 因为导出的python代码是从多个格子出来的, 因为可能缩进会非常不统一, 整体会非常松散, 因此提供了一个统一缩进的功能.
* 格式化python(需要选区和用户设置)      
  * "key": "ctrl+shift+f",
  * "mac": "ctrl+tab",
### 格式化python时, 需要一定的用户设置
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

## 格式化功能有Known Issues
* 不处理正则, 因此正则有注释符号或者字符串符号, 就会导致整体解析出错, 结果就不是预期结果.
* 字符串处理非常潦草, 
  * 并未考虑字符串中的字符串符号.
  * 并未考虑注释中的字符串符号, 以及由此引发的字符串中的注释, 
* 基于缩进的代码是无法部分处理的, 因为他的缩进是互相关联的, 部分处理大概率导致无法预期的结果, 所以每次都是整体处理全py文件. 
* 为了和系统的快捷键不冲突, 因此有2个妥协
  * 用户要修改快捷键配置文件, 解除有选区的情况下的系统快捷键绑定.
  * 虽然都是全文格式化/紧凑化, 但是, 为了不冲突, 还是要求用户有任意的选区, 才能格式化/紧凑化
* 用户必须把tab转化为空格, 文件中不应该有tab, 格式化工具并不知道如何处理tab, 一个tab等于多少个空格是完全无法预料的事情. 虽然vscode会自动把tab转化为空格, 但是, 用户直接用vscode打开的文件, 还是可能会有tab的.
* 虽然但是, 如果使用了format功能, 新的文件并不会直接覆盖, 而是放在旁边, 因此, 可以任意尝试format, 不必担心, 他不修改原文件.


## 关键字匹配的技术描述
```js
顶格# ,(export|test) 任意其他字符可选
正则匹配
/^\s*# ,(export|test)( .*)?$/
```