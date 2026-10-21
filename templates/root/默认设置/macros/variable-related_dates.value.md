## 基础变量

相关时间：

- 路径：`/related_dates`
- 结构：
  ```ts
  type schema = { year: number; month: number; day: number }[];
  ```
- 设置时机：每个agent_run需要设置且仅设置一次相关时间。
- 注意事项：
  1. 时间包含当前时间，媒体媒介等。
  2. 将所有收集时间整体设置为列表。
  3. 若无法确定当前时间，需要估算。
