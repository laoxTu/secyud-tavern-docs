# UI 插槽

插槽（UI Slot）是宿主页面预留的挂载点。插件把组件注册到 `globals.uis`，声明目标插槽名，页面渲染到该位置时就会渲染插件组件。

和 `menus`、`tabs` 这类注册器不同：注册器决定“多一个页面 / 分区”，插槽只决定“页面里某个固定位置多一块内容”。一个插槽可以注册多个组件，按 `sequence` 排序。

## 快速开始

```tsx
// plugins/my-plugin/client/index.tsx
import { BookmarkIcon } from 'lucide-react';

import { IconTooltip } from '@/components';
import { globals } from '@/global/client';

function MarkButton() {
  return (
    <IconTooltip text={'my_plugin.mark'}>
      <BookmarkIcon />
    </IconTooltip>
  );
}

export default async function init() {
  globals.uis.register({
    id: 'my-plugin.mark',
    slot: 'preset.tab_actions',
    sequence: 100,
    component: MarkButton,
  });
}
```

注册项字段：

| 字段        | 必填 | 说明                                                         |
| ----------- | ---- | ------------------------------------------------------------ |
| `id`        | 是   | 全局唯一（所有插槽共用一个注册表），建议 `插件id.用途`       |
| `slot`      | 是   | 插槽名，见下方清单；写错会静默不渲染                         |
| `component` | 是   | 要渲染的组件，可以声明自己需要的 props                       |
| `sequence`  | 否   | 排序，升序，默认 `0`                                         |
| `requires`  | 否   | 依赖的其它 UI 项 `id`，用于强制先后顺序；缺失或成环会直接报错 |

客户端初始化在首次渲染前完成，所以注册到插槽里的组件在页面出现时一定是齐全的。**不要在组件的 `useEffect` 里注册**：`UISlot` 不订阅注册表，运行期新增的注册项不会触发重渲染。

> 下文示例省略与插槽无关的 import。

## 组件能拿到什么

宿主按其当前上下文决定传什么 `props`，插件直接用即可：

```tsx
// preset.list_item.actions 的 props 是 { item }
function ExportButton({ item }: { item: Preset }) {
  return (
    <IconTooltip
      text={'my_plugin.export'}
      onClick={handler(async () => {
        await myProxy.export(item.id);
      })}
    >
      <FileUpIcon />
    </IconTooltip>
  );
}
```

没有 props 的插槽，用对应模块的 store / `getState()` 读取当前上下文，例如：

| 插槽前缀            | 可用状态                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `preset.*`          | `usePresetState`（`@/presets/client`），当前选中的预设                                        |
| `story.*`           | `useStoryState`（`@/stories/client`），当前选中的故事                                         |
| `realm.*`           | `realms.realm` / `useRealmState`（`@/stories/realms/client`）                                |
| `model.setting.*`   | `useModelState`（`@/models/client`），当前选中的模型                                          |
| `comfyui.model.*`   | `useComfyUIModelState`（`@/comfyui/client`）                                                  |
| `comfyui.param.*`   | `useComfyUIWorkflowState`（`@/comfyui/client`），当前选中的工作流                             |
| `setting.*`         | `useSettingState`（`@/global/client/setting`），当前设置分区                                   |
| `task.*`            | 行对象通过 props 传入，不需要全局状态                                                         |

## 插槽清单

### 全局

| 插槽                   | 位置                       | props | 说明                                             |
| ---------------------- | -------------------------- | ----- | ------------------------------------------------ |
| `global.sidebar.header` | 侧栏折叠按钮下方           | —     | 竖向排列，建议用 `SidebarMenuItem`               |
| `global.sidebar.footer` | 侧栏底部、语言/主题按钮上方 | —     | 竖向排列，建议用 `SidebarMenuItem`               |
| `global.overlay`        | 主内容区之外               | —     | 宿主不给定位容器，组件必须自己 `fixed`，否则会挤占主内容 |

### 设置

| 插槽                  | 位置         | props | 说明                     |
| --------------------- | ------------ | ----- | ------------------------ |
| `setting.tab_actions` | 分区标签下方 | —     | 当前分区用 `useSettingState` |

### 预设

| 插槽                        | 位置                         | props          | 说明                           |
| --------------------------- | ---------------------------- | -------------- | ------------------------------ |
| `preset.main_button`        | “新建 / 导入”同一按钮组      | —              | 两行网格布局，放图标按钮       |
| `preset.tab_actions`        | 预设标签栏右侧               | —              | 当前预设用 `usePresetState`    |
| `preset.list_item.actions`  | 每个预设行右侧               | `{ item }`     | 每个预设渲染一次，`item` 是 `Preset` |
| `preset.entry_list.actions` | 条目列表工具栏               | `{ state }`    | 条目类型见 `state().name`      |
| `preset.entry.tools`        | 每个条目卡片左侧工具列       | `{ state, entry }` | 竖向工具列，放图标按钮     |

### 故事

| 插槽                      | 位置             | props              | 说明                        |
| ------------------------- | ---------------- | ------------------ | --------------------------- |
| `story.main_button`       | 故事页新建按钮下方 | —                  |                             |
| `story.tab_actions`       | 故事标签栏右侧   | —                  | 当前故事用 `useStoryState`  |
| `story.list_item.actions` | 每个故事行右侧   | `{ item }`         | 每个故事渲染一次，`item` 是 `Story` |
| `story.entry_list.actions`| 条目列表工具栏   | `{ state }`        |                             |
| `story.entry.tools`       | 每个条目工具列   | `{ state, entry }` | 竖向工具列                  |

### 游玩

