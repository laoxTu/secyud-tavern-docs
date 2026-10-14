# 脚本

脚本放在`<预设目录>/scripts/`，按前缀配对：

```
scripts/
├── preact-0.meta.json
├── preact-0.script.json
├── script-1.meta.json
└── script-1.script.js
```

`meta.json`写字段，正文写在`script`文件里，扩展名由`type`决定。

## meta.json 字段

```json
{
  "code": "panel",
  "name": "panel",
  "disabled": false,
  "type": "module",
  "priority": 100
}
```

* `code`：去重键，同一`code`只会注入一次；注入元素的 id 是`sct-<code>`。建议用`[A-Za-z0-9_]+`。
* `name`：显示名。
* `type`：注入方式，取值`link` `application/javascript` `module` `importmap`，缺省`application/javascript`。

  * `link`：正文文件里写一个 URL，插入`<script src>`并等它加载完
  * `application/javascript`：内联脚本
  * `module`：内联模块脚本，可以`import`，`importmap`必须先于它注入
  * `importmap`：正文是一段 JSON，多个`importmap`会合并成一张映射表，总是最先注入
* `content`：脚本正文，写在`script`文件里。写在`meta.json`里无效。

  文件的扩展名由`type`决定：`link`→`.script.txt`，`importmap`→`.script.json`，其它→`.script.js`。
* `priority`：注入顺序，值越小越先，缺省`100`。
* `disabled`：可选，缺省即启用。
* `entryId`：数据库主键，导入时重新编号，可省略。

## 运行环境

脚本在渲染用的 iframe 里执行，不在主应用里。

* 主应用通过`postMessage`推送数据，同时把最新的值挂在 iframe window 的`__messageData`上：

  * `variables`：当前变量快照
  * `content`：`{ inputs, output, thought }`三段已转化的文本
* 脚本可以监听`window.addEventListener('message', ...)`接收。
* 主应用在 iframe window 上暴露了`window.userInput`，
  脚本可以往`inputBuilders`里塞`{ id, sequence?, build }`来改写玩家输入：

```js
window.userInput.inputBuilders.push({
  id: 'my-builder',
  sequence: 10,
  build: (text) => text.replace(/^\/roll/, ''),
});
```

  生成时按`sequence`升序依次应用。

> 允许执行预设脚本是刻意的取舍，配套的约定是「只安装你信任的预设」。

## 与样式的区别

脚本与样式共用同一套`code` + `priority`思路，但是两条独立的注入通道，
同一个`code`在脚本与样式里互不影响。脚本插在`document.body`，样式插在`document.head`。
