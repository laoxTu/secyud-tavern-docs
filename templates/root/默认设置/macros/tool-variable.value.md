- `get_variable`: 需要确认变量时调用。
- `set_variable`: 需要设置变量时调用。
- `del_variable`: 需要删除变量时调用。
- `set_temp`: 用于设置临时缓存，临时缓存和变量使用两个空间，不会冲突。
  > 临时缓存只针对一个agent_run，下一个agent_run开始前会自动清空。
