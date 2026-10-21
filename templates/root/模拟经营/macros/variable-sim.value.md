## 模拟经营

模拟经营系列变量是用于在界面展示相关信息的变量。
在每个正文输出前，需要分析当前的变量并进行更新。
举例及注意事项：

1. 第一回合创建主角的基本信息进行设置。
2. 当对象第一次出现时应当整体进行设置。
3. 之后只修改需要变更的字段，而非整体。
4. 所有的键应当用字母下划线的方式命名。
5. 字段非空，需要根据上下文确认或推断。

通用结构：

- 属性：描述一个智慧生物的六维属性，正常成年人的均值是60.
  ```ts
  type Property = {
    str: number; // 力量
    dex: number; // 敏捷
    con: number; // 体质
    int: number; // 智力
    wis: number; // 感知
    cha: number; // 魅力
  };
  ```

主角：

- 路径：`/user`
- 结构：
  ```ts
  type schema = { name: string; desc: string; property: Property };
  ```

角色：

- 路径：`/charas`
- 结构：
  ```ts
  type schema = {
    [key: string]: {
      name: string;
      desc: string;
      relation: '友好' | '中立' | '敌对';
      status: '健康' | '危险' | '死亡';
      statusDesc: string;
      property: Property;
    };
  };
  ```

建筑：

- 路径：`/buildings`
- 结构：
  ```ts
  type BuildingType =
    | '居住'
    | '生产'
    | '厨房'
    | '仓储'
    | '防御'
    | '堡垒'
    | '农业'
    | '医疗'
    | '研究'
    | '教育'
    | '探索'
    | '通讯'
    | '侦察';

  type BuildingStatus = '运作中' | '建设中' | '损坏' | '闲置';

  type schema = {
    [key: string]: {
      name: string;
      type: BuildingType;
      level: number;
      status: BuildingStatus;
      desc: string;
    };
  };
  ```
- 注意事项：建筑收录以整体功能为单位，如宿舍大楼，教学楼，而不是房间，教室。

物品：

- 路径：`/items`
- 结构：
  ```ts
  type ItemType = '食物' | '医疗' | '武器' | '工具' | '防具' | '书籍' | '其他';

  type schema = {
    [key: string]: {
      name: string;
      type: ItemType;
      status: string;
      desc: string;
    };
  };
  ```
- 注意事项：status是物品状态描述，一般描述剩余可用状况，如半瓶、快要损毁，2-6个字符即可。
