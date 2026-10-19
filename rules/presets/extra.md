# 其它条目：正则、脚本、样式

默认设置一条都没用，但仓库里别的预设用到：`默认交互`（`ui_default`）与`模拟经营`里有
脚本和样式。这里只记字段与坑，够改包就行。

## 正则 `regexes/`

只有元数据一个文件，查找替换都写在`meta.json`里：

```json
{
  "name": "clean",
  "disabled": false,
  "target": "output",
  "pattern": "\\[\\[.*?\\]\\]",
  "replacement": ""
}
```

* `name`：显示名，同时是文件名前缀，也是执行顺序的排序键。没有`code`，正则不按`code`去重。
* `pattern`：直接交给`String.prototype.replace`，**不是**正则字面量。
  不要写`/.../g`，`/`会被当成普通字符；转义按 JSON 字符串写，`\\d+`表示一个反斜杠加`d+`。
* `replacement`：支持`$1`、`$&`这类 JS 替换模式。
* `target`：`input` `output` `both`，缺省`input`。
* 多预设叠加时全部依次执行，顺序按`name`升序，要避让就用`name`控制先后。
* 工具调用的内容不参与替换；宏的求值排在正则之后。

## 脚本 `scripts/`

`默认交互`里的三个：`preact`（`importmap`）、`script`（`module`）、`components`。

```json
{
  "code": "preact",
  "disabled": false,
  "entryId": 3,
  "name": "preact导入",
  "priority": 0,
  "type": "importmap"
}
```

* `code`：去重键，同一`code`只注入一次；注入元素的 id 是`sct-<code>`。
* `type`：`link` `application/javascript` `module` `importmap`，缺省`application/javascript`。
  内容文件后缀随之变化：`link`→`.script.txt`，`importmap`→`.script.json`，其它→`.script.js`。
  `importmap`总是最先注入，多个会合并成一张表，`module`要`import`就得靠它。
* `priority`：注入顺序，越小越先，缺省`100`。
* 脚本在渲染输出的 iframe 里跑，不在主应用里。主应用把最新数据挂在 iframe 的
  `__messageData`上（`variables`与`content`三段），脚本用`window.addEventListener('message', ...)`收。
* 主应用还暴露了`window.userInput`，可以往`inputBuilders`里塞`{ id, sequence?, build }`
  来改写玩家输入，生成时按`sequence`升序依次应用。
* `entryId`在导出文件里还留着，导入时重新编号，不影响功能。
* 允许执行预设脚本是刻意的取舍，配套的约定是「只安装你信任的预设」。

## 样式 `styles/`

字段与脚本逐字相同，只有`type`不一样，注入元素的 id 是`stl-<code>`。

```json
{
  "code": "ui",
  "disabled": false,
  "entryId": 1,
  "name": "样式",
  "priority": 100,
  "type": ""
}
```

* `type`：`link`或`text/css`，缺省`text/css`。空串也按`text/css`处理（`ui-0`就是空串）。
  内容文件后缀：`link`→`.style.txt`，其它→`.style.css`。
* 样式注入到 iframe 的`document.head`，选择器要针对 iframe 内部结构写，
  主应用的全局样式不会和它互相影响。
* 按`code`去重、按`priority`升序注入；和脚本是两条独立通道，同`code`互不影响。
* 没有 CSS 预处理，写标准 CSS。
