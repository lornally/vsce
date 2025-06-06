
* todo
  * 可能行尾的注释和正文之间需要一个空格. 待观察.

###### 0605
* 新建项目, 解析.ye文件, 他是我的keydog文件.
* 
###### 0529
* 放弃qml, 也就放弃qmltight这个项目.


###### 0525
* qml tight需要优化
  * qml格式化要考虑, 中括号和小括号里面有大括号的情况, 并且, 缩进有问题.  在qmlbook/数据/族谱缩进有问题.qml, 业务和系统分析/树.qml
  * 其实, 对于中括号和小括号, 还是要仔细处理, 类似大括号一样的处理, 如果是单行, 就改成单行, 否则原本几行就几行, 只是调整好缩进. 
  * 中括号, 小括号, 内部有大括号, 多个逗号时, 保持原本断行
  * 避让快捷键, 改为ctrl alt tab.

###### 0522
* 修改qml格式化为替换原本文件.

###### 0521
* 拉到独立目录, 逐个检查是否成功运行, 逐个删除所有不需要的文件...
* 6:29
  * 逐个运行, 检查是否打包成功.
* 6:36
  * zedme运行正常, 打包正常.
* 6:41
  * python代码统计, 打包正常.
* 10:23
  * 睡了一觉, 现在qml紧凑打包正常.
* 10:33
  * py4nb的代码导出有问题, 出现换行符x2的情况, 每行之间都有空行了.
* 10:50
  * 4个插件都打包成功了. 去吃饭. 好饿, 好奇怪.
* 11:34
  * 吃了一点, 尝试发布zedme
* 12:03
  * 发布成功了, 修改了一下图标试试.
  * 不行还得升级版本
* 12:14
  * 插件发布了, 要等一段时间, 才能上到市场.
* 12:22
  * 所有插件都发布到市场了.
  * py4nb的readme描述不太清晰, 并且有重复. 修改一下. 
* 12:48
  * 改了py4nb的readme. 已经提交市场.
* 14:09
  * readme还得改.
* 14:37
  * 再次改了一个版本.
* 15:56
  * 这次不是readme了, 是要加一个反逻辑, 什么都不选的情况下, 导出用户的所有格子.
  * 这个需求来自: 高翔
* 16:30
  * 完成修改, 打包发布. 改export逻辑为默认导出, 3个好处, 没有害处.
    * 码量降低一半, 同时符合常识, 
    * 并且兼容粗心不看说明的用户, 
    * 并且用户输入也少很多, 之前一个格子如果同时有导出和忽略, 用户要写2条, 现在只需写一条.
  * 就算用户不写test, 也只有好处, 因为正常代码用户不可能不写.
###### 0520
* 6:39
  * 逐行处理也不行, 还有正常字符串中的#号要处理, 因此, 还是要用处理qml的那个状态机切换的写法. 太复杂了, 放弃了. 先这样吧. 
* 8:11
  * 好有挑战性的测试, 单独拉了测试用例文件.
* 8:38
  * bug解决了. 行尾转义符的测试真难啊. 
  * keep foolish, 不要炫技, 该取绝对值, 就取绝对值... 不然现实的复杂性教做人.
* 8:46
  * 都OK了, 去吃早饭, 拿美团, 烧开水.
* 10:58
  * 休息了一下, 看了一会b站, 这个果然耗时间.
  * 好热, 还是要开空调.
  * 导出python, 然后彻底完成导出插件.
* 11:53
  * 之前思路出问题了, python格式化, 无法区域格式化, 只能全文格式化, 因此, 把文件发给python处理才对.
* 12:21
  * py4nb也可以提交了. 
  * 完成最后一个插件. qml处理插件.
* 12:32
  * 饿了, 去吃饭吧, 格式化qml为紧凑格式也搞了,
* 15:04
  * 继续qml, 
  * 这些项目已经归入, 插件精华->上线前自查
    * 记得几个都要描述bug和缺陷. 不支持正则等等.
    * 完善readme.
    * package 里面
      * 版本号
    * 搞一个vscode插件的github, 存放资料, 文档, issue.  填充到:  "repository": {
    "type": "blog",
    "url": "https://isuyu.cn/"
  },
* 15:47
  * 两个bug, 1. 快捷键没响应.
  * 2. 命令行执行后, 文件扩展名错误.
  * 完成
