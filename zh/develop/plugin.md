# 插件开发指南

本项目使用编译期插件，它可以为你带来原生nextjs项目的调试和开发体验。

该指南以`project-info`为例进行说明。

## 开发流程

1. 在`plugins`文件夹下创建插件项目文件夹。
   - 创建`project-info`文件夹。
2. 创建客户端初始化脚本。
   - 创建`client.tsx`文件。
   > 你可以创建ts或者tsx脚本，脚本的名称是任意的。
   > 如果想要仿照项目的风格，这里建议创建client文件夹，并在内部放置一个`index.ts`。
3. 创建服务端初始化脚本。
   - 创建`server.ts`文件。
   > 如果您只需要制作前端插件，则无需创建此脚本，反之同理。
4. 创建`manifest.json`脚本声明文件。
   - id: 插件唯一标识符
   - sequence: 插件加载顺序，也可以使用`requires` 声明依赖控制顺序。`requires: ["依赖的插件id"]`
   - version: 版本号
   - client: 客户端脚本，写相对路径，以'/'为分隔符。
   - server: 服务端脚本，写相对路径，以'/'为分隔符。
   - disabled: 是否禁用。
   ```json
   {
     "client": "client",
     "id": "project-info",
     "sequence": 1000,
     "server": "server",
     "version": "1.0.0"
   }
   ```
5. 为客户端和服务端脚本分别创建初始化函数，导出为默认方法。
   - 客户端脚本在每次初始化网页时会执行一次
   - 服务端脚本只在应用启动时会执行一次
   ```js
   export default async function init() {
     // 初始化逻辑
   }
   ```
6. 接下来，您可以使用项目中的任意注册器注册任意组件或功能。
   - 这里注册了一个导航Tab页，用于显示项目介绍。
   ```js
   businessNavigationManager.register({
     id: 'info',
     sequence: 10000,
     label: () => <ModelTabHeader modelType={'about'} />,
     component: Content,
   });
   ```
7. 可选翻译，可以参考`project-info`在插件目录下创建`localization`文件夹并进行多语言翻译。并调用`useTranslations`使用多语言。

8. 执行一次`pnpm prepare`进行插件准备。至此，您的插件已经注册，可以使用`pnpm dev`进行开发调试。

## 使用事项

该项目的插件使用编译期插件的开发方式。 相比老式项目的插件开发方式，它有以下优点

- 无需手动编译成js，插件的编译是伴随项目的，大大解放插件开发成本。
- 使用原生ide以及eslint的提示功能，让插件开发更加高效且无需繁杂配置。
- 无需在导入前添加声明，您可以随意使用项目模块以及第三方模块，甚至其它插件的模块。
  - 如果您需要引入其它第三方包，可以在插件目录下创建`package.json`并引入依赖。主项目编译时会自动引入。

当然，这种方式并不是没有缺点，但是相比于优点，缺点几乎可以忽略。例如

- 更新插件后需要重新编译启动应用，无法做到热更新。
  - 运行时插件往往可以即插即用，这是编译期插件无法做到的，但是在`type script 7`的加持下，重新编译应用的成本很低。
  - 目前的start脚本集成拉取代码，安装依赖，编译准备，编译，启动为一体，可以做到一键更新重启。
- 更自由意味着能做的事情更多--这意味着恶意代码的成本也随之变低了。
  - 在安装插件时，我建议只安装您信任的开发者创作的插件。

### 注册api

服务端插件可以注册api
需要在server目录下创建api.ts文件

```ts
// your-plugin-name/server/api.ts
export default {
  path: {
    async POST(request: NextRequest, records: NextRecord) {
      const res = {}; // 你的业务逻辑
      return NextResponse.json(res);
    },
  },
};
```

客户端通过fetch调用：

```ts
await post(`path`, {
  body: formData,
});
```

### 创建Proxy

这一步不是必须的，但提供一个proxy并添加类型约束和注释可以让他人更清晰的理解你的接口
可以参考项目中每个模块的 client/proxy.ts

### 添加翻译文件

如果你的前端项目有需要翻译的，如`t('your_namespace.your_key')`，你可以在`your-plugin-name/localization`文件夹中创建`zh.json`，同时提供一份`en.json`满足双语翻译。

### 导出以供他人使用

如果您的项目是一个基础组件，可以在`index.ts` `client/index.ts` `server/client.ts`中导出公开的类型和方法，项目惯例是类型、工厂、hook直接导出，而工具函数和对象通过一个`your_plugin_name`的复数形式作为对象名导出。

文件说明

- index.ts: 基础文件，只声明基础方法和类型，以及模块信息。
- client/index.ts: 客户端类型，hook，注册组件
- server/index.ts: 服务端类型，仓储，服务
