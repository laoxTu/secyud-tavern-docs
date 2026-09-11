# Plugin Development Guide

This project uses compile-time plugins, which give you the debugging and development experience of a native Next.js project.

This guide uses `project-info` as an example.

## Development Workflow

1. Create a plugin project folder under the `plugins` folder.
   - Create the `project-info` folder.
2. Create the client initialization script.
   - Create a `client.tsx` file.
   > You can create a ts or tsx script; the script name is arbitrary.
   > If you want to follow the project's style, it is recommended to create a `client` folder here and place an `index.ts` inside it.
3. Create the server initialization script.
   - Create a `server.ts` file.
   > If you only need to make a frontend plugin, there is no need to create this script, and vice versa.
4. Create the `manifest.json` script declaration file.
   - id: The plugin's unique identifier
   - sequence: The plugin load order. You can also use `requires` to declare dependencies to control the order. `requires: ["dependency plugin id"]`
   - version: Version number
   - client: The client script. Write a relative path, using '/' as the separator.
   - server: The server script. Write a relative path, using '/' as the separator.
   - disabled: Whether it is disabled.
   ```json
   {
     "client": "client",
     "id": "project-info",
     "sequence": 1000,
     "server": "server",
     "version": "1.0.0"
   }
   ```
5. Create initialization functions for the client and server scripts respectively, and export them as the default export.
   - The client script runs once every time the page is initialized
   - The server script runs only once when the application starts
   ```js
   export default async function init() {
     // initialization logic
   }
   ```
6. Next, you can use any registrar in the project to register any component or feature.
   - Here a navigation tab page is registered to display the project introduction.
   ```js
   businessNavigationManager.register({
     id: 'info',
     sequence: 10000,
     label: () => <ModelTabHeader modelType={'about'} />,
     component: Content,
   });
   ```
7. Optional translation: you can refer to `project-info` and create a `localization` folder under the plugin directory to provide multi-language translations. Then call `useTranslations` to use them.

8. Run `pnpm prepare` once to prepare the plugin. At this point your plugin has been registered, and you can use `pnpm dev` for development and debugging.

## Usage Notes

This project uses the compile-time plugin development approach. Compared with the plugin development approach of older projects, it has the following advantages:

- No need to manually compile to JS. Plugin compilation accompanies the project, which greatly reduces the cost of plugin development.
- Native IDE and ESLint hints make plugin development more efficient without complicated configuration.
- No need to add declarations before importing. You can freely use project modules and third-party modules, and even modules from other plugins.
  - If you need to import other third-party packages, you can create a `package.json` under the plugin directory and add the dependencies. They will be imported automatically when the main project compiles.

Of course, this approach is not without drawbacks, but compared with the advantages, the drawbacks are almost negligible. For example:

- After updating a plugin, you need to recompile and restart the application; hot updates are not possible.
  - Runtime plugins can often be plug-and-play, which compile-time plugins cannot do. However, with `TypeScript 7`, the cost of recompiling the application is very low.
  - The current start script integrates pulling code, installing dependencies, prepare compilation, compiling, and starting into one, so you can update and restart with a single command.
- More freedom means more things can be done — which means the cost of malicious code is also lowered.
  - When installing plugins, I recommend only installing plugins created by developers you trust.

### Registering an API

Server plugins can register APIs.
You need to create an `api.ts` file under the server directory.

```ts
// your-plugin-name/server/api.ts
export default {
  path: {
    async POST(request: NextRequest, records: NextRecord) {
      const res = {}; // your business logic
      return NextResponse.json(res);
    },
  },
};
pluginRouteManager.registerRouteTree(route);
```

The client calls it via fetch:

```ts
await post(`path`, {
  body: formData,
});
```

### Creating a Proxy

This step is not required, but providing a proxy with type constraints and comments can let others understand your interface more clearly.
You can refer to the `client/proxy.ts` of each module in the project.

### Adding Translation Files

If your frontend project has content that needs translation, such as `t('your_namespace.your_key')`, you can create `zh.json` in the `your-plugin-name/localization` folder, and also provide an `en.json` to satisfy bilingual translation.

### Exporting for Others to Use

If your project is a base component, you can export public types and methods in `index.ts`, `client/index.ts`, and `server/client.ts`. The project convention is that types, factories, and hooks are exported directly, while utility functions and objects are exported through an object named with the plural form of `your_plugin_name`.

File descriptions

- index.ts: The base file. It only declares the base methods and types, as well as module information.
- client/index.ts: Client types, hooks, registration components
- server/index.ts: Server types, repositories, services