| 插槽                  | 位置                     | props | 说明                                     |
| --------------------- | ------------------------ | ----- | ---------------------------------------- |
| `realm.input.addon`   | 输入框右侧、摘要勾选左侧 | —     | 用 `InputGroupButton` 尺寸；当前 realm 用 `realms.realm` |

### 模型设置

| 插槽                   | 位置         | props | 说明                        |
| ---------------------- | ------------ | ----- | --------------------------- |
| `model.setting.actions` | 模型工具栏   | —     | 当前模型用 `useModelState`  |

### ComfyUI

| 插槽                        | 位置                   | props     | 说明                             |
| --------------------------- | ---------------------- | --------- | -------------------------------- |
| `comfyui.model.main_button` | 模型页工具栏           | —         |                                  |
| `comfyui.model.card_actions`| 模型卡片悬浮工具条     | `{ item }`| 卡片 hover 才显示，放图标按钮    |
| `comfyui.workflow.main_button` | 工作流侧栏工具栏    | —         | 当前工作流用 `useComfyUIWorkflowState` |
| `comfyui.param.main_button` | 工作流参数工具栏       | —         | 当前工作流用 `useComfyUIWorkflowState` |
| `comfyui.param.tools`       | 每个参数条目工具列     | `{ entry }` | 竖向工具列                    |

### 任务

| 插槽                | 位置           | props     | 说明             |
| ------------------- | -------------- | --------- | ---------------- |
| `task.item.actions` | 每个任务行操作区 | `{ item }` | 每个任务渲染一次，`item` 是 `Task` |

### props 说明

- `{ item }`：当前对象，类型取决于插槽：`preset.list_item.actions` 是 `Preset`，`story.list_item.actions` 是 `Story`，`task.item.actions` 是 `Task`，`comfyui.model.card_actions` 是 `ComfyUIModel`。
- `{ entry }`：`PresetEntry<T>` / `StoryEntry<T>`，`T` 由当前 Tab 的条目类型决定。
- `{ state }`：该条目类型的 zustand store hook（`createPresetEntryState` / `createStoryEntryState` 的产物）。在渲染中调用 `state()` 订阅，事件回调里使用渲染时取到的 `refresh`：

```tsx
function EntryTools({
  state,
  entry,
}: {
  state: () => { refresh: () => Promise<void> };
  entry: PresetEntry<any>;
}) {
  // 渲染中调用 state() 订阅条目列表状态
  const { refresh } = state();

  return (
    <IconTooltip
      text={'my_plugin.translate'}
      onClick={handler(async () => {
        await myProxy.translate(entry);
        await refresh();
      })}
    >
      <LanguagesIcon />
    </IconTooltip>
  );
}
```

## 编写组件时的约定

1. **尺寸**：图标类位置（`*_tab_actions`、`*_main_button`、`entry.tools`、`card_actions`）用 `IconTooltip` 或 `Button size="icon"`，不要放大块布局。
2. **每个条目都会渲染一次**：`list_item.actions`、`card_actions`、`entry.tools` 这类插槽在列表里逐条渲染，组件要保持轻量；不要把全局弹窗、请求初始化放在这里。
3. **拿行对象**：逐条渲染的插槽都会传当前对象（`item` 或 `entry`），不要从 store 里拿“选中项”代替。
4. **浮层**：`global.overlay` 没有定位容器，组件自己处理 `position: fixed` 和 `pointer-events`。
5. **不要指望表单**：除 `realm.input.addon` 位于输入框表单内，其余插槽都在宿主表单之外；需要持久化数据请调用对应 `proxy`，插槽里的 `<input>` 不会被宿主读取或保存（`realm.input.addon` 里也不要放依赖消息提交的字段）。

## 排序与依赖

同一插槽内的多个组件按 `sequence` 升序渲染；需要强制顺序时用 `requires`：

```tsx
globals.uis.register(
  { id: 'a', slot: 'preset.tab_actions', component: A },
  { id: 'b', slot: 'preset.tab_actions', component: B, requires: ['a'] },
);
```

`requires` 引用不存在的 `id` 或形成环都会直接抛错，不会静默跳过。一般只在同一插槽内使用。

## 限制与注意事项

- **没有错误边界**：组件在 render 中抛错会导致宿主页面白屏。render 保持纯函数，异步和事件回调用 `handler` 包装。
- **注册时机**：只在客户端初始化函数里注册；运行期注册不会让已经渲染的插槽更新。
- **插槽名没有编译期校验**：拼错会静默渲染为空，请对照上面的清单。
- **只在对应页面存在**：`preset.*` 只在预设页，`realm.*` 只在游玩页；没选中预设/故事时部分插槽不会渲染。
- **props 是普通对象**：每次渲染都会新建，不要直接作为 `useEffect` 的依赖。
- **需要重新编译**：插件改动后执行 `pnpm prepare` 并重启，编译期插件没有热更新。

## 调试

- 注册成功会打印 `[uis] registered: <id>`。
- 插槽为空时不会渲染任何 DOM，先确认页面已加载、`slot` 拼写与当前页面匹配。
- 可以临时在宿主里检索 `UISlot slot={'...'}` 确认插入点。

## 维护者：新增插槽

```tsx
<UISlot slot={'module.area.purpose'} props={{ current }} />
```

- 命名：小写，`.` 分层，段内用 `_`，即 `<模块>.<区域>.<用途>`，例如 `preset.entry_list.actions`。
- 只传宿主当前已有的上下文，不为了插件需求额外造数据；`getState()` 能拿到的就不传。
- 放在明确的动作容器里（工具条、按钮组、卡片操作区），不要直接塞进普通 flex 行；不要放进 `<form>`。
- 新增或删除插槽后同步更新本文档的清单。
