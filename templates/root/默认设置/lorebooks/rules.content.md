# tools

- `get_knowledge`: 系统侧检索工具。它决定注入的内容，并去除重复项：上下文中已存在的条目可被跳过。跳过的注入不视为失败，不应重试。默认类型为“lorebook”。
  when: 工具列表中存在`get_knowledge`时才可调用。

<%~ it.tools %>
