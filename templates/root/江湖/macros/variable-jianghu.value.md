## 江湖

「江湖」界面用以下变量展示主角名帖、行迹、人物关系、势力、江湖事与行囊。每次正文输出前，先按当前剧情更新；第一回合建立主角。

通用规则：

1. 第一次出现的人物、势力、物品整体写入；之后只改变化了的字段。
2. 字段不得为空；上下文没写明的，按人物身份与处境推断。
3. 关系、状态、分类只能使用下面列出的精确值，不要自造近义词。
4. 描述字段用短句：statusDesc 与 desc 各 15～40 字，写看得见的伤、气色、动作或场面，不写数值、不写心理分析。

行迹 `/scene`：

```ts
type Scene = string; // 例：'景和三年·春 · 洛阳 · 雨'
```

- 固定一行，写「年号·季节 · 地点 · 天气」。
- 只在时间、地点或天气变化时更新；没有变化不要重写。
- 地点写当前所在，不写路线。

属性 Property：力道、灵巧、根骨、悟性、神识、风仪，正常成年人均值 60。

```ts
type Property = {
  str: number; // 力道
  dex: number; // 灵巧
  con: number; // 根骨
  int: number; // 悟性
  wis: number; // 神识
  cha: number; // 风仪
};
```

境界 `/user.realms`：

```ts
type WudaoRealm =
  | '后天'
  | '先天'
  | '入微'
  | '入道'
  | '通神'
  | '归真'
  | '成圣';

type XiuxianRealm =
  | '练气'
  | '筑基'
  | '金丹'
  | '元婴'
  | '化神'
  | '炼虚'
  | '仙';

type Realms = {
  wudao?: WudaoRealm;
  xiuxian?: XiuxianRealm;
};
```

- 武道、修仙各自独立；可以只走一条，也可以仙武双修。
- 至少写一条；只写已知的，不猜。
- 只做标签：不写进度、数值、突破成功率。

武学 `/user.skills`：

```ts
type SkillType = '心法' | '招式' | '轻功' | '绝技' | '其他';
type SkillPath = '武道' | '修仙';
type Mastery = '初窥' | '小成' | '大成' | '圆满' | '出神入化';

type Skill = {
  name: string;
  type: SkillType;
  path: SkillPath;
  mastery: Mastery;
  desc: string;
};
```

- 心法收内功、外功（如金钟罩）、内外合一、修仙功法；招式收拳脚与兵器；绝技收绝招、神通、秘术。
- `path` 只写武 / 仙，用来区分同属心法的武道功法和修仙功法。
- 只在学会、突破、被废时更新；`desc` 15～40 字；不设数量上限。
- NPC 不写 `skills`，只写一句 `martial`。

主角 `/user`：

```ts
type CharStatus = '无恙' | '负伤' | '濒危' | '身亡';

type User = {
  name: string;
  title: string; // 江湖绰号，2～8 字，如「断剑客」
  desc: string;
  status: CharStatus;
  statusDesc: string; // 详细状态，tooltip 用
  property: Property;
  realms: Realms;
  skills: Skill[];
};
```

- `title` 只写绰号，不写门派、师承、身份或名望；主角必填。
- `statusDesc` 写当前可见状态（旧伤、气色、中毒等），15～40 字；与 `desc` 不重复。

人物 `/charas`：

```ts
type Relation = '知己' | '相识' | '仇敌';

type Chara = {
  name: string;
  title?: string; // 绰号，可选
  desc: string;
  relation: Relation;
  status: CharStatus;
  statusDesc: string;
  property: Property;
  realms?: Realms; // 只写已知的；可单修可双修
  martial?: string; // 武学描述，一句话；tooltip 用
};
```

- relation 只写主角与此人的关系。
- status 写此人当前身体状态；statusDesc 写可见的伤势、气色或态度。
- 有绰号就写 `title`，没有就省略；同样只写绰号，不写门派或身份。
- `realms` 只在明确时写；`martial` 只写一句看家本领 + 火候 + 效果，15～40 字，不拆技能列表。
- NPC 不写 `skills`；武学描述放在 `martial`，界面会把它做成 tooltip。

势力 `/factions`：

```ts
type FactionType = '门派' | '帮派' | '官府' | '商会' | '世家' | '其他';
type FactionRelation = '亲善' | '中立' | '敌对';
type FactionPower = '三流' | '二流' | '一流' | '顶尖';

type Faction = {
  name: string;
  type: FactionType;
  relation: FactionRelation;
  power: FactionPower;
  desc: string;
};
```

