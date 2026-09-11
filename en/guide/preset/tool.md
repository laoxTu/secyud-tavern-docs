# Tools User Guide

Compared with manually constructing prompts, tools offer greater flexibility and stability.

They allow the AI to obtain specific content on demand and to record the corresponding operations.

![Tools](../../images/llmapi_tool.png)

## Field Descriptions

* Tool ID: The tool type. Different tools serve different purposes.

## Tool Types

### Variable Tool

* Set Variable

The LLM can call this tool to set variables in the current output. It can replace `variable_changes`. When the AI sets variables, it should use this approach as much as possible, as it is more stable. `variable_changes` is likewise retained, but it is better suited for constructing input.

* Get Variable

The LLM retrieves a variable by variable path, so you do not need to manually inject variables in the world book or elsewhere. Try to let the AI call this tool automatically to obtain variables.

### Web Fetcher

Similar to web search. It fetches web pages and reads key information.
> Personally not recommended unless you have a special need, such as knowledge search.

### Custom Script

Every preset can work together with custom scripts — settings, using global variables, playing media, mathematical calculations, and so on.

Two variables, `input` and `context`, will be passed in: the parameters given by the AI and the context, respectively.

`input` is defined by the schema, and you need to validate it.

`context` is fixed, and you can choose

* Access the iframe
    ```ts
    interface context {
        document: HTMLDocument,
        window: Window,
    }
    ```
* Access variables
    ```ts
    interface context {
        variables: any,
    }
    ```

### Sub-agent

You can define your own sub-agent to provide custom analysis or operations.

* Disable tags will disable presets containing the specified tags in the sub-agent.
* Disable preset will disable all presets in the sub-agent.
* Maximum length can limit the length of the context passed from the main agent to the sub-agent.
* Model can set a separate model for the sub-agent; the story model is used by default.
* Dependencies can configure the sub-agent's own preset dependencies, which will be merged with the main agent's dependencies. They are likewise subject to the disable tags restriction, but not to the disable preset restriction.
* Schema provides a JSON Schema, and the AI will supply parameters according to the description. The parameters can be accessed through ETA syntax.
* Description provides the AI with a behavioral description to help it understand.

### [Memory Tool](../story/readme.md)

Provides memory capability for the AI.
