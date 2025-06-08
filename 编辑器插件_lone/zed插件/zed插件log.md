###### 20250427
* 视觉上过于一致, 误认为copilot聊天窗也是编辑窗口


###### 0501
* 目前可以很方便的使用ai, 链接copilot很方便.
* 报错taplo, 询问ai之后, 卸载再重新安装就好了.
* vscode当年打开文件, 是不占位打开, 也就是下一个打开文件也是这个tab编辑区, 不会开新tab, 2025, 他终于去掉了这个烦人的特性. 几乎没有意义, 只会造成困扰, 但是zed还在
* zed切分窗口时有四个选项, vscode只有一个, 还是vscode好使, 他的工作量也低一些.

###### 0429
* zed快的要命, 但是问题也不少,
* 完全没有markdown插件, 自动列表都没有.
* 右上角的分屏操作, 过于复杂.
* 不支持ipynb notebook.
* terminal里面不支持汉字

###### 0428

* 早晨起来第一件事, 官方要求使用rustup安装, 不要使用brew安装.

###### 20250427

* https://zed.dev/docs/extensions/developing-extensions
* 元宝建议: gpu渲染管线->即时布局计算->语法树增量更新->css样式系统->动态行高控制
* zed方案

```rust
// 基于 Zed 的 text-layout 模块扩展
impl TextLayout for MarkdownLayout {
    fn line_height(&self, line: usize) -> f32 {
        let line_text = self.buffer.line(line);
        if line_text.starts_with("#") {
            // 标题行动态行高
            let level = line_text.chars().take_while(|c| *c == '#').count();
            self.base_line_height * (1.2 + 0.1 * (6 - level) as f32)
        } else {
            self.base_line_height
        }
    }

    fn vertical_spacing(&self, prev_line: usize, next_line: usize) -> f32 {
        // 根据上下文动态计算行间距
        match (self.line_type(prev_line), self.line_type(next_line)) {
            (Heading(_), Paragraph) => self.base_line_height * 0.8,
            (Paragraph, Heading(_)) => self.base_line_height * 0.5,
            _ => 0.0
        }
    }
}

// 使用 GPU 加速的布局缓存
struct LayoutCache {
    gpu_buffer: wgpu::Buffer,
    dirty_ranges: Vec<Range<usize>>,
}

impl MarkdownRenderer {
    fn update_layout(&mut self, changes: &[Change]) {
        self.layout_cache.mark_dirty(changes);
        self.gpu_uploader.schedule_upload(&self.layout_cache);
    }
}
```

* lapce+Xi-editor方案

```rust
#[style_component]
struct MarkdownStyle {
    #[css]
    heading_line_height: Val<f32> = Val::Dynamic(|ctx| {
        ctx.base_line_height * 1.5
    }),

    #[css]
    paragraph_margin: Val<f32> = Val::Px(12.0),
}
```

* tauri+posemirror

```ts
// 使用 ProseMirror 构建编辑器核心
const markdownSchema = new Schema({
  nodes: {
    doc: {content: "block+"},
    heading: {
      content: "text*",
      attrs: {level: {default: 1}},
      toDOM: node => [
        `h${node.attrs.level}`,
        {
          style: `line-height: ${1.2 + node.attrs.level * 0.2}em;`
        }
      ]
    },
    paragraph: { /*...*/ }
  }
});
```

* obsidian+custom css 插件
