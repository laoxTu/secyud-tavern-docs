# 脚本使用指南

![脚本](../../images/preset_script.png)

## 字段说明

* 优先级：决定脚本注入的顺序
* 类型：脚本的类型，决定脚本注入的方式
    * link：以链接的方式引用，内容需填写一个js的url。
    * module：以模块的方式注入页面，所创建的常量会被隔离。
    * importmap：以importmap的方式注入页面，所有的importmap将被合并为一个json，放到`script[type='importmap']`中。
    * application/javascript (default)：以js文本的方式直接注入页面
* 内容：根据脚本的类型填写相应的内容

## 获取变量

脚本可以使用外部变量以及监听llm引发的变动。

* 初始化

```js
const contentInitData = window.__messageData?.["content"];
// ...
```

* 监听

```js
function handleMessage(e) {
    if (e.data.type === 'content') {
        setData(d => ({...d, ...e.data.data}));
    }
}

window.addEventListener('message', handleMessage);
// ...
```

当前可用消息：

* content
    * 用于渲染输入，输出，思维链。相应字段如果为undefined， 意味着不改变，而不是清空
    * 结构为```{ input?: string[], output?: string, reasoningContent?: string }```
* variables
    * 用于监控变量的改变，变量改变时需要响应并更新UI。
    * 结构不定，可以是任意结构。

## 控制输入

脚本可以控制`userInput`的内容，从而控制用户传递给`LLM`的信息。

* 直接添加到用户输入框

```js
window.userInput.text.set(u => u + '需要附加的内容');
// 设置为总结模式
window.userInput.summary.set(true);
```

* 使用`inputBuilder`（不会反映在用户输入框，而是在构造输入时生成）

```js
window.userInput.inputBuilders.push({
    id: "my-builder-name", // 需要判重，防止重复添加
    sequence: 0,
    build: (text) => text + '需要附加的内容',
});
```

这个功能非常适合于页面内有控制选项的脚本。通过控制选项，然后在生成输入时直接构造本轮的选项提示词。