- relation 写这个势力对主角 / 主角所属势力的态度。
- power 只写整体实力档位，不写人数。
- desc 写首领、地盘、行事风格，15～40 字。
- 势力第一次出现时整体写入；关系或实力变化时更新。

江湖事 `/jianghu`：

```ts
type JianghuKind = '传闻' | '委托' | '悬赏' | '恩怨';

type JianghuEntry = {
  kind: JianghuKind;
  title: string; // 短标题，建议不超过 12 字
  desc: string; // 15～40 字
};

type schema = JianghuEntry[];
```

- kind 只能用四个精确值。
- 最新的事放在最前面；已了结 / 过时的条目删掉，不设硬上限。
- 传闻写听来的风声，不写成事实；委托写谁托你做什么；悬赏写目标和赏格；恩怨写谁与谁之间的恩或怨。

行囊 `/items`：

```ts
type ItemType = '兵刃' | '护具' | '丹药' | '干粮' | '典籍' | '杂物';
type ItemStatus = '完好' | '尚可' | '将尽' | '残破' | '已尽';

type Item = {
  name: string;
  type: ItemType;
  status: ItemStatus;
  desc: string;
};
```

- status 只做粗判（完好 / 尚可 / 将尽 / 残破 / 已尽），具体数量与损伤写进 desc。
- 杂物收火折、绳索、地图、银两、信物等不便归类的东西。

示例（只示意字段写法，实际按剧情填写）：

```json
{
  "scene": "景和三年·春 · 洛阳 · 雨",
  "user": {
    "name": "沈砚",
    "title": "断剑客",
    "desc": "青衫落拓，腰间一柄断剑。",
    "status": "无恙",
    "statusDesc": "左肩旧伤已收口，只是阴雨天还会发酸。",
    "property": { "str": 72, "dex": 84, "con": 63, "int": 55, "wis": 68, "cha": 47 },
    "realms": { "wudao": "先天", "xiuxian": "练气" },
    "skills": [
      {
        "name": "青城剑法",
        "type": "招式",
        "path": "武道",
        "mastery": "大成",
        "desc": "剑走轻灵，后发先至；守中带攻，最合青城心法。"
      },
      {
        "name": "金钟罩",
        "type": "心法",
        "path": "武道",
        "mastery": "圆满",
        "desc": "外功横练，气沉丹田；刀枪难入，水火不侵。"
      },
      {
        "name": "引气诀",
        "type": "心法",
        "path": "修仙",
        "mastery": "初窥",
        "desc": "引天地清气入体，初成时只觉掌心微凉，尚不能御物。"
      }
    ]
  },
  "charas": {
    "苏晚照": {
      "name": "苏晚照",
      "title": "金针娘子",
      "desc": "城南药庐的主人。",
      "relation": "知己",
      "status": "无恙",
      "statusDesc": "她把温着的药推过来，指尖还沾着药渣。",
      "property": { "str": 32, "dex": 58, "con": 46, "int": 79, "wis": 88, "cha": 71 },
      "realms": { "wudao": "后天" },
      "martial": "一手金针使得出神入化，认穴不必看，三丈内能封人经脉。"
    }
  },
  "factions": {
    "青城派": {
      "name": "青城派",
      "type": "门派",
      "relation": "敌对",
      "power": "一流",
      "desc": "山门在青城后山，掌门闭关多年，门下弟子仍在追那半枚铜钱。"
    },
    "洛阳府衙": {
      "name": "洛阳府衙",
      "type": "官府",
      "relation": "中立",
      "power": "一流",
      "desc": "明面上不问江湖事，暗地里每道城门都有人盯着来往的剑客。"
    }
  },
  "jianghu": [
    {
      "kind": "传闻",
      "title": "听雨楼夜剑",
      "desc": "昨夜有人在听雨楼拔剑，天亮后只留下一截断穗。"
    },
    {
      "kind": "委托",
      "title": "护送药车",
      "desc": "苏晚照托你把一车药材送出城，走北门，别走官道。"
    },
    {
      "kind": "悬赏",
      "title": "青城叛徒",
      "desc": "青城派在洛阳各处贴了海捕文书，赏银三百两，要活的。"
    }
  ],
  "items": {
    "断水": {
      "name": "断水",
      "type": "兵刃",
      "status": "残破",
      "desc": "剑身中段裂开一道细纹，出鞘仍有清响。"
    }
  }
}
```
