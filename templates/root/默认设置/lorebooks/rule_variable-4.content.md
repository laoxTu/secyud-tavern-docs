# 变量

## 相关时间

1. 格式

```ts
export interface Variable {
    relatedDates: {
        year: number,
        month: number,
        day: number,
    }[]
}
```

2. 要求

* 在每个回复中，需要将当前对话提及的时间收集起来，设置到字段relatedDates中。
* 收集的时间包含所有提及的时间。如当前的时间，回忆的时间，书籍或媒体中的时间。
* 若没有任何提到的时间，需要估算当前的时间进行填入。
* 设置`relatedDates`时应当将整个数组作为整体进行设置。
  * 例如`[{year:1,month:1,day:1},{year:1,month:2,day:3}]`
