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
