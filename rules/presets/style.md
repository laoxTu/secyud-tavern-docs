# 样式

样式放在`<预设目录>/styles/`，按前缀配对：

```
styles/
├── ui-0.meta.json
├── ui-0.style.css
├── theme-1.meta.json
└── theme-1.style.txt
```

字段与[脚本](script.md)逐字相同，只有默认`type`不一样。

## meta.json 字段

```json
{
  "code": "ui",
  "name": "样式",
  "disabled": false,
  "type": "text/css",
  "priority": 100
}
```

* `code`：去重键，同一`code`只会注入一次；注入元素的 id 是`stl-<code>`。建议用`[A-Za-z0-9_]+`。
* `name`：显示名。
* `type`：取值`link`或`text/css`，缺省`text/css`。

  * `link`：正文里写一个 URL，插入`<link rel="stylesheet">`
  * `text/css`：内联样式。空串也按`text/css`处理
* `content`：CSS 正文，写在`style`文件里。写在`meta.json`里无效。

  扩展名规则：`type`为`link`→`.style.txt`，其它→`.style.css`。
* `priority`：注入顺序，值越小越先，缺省`100`。
* `disabled`：可选，缺省即启用。
* `entryId`：数据库主键，导入时重新编号，可省略。

## 注意

* 样式注入到 iframe 的`document.head`，选择器要针对 iframe 内的结构写，
  主应用的全局样式不会和它互相影响。
* 与脚本一样按`code`去重、按`priority`升序注入。
* 项目里没有 CSS 预处理，写标准 CSS 即可。