* 15:54
  * 引导客户: 
  *   {
    "key": "ctrl+tab",
    "command": "-workbench.action.quickOpenPreviousRecentlyUsedEditorInGroup",
    "when": "editorHasSelection"
  },
  {
    "key": "ctrl+tab", 
    "command": "-workbench.action.openNextRecentlyUsedEditorInGroup",
    "when": "editorHasSelection"
  },
* 17:29
  * 包了饺子, 花了1小时...
* 17:52
  * 调整了目录, 整理了一下学习路径. 准备上山看看, 回来洗澡, 洗完澡吃饺子. 
* 19:46
  * 搞微软账号, 微软真难搞.
  * 统一替换了所有项目的publisher
  * github的源码地址也要统一替换.
  * 完全根据插件精华的上线前检查.今晚不搞了, 明天一早逐个检查是否运行正常. 并且单独拉出去
* 20:29, 已经移到新的目录, 但是, 没有做任何文件删除类工作, 删除的事情要等一下, 因为, 每个删除都要试运行.
###### 0519
* 8:15
  * 貌似只剩下python缩进了, 其他应该都完成了. 回头查一下待办看看.
  * tab换空格这件事不能自动做, 必须用户手动做.   这个保存到插件的readme中.
    * 并且,必须转化为空格, 自动缩进才能正确执行.
* 8:44
  * 有点晚了, 去吃个早饭.
* 10:24
  * 择了韭菜, 处理了猫砂. 
  * 英语是最好的语言那个视频, 看一下, 把作者罗列的途径都归拢为一个书签. 已经总结在系统备忘录.
  * 继续处理python缩进.
* 15:48
  * 搞了小米的米家设置, 这玩意真不好用.
* 16:54
  * 块处理完成. 但是, ai连不上了....
* 17:36
  * 自动块缩进这个快捷键不能用shift tab, 因为这个要保留给减少缩进使用, 考虑用ctrl tab, 因为有选区限制了他. 保证了不冲突.
* 18:14
  * 空白行预处理搞定了.  去买晚饭吧.
* 20:24
  * 吃了面包, 看了一会儿小弯.
  * 解决掉那个快捷键设置, 都改成ctrl+tab
* 20:44
  * 改了快捷键. 
  * 好热哦, 去洗个澡吧.
  * 把英语是最好语言那个看了吧.
    * stack overflow 全家桶
    * reddit
    * 官方论坛
    * github
    * discord
* 21:47
  * 2个快捷键调整: 
  * format用ctrl tab替代shift tab
  * 自动补全, 都用tab, 但是, 同时有ai和补全时, ai不可操作.
  * 去洗澡.
* 22:41
  * 预处理字符块这个地方还是要逐行处理, 因为正则很难区分注释中的三引号不是字符串, 以及字符串中的#不是注释.
  * 好困, 去睡觉了... 不熬了. 明天吧插件都搞定, 然后发布到google市场. 然后, 开始搞我的mindmap了.
  * 弄了一个不错的注册名: Iron Beast, 明天用这个注册试试, 或者能用中文就用中文.


###### 0518
* 9:16
  * 继续插件
* 10:44
  * 牛逼, 完成了彩虹字. 哈哈哈.... ai好傻....
* 11:14
  * 稍微休息了一下. 
  * 继续代码. 搞提取代码. 
  * 格式化python的代码要用python写, 写好后, 顺手把qml也搞成插件.
* 23:18
  * 当前export表现正常, 但是, 逻辑上还需要优化. 优化为一旦看到export, 那么就开始导出. 
  * 但是语法高亮没有生效.
* 23:46
  * 苍天啊, 大地啊, 文件从jsonc改回json, 一切都正常了. 原来如此. 但是, 确实不该指定这个theme, 因为这样的话zedme就失效了.
* 23:50
  * 开始融合zedme
* 0:30
  * 融合zedme完成.
  * 导出判断也改为新的机制, 看到export开始导出下一行, 并不要求export在cell第一行.
  * 导出貌似正常, 但是, 需要测试, 明天再测试. 去睡觉了.

###### 0518
* 定义ipynb提取插件
  * 定义一种exp高亮, 表明提取此单元格.
  * 定义一种test高亮, 表明本单元格剩下的代码是测试代码不必提取.
  * 同时提供格式化代码的快捷键
* 11:16
  * 继续搞提取代码的部分.
  * 都搞好了, 记得去写readme.
* 22:35
  * 代码导出正常了. 下面搞python代码格式化.

