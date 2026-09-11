# Scripts User Guide

![Scripts](../../images/preset_script.png)

## Field Descriptions

* Priority: Determines the order in which scripts are injected.
* Type: The type of script, determining how the script is injected.
    * link: Referenced via a URL. The content should be a JS URL.
    * module: Injected as a module into the page. Created constants will be isolated.
    * importmap: Injected as an import map into the page. All import maps will be merged into a single JSON and placed in a `script[type='importmap']` tag.
    * application/javascript (default): Injected as JS text directly into the page.
* Content: Fill in the corresponding content based on the script type.

## Getting Variables

Scripts can use external variables and listen for changes raised by the LLM.

* Initialization

```js
const contentInitData = window.__messageData?.["content"];
// ...
```

* Listening

```js
function handleMessage(e) {
    if (e.data.type === 'content') {
        setData(d => ({...d, ...e.data.data}));
    }
}

window.addEventListener('message', handleMessage);
// ...
```

Currently available messages:

* content
    * Used to render input, output, and the reasoning chain. If the corresponding field is undefined, it means "do not change" rather than "clear".
    * The structure is ```{ input?: string[], output?: string, reasoningContent?: string }```
* variables
    * Used to monitor variable changes. When variables change, you need to respond and update the UI.
    * The structure is not fixed and can be any structure.

## Controlling Input

Scripts can control the content of `userInput`, and thereby control the information the user passes to the `LLM`.

* Add directly to the user input box

```js
window.userInput.text.set(u => u + 'content to append');
// Set to summary mode
window.userInput.summary.set(true);
```

* Use `inputBuilder` (this will not be reflected in the user input box; it is generated when the input is constructed)

```js
window.userInput.inputBuilders.push({
    id: "my-builder-name", // Duplicate checking is needed to prevent adding it repeatedly
    sequence: 0,
    build: (text) => text + 'content to append',
});
```

This feature is very suitable for scripts that have control options within the page. By controlling the options, you can directly construct the option prompt for this round when generating the input.
