

###### 0517
我在测试我自己编写的vscode插件, 尝试在setting.json中设置, 然后, 系统提示不支持background和border, 那么我自己写的主题, 怎样才能不忽略background和border呢?
然后, ai普遍误解.
你误解了我的意思, 我来详细描述下: 我在自己编写的vscode的theme中设置了background和border, 但是, 他们并不生效, 为了验证他们, 我在host的setting.json中设置了background和border, 但是, vscode提示不支持background和border, 那么我如何编写我的theme, 才能让他们生效呢?  顺便说一句, 我使用的是yo code新建的theme项目.
* 不行哦, 语法高亮不支持背景和边框这种东西, 放弃, 放弃, 这也解释了之前的markdown带框问题, 他使用了theme的background属性搞了一个边框...这个解决方案好搓, 哪怕自己搞个border属性呢, 用户还可以重置他, 结果他共用了别人的background属性, 别人就彻底没办法调整了呢. 傻叉解决方案.

###### 0514
* 光标所在文字的颜色太深了. 
* `这玩意有个边框`, 又出现了.... 是不是我自己的color theme导致的?
  * 肯定不是, 估计是md all in one

* 第一步找到光标所在单词的背景色.
	* 没用, "editor.inactiveSelectionBackground": "#ff0000fe",
	* 这个确实是所在行的背景色, 搞淡一点.		"editor.lineHighlightBackground": "#ffff00",
	* 未知, "editor.rangeHighlightBackground": "#ff00ffff",
	* 这个是选区, 很神奇, `这个边框`也是这个颜色"editor.selectionBackground": "#409fff80",
  	* 所以说, 不是颜色theme的问题, 是某个插件的问题, 比如markdown all. 就这样吧, 不纠结这个框了.
		// "editor.selectionForeground": "#ffffff",
  * 这个有用, 是等于所有等同被选中内容颜色. "editor.selectionHighlightBackground": "#87d96c26", 调高了亮度
	* 同上	"editor.selectionHighlightBorder": "#87d96c00",
* 这一组有用, 就是单词高亮颜色:
  * 		"editor.wordHighlightBackground": "#80bfff14", # 这个背景色改为绿色
		"editor.wordHighlightBorder": "#80bfff80", # 这个边框颜色去掉.
		"editor.wordHighlightStrongBackground": "#87d96c14",
		"editor.wordHighlightStrongBorder": "#87d96c80",



###### 0509


`这玩意有个边框`
```sh
# 查看安装的扩展
code --list-extensions
# * 看看是哪一个扩展在捣乱: `貌似不是wscats`
# * 是谁呢? mytime很有可能, 因为他使用了反引号, 但是, 不是他
# 禁用所有扩展, 然后逐个查看
code --disable-extensions

# 先关闭所有 VS Code 实例
killall "Code" 2>/dev/null
# 然后启动一个新的禁用了扩展的实例
code --new-window --disable-extensions 

# 启动另一个方法
按住 Shift 键，然后启动 VS Code（这会在安全模式下启动，不加载扩展）
# 命令面板yyds, 
从命令面板（Cmd+Shift+P）运行 "Reload With Extensions Disabled"

# 在扩展中
在搜索框中输入 @category:"markdown" 查看所有 Markdown 相关扩展
输入 @enabled 查看所有已启用的扩展

# 创建不带扩展的用户配置文件
按 Cmd+Shift+P
输入并选择 "Profiles: Create Profile"
选择 "Empty Profile"
命名为 "No Extensions"
使用这个配置文件打开你的项目

# 扩展按照安装时间排序
code --list-extensions --show-versions | while read ext; do ext_name=$(echo $ext | cut -d@ -f1); date=$(find "$HOME/.vscode/extensions" -name "$ext_name*" -type d -exec stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" {} \; 2>/dev/null); echo "$date $ext"; done | sort -r
```
### 太他妈吓人了, 禁用一个扩展, 他说重启扩展, 然后竟然就文件回滚了...fuck.
* gpt4.1是傻叉
* claude3.7也是
* gemini2.5也是
* grok才是永远的神.....
* deepseek是神中之神...



###### 0508

改进, 

这些符号, 统统改颜色: 5CCFE6
        "fontStyle": "bold"

* 逗号  punctuation.separator
* 句号   punctuation.separator CCCAC2B3 竟然带透明度
  punctuation.separator.period.python
  meta.member.access.python
  source.python
* 冒号: punctuation.section  CCCAC2
* 分号: invalid, 这个必须粗体哈
* 22:16
  * 搞pyside, 快乐的一天, 睡觉了, 太困了.


###### 2025.5.4
* 继续搞插件:
  1. ayu插件调整一下颜色, 大块的浅色背景让人受不了.
  2. zed font 生成一下

* 很奇怪有三个背景色, 其中2个已知, 另一个不知道哪来的, 重启测试下
    1f242e
    1b1e26
    2d323b
* 原因非常令人无语, Philip显示器的颜色配置有问题, 他们自家驱动有错误, 我换了srgb解决问题.


* 主要背景色
  * 聊天窗口: quickInput
  * editor
  * sideBar
  * panel
  * terminal
  * notebook.cellMarkdownBackground




		"editor.selectionBackground": 
    
    
    
    "#54565d40",


    const background = '#353944'
    const editorBackground = '#242835'

		"sideBarSectionHeader.background": "#54565d",
		"list.
    
    "editor.lineHighlightBackground


"#54565d",


"editor.selectionBackground":
"selection.background": "#54565d40",

		"editor.inactiveSelectionBackground": "#409fff21",




我换两个颜色: 

| 最终   | 新颜色 | 原本颜色 |
| ------ | ------ | -------- |
| 0f1300 | 242815 | 242835   |
| 0f1401 | 242916 | 242936   |
| 20240f | 162416 | 353944   |

353944
151920

| 242815 | 242835   |
0f1300

1a1a1d