###### 0504
* 弄美化插件, log在zedme里面

###### 0425
* 弄明白了, 我应该定义一种文件, 然后针对这种文件做美化, 此时, 完全不必担心颜色问题了.
* 另外, contributes.language是否需要定义?

###### 0425之前
###### 运行时错误
使用 vscode.window.showErrorMessage(error.stack) 快速定位运行时错误

###### 只需做一次的环境准备
> 主要是准备一个可以用来创建插件工作目录的目录, 这里是所有插件的父目录
```sh
# 准备一下代理环境不然容易安装失败

# 直接安装一堆问题, 建议python虚拟环境进行隔离
python -m venv .vscevenv && source .vscevenv/bin/activate

# 全局安装一堆问题, 建议去掉-g, 改为本地安装
pnpm install yo generator-code
# 安装yaoman 和 vscode扩展生成器

# 系统提示需要升级pnpm
pnpm self-update  
# 升级后需要打开新的terminal

# 系统还提示执行脚本审批
pnpm approve-builds -g

```

###### 创建扩展项目
> 在上面准备的这个目录才可以, 因为是本地安装

```sh
# 创建扩展项目
pnpm yo code
# 选择 "New Extension (TypeScript)"，然后输入扩展名称和其他信息
# 这个会面临一个选择: witch bundler to use?
2025.4.3的选择: esbuild
# 然后就会自动打开咱们新建的项目目录
# ! 注意: 必须在咱们这个目录里面操作, vscode里面的根目录必须是咱们这个目录, 不然f5运行会报错

# 然后根据上一步的提示, 安装插件: connor4312.esbuild-problem-matchers

然后可以f5运行了, f5不好按就从菜单选
# 此时打开一个新窗口 - 扩展开发宿主
shift-cmd+p初选了咱们的新扩展的命令: hello world
# 运行这个命令, 咱们的包名就展示出来了


# 核心编辑文件: 
src/extension.ts
# 编辑完成后
pnpm run compile
# 生成dist/extension.js
# 然后就可以f5运行了, f5不好按就从菜单选


```


###### 调试


```sh
# console.log的输出信息不直接在终端里面, 而是在调试控制台, (AI说在'输出', 可能之前的版本在输出里面)

# ts也可以设置断点调试

# 确保python正确
# 直接运行python3 c_i.py

# 确保python收到的参数正确
# 在python中打印参数

# 实在不行用spawn替代exec, 他提供更细的颗粒度
```
```ts
// spaw举例:
const { spawn } = require('child_process');
const pyProcess = spawn('python', ['your_script.py', 'arg1', 'arg2']);

pyProcess.stdout.on('data', (data) => {
    console.log(`STDOUT: ${data}`);
});

pyProcess.stderr.on('data', (data) => {
    console.error(`STDERR: ${data}`);
});

pyProcess.on('close', (code) => {
    console.log(`Process exited with code ${code}`);
});

```


###### 打包

```sh
# 打包

#! 这个已经被废弃了
pnpm install vsce -g

# 根据提示装这个, 这个需要-g, 因为不能每个包都装一下..
pnpm install  -g @vscode/vsce
# 根据提示, 还得装这个:
pnpm approve-builds -g 

vsce package
# 此时会报错, 傻叉要求编辑readme.md, 而且他的傻叉提示还是错的, 奶奶的, 就是标准的markdown而已
# 改好了用着验证
pnpm run check-types && pnpm run lint && node esbuild.js --production

# 此时需要解决图片不显示问题:
# 本地启动一个http服务是个合适的办法
python3 -m http.server  
# 然而vsce还要求https... 呵呵

# 类似这种方案都是不行的
vsce package --baseContentUrl "file:///users/bergman/my2024/X/oh-my-project/%E6%8A%80%E6%9C%AF/%E6%88%91%E7%9A%84%E6%8F%92%E4%BB%B6_vscode/origin/" --baseImagesUrl "file:///users/bergman/my2024/X/oh-my-project/%E6%8A%80%E6%9C%AF/%E6%88%91%E7%9A%84%E6%8F%92%E4%BB%B6_vscode/origin/"



# 打包完成后, 可以根据提示找到.vsix文件


# 使用命令: code --install-extension your_extension.vsix 安装扩展

```

###### 2025.4.12
* 尝试修改typora插件和codemetrics插件


###### 2025.4.12之前
* 开发了统计字符的插件, 插件开发确实很好用