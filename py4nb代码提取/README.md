# py4nb README

提取ipynb代码的插件, 同时提供python格式化服务

## Features
* 用属性判断提取ipynb代码过于隐晦, 很难判断状态, 因此, 引入了类似注释代码注入的语法高亮来处理ipynb提取
```python
下面这两行都声明了本cell, 从这一行开始需要提取
# ,export 测试
# ,export
下面这两行声明了, 本cell剩余部分是测试代码, 不需要提取
!!! 注意, 忽略所有行, 后面就算有export也不生效了.!!!
# ,test 测试
# ,test
格式描述
顶格# ,(export|test) 任意其他字符可选
'''
正则匹配
^\s*# ,(export|test)( .*)?",
'''
```
### 快捷键:
* 提取代码:
  *"key": "ctrl+shift+e",
  * "mac": "ctrl+cmd+e",
* 格式化python(注意此时需要选中需要格式化的内容)      
  * "key": "ctrl+shift+f",
  * "mac": "ctrl+tab",
# 特别注意, 特别注意, 特别注意
```python
# ,export 从他的下一行开始提取
...
# ,test 他的下一行开始不提取
...test之后即便再出现export也不会生效了.
# ,export 这一行不生效, !!!!! 这行不生效了
... # * 这里的内容并不会被提取.
```
## Requirements
###### 语法高亮
* 如果需要语法高亮, 需要直接在本插件指定本插件的theme
  * 本插件theme: 这个就是正常的vscode dark加了语法高亮. 
* (建议)可以使用使用支持本语法高亮的theme, 支持本插件语法高亮的theme有:
  * zedme
  * ...
###### 快捷键
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
* 字符串处理非常潦草, 
  * 并未考虑字符串中的字符串符号.
  * 并未考虑注释中的字符串符号, 以及由此引发的字符串中的注释, 
* 基于缩进的代码是无法部分处理的, 因为他的缩进是互相关联的, 部分处理大概率导致无法预期的结果, 所以每次都是整体处理全py文件. 
* 为了和系统的快捷键不冲突, 因此有2个妥协
  * 用户要修改快捷键配置文件, 解除有选区的情况下的系统快捷键绑定.
  * 虽然都是全文格式化/紧凑化, 但是, 为了不冲突, 还是要求用户有任意的选区, 才能格式化/紧凑化
* 用户必须把tab转化为空格, 文件中不应该有tab, 格式化工具并不知道如何处理tab, 一个tab等于多少个空格是完全无法预料的事情. 虽然vscode会自动把tab转化为空格, 但是, 用户直接用vscode打开的文件, 还是可能会有tab的.
* 虽然但是, 如果使用了format功能, 新的文件并不会直接覆盖, 而是放在旁边, 因此, 可以任意尝试format, 不必担心, 他不修改原文件.
## Release Notes
### 0.1.1
* 修改bug: 导出格式会增加空行.
### 0.0.8
* 第一个提交到市场的版本.

### 0.0.7
* 修改format的快捷键 shft+tab -> ctlr+tab

### 0.0.1
* 初始版本
