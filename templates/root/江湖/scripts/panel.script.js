import { h } from 'preact';
import { useState } from 'preact/hooks';

const {
  STab,
  SFloating,
  SRadarChart,
  SExpand,
  SVariableImage,
  STooltip,
} = window.sComponents;
const { get, useMessageData, appendItemInput, renderComponent } = window.sUtils;

// ============================================================
// 枚举与色调
// 分类、状态只认精确值；新增类别时在这里补一行即可。
// ============================================================

const PROPERTY_FIELDS = [
  ['str', '力道'],
  ['dex', '灵巧'],
  ['con', '根骨'],
  ['int', '悟性'],
  ['wis', '神识'],
  ['cha', '风仪'],
];

const RELATION_TONES = {
  知己: 'good',
  相识: 'info',
  仇敌: 'bad',
};

const CHARA_STATUS_TONES = {
  无恙: 'good',
  负伤: 'warn',
  濒危: 'bad',
  身亡: 'muted',
};

const FACTION_TYPES = {
  门派: { icon: '门', tone: 'good' },
  帮派: { icon: '帮', tone: 'bad' },
  官府: { icon: '官', tone: 'info' },
  商会: { icon: '商', tone: 'gold' },
  世家: { icon: '家', tone: 'violet' },
  其他: { icon: '杂', tone: 'muted' },
};

const FACTION_RELATION_TONES = {
  亲善: 'good',
  中立: 'info',
  敌对: 'bad',
};

const FACTION_POWER_TONES = {
  三流: 'muted',
  二流: 'info',
  一流: 'gold',
  顶尖: 'violet',
};

const FACTION_FILTERS = [
  { key: '*', label: '全部' },
  { key: '亲善', label: '亲善' },
  { key: '中立', label: '中立' },
  { key: '敌对', label: '敌对' },
];

const JIANGHU_KINDS = {
  传闻: 'info',
  委托: 'good',
  悬赏: 'bad',
  恩怨: 'warn',
};

const JIANGHU_FILTERS = [
  { key: '*', label: '全部' },
  { key: '传闻', label: '传闻' },
  { key: '委托', label: '委托' },
  { key: '悬赏', label: '悬赏' },
  { key: '恩怨', label: '恩怨' },
];

const SKILL_TYPES = ['心法', '招式', '轻功', '绝技', '其他'];

const SKILL_TYPE_TONES = {
  心法: 'good',
  招式: 'bad',
  轻功: 'info',
  绝技: 'violet',
  其他: 'muted',
};

const SKILL_PATHS = {
  武道: { label: '武', tone: 'gold' },
  修仙: { label: '仙', tone: 'violet' },
};

const MASTERY_LEVELS = ['初窥', '小成', '大成', '圆满', '出神入化'];

const MASTERY_TONES = {
  初窥: 'muted',
  小成: 'info',
  大成: 'gold',
  圆满: 'good',
  出神入化: 'violet',
};

const SKILL_TYPE_ORDER = {
  心法: 0,
  招式: 1,
  轻功: 2,
  绝技: 3,
  其他: 4,
};

const SKILL_PATH_ORDER = {
  武道: 0,
  修仙: 1,
};

const SKILL_FILTERS = [
  { key: '*', label: '全部' },
  ...SKILL_TYPES.map((type) => ({ key: type, label: type })),
];

const ITEM_TYPES = {
  兵刃: { icon: '兵', tone: 'bad' },
  护具: { icon: '甲', tone: 'info' },
  丹药: { icon: '丹', tone: 'good' },
  干粮: { icon: '粮', tone: 'gold' },
  典籍: { icon: '典', tone: 'violet' },
  杂物: { icon: '杂', tone: 'muted' },
};

const ITEM_STATUS_TONES = {
  完好: 'good',
  尚可: 'info',
  将尽: 'warn',
  残破: 'bad',
  已尽: 'muted',
};

const KNOWN_ITEM_TYPES = new Set(Object.keys(ITEM_TYPES));

const ITEM_FILTERS = [
  { key: '*', label: '全部' },
  { key: '兵刃', label: '兵刃' },
  { key: '护具', label: '护具' },
  { key: '丹药', label: '丹药' },
  { key: '干粮', label: '干粮' },
  { key: '典籍', label: '典籍' },
  { key: '杂物', label: '杂物' },
];

function getProperties(chara) {
  const property = chara.property ?? {};
  return PROPERTY_FIELDS.map(([id, name]) => ({
    id,
    name,
    value: property[id] ?? 0,
  }));
}

// ============================================================
// 个人状态 — 身份卡
// ============================================================
function ProfileCard({ chara, showStatus = false }) {
  const tone = CHARA_STATUS_TONES[chara.status] ?? 'muted';

  return h('div', { className: `profile-card tone-${tone}` }, [
    h(
      'div',
      { className: 'profile-avatar' },
      h(SVariableImage, {
        className: 'profile-avatar',
        name: `avatar-${chara.name}`,
        defaultComponent: () =>
          h(
            'span',
            { className: 'profile-avatar-fallback' },
            chara.name?.[0] || '?',
          ),
      }),
    ),
    h(
      'div',
      { className: 'profile-info' },
      h(
        'div',
        { className: 'profile-head' },
        h('div', { className: 'profile-name' }, chara.name),
        chara.title
          ? h('span', { className: 'profile-title' }, chara.title)
          : null,
      ),
      showStatus && chara.status
        ? h(
            'div',
            { className: 'profile-meta' },
            h(
              STooltip,
              { content: chara.statusDesc },
              h(
                'span',
                { className: `chara-status-tag tone-${tone}` },
                chara.status,
              ),
            ),
          )
        : null,
      h('div', { className: 'profile-desc' }, chara.desc),
    ),
  ]);
}

// ============================================================
// 个人状态 — 属性卡片（六维 + 雷达图）
// ============================================================
function PropertyCard({ chara }) {
  const properties = getProperties(chara);
  const max = Math.max(
    ...properties.map((property) => Math.abs(property.value) + 1),
    1,
  );
  const min = Math.min(
    ...properties.map((property) => Math.abs(property.value)),
  );

  return h(
    'div',
    { className: 'property-card' },
    h(
      'div',
      { className: 'property-items' },
      properties.map((property) => {
        return h(
          'div',
          { className: 'property-item', key: property.id },
          h('div', { className: 'property-label' }, property.name),
          h(
            'div',
            {
              className: 'property-progress',
              style: {
                '--percentage': Math.abs(
                  (100 * property.value) / max,
                ).toFixed(2),
              },
            },
            h('div', {
              className: `property-progress-bar${property.value < 0 ? ' reverse' : ''}`,
            }),
          ),
          h('div', { className: 'property-value' }, property.value),
        );
      }),
    ),
    h(
      'div',
      { className: 'property-radar' },
      h(SRadarChart, { items: properties, max: max, min: min * 0.9 }),
    ),
  );
}

// ============================================================
// Tab: 自身
// ============================================================
function PropertyTabContent({ user }) {
  return [
    h(ProfileCard, { chara: user, showStatus: true }),
    h(PropertyCard, { chara: user }),
  ];
}

// ============================================================
// Tab: 武学
// ============================================================
function RealmTags({ realms }) {
  const wudao = realms?.wudao;
  const xiuxian = realms?.xiuxian;

  if (!wudao && !xiuxian) {
    return h('span', { className: 'realm-tag realm-unset' }, '境界未定');
  }

  return [
    wudao
      ? h(
          'span',
          { key: 'wudao', className: 'realm-tag realm-wudao' },
          `武道 · ${wudao}`,
        )
      : null,
    xiuxian
      ? h(
          'span',
          { key: 'xiuxian', className: 'realm-tag realm-xiuxian' },
          `修仙 · ${xiuxian}`,
        )
      : null,
  ];
}

function MasteryDots({ level }) {
  const index = MASTERY_LEVELS.indexOf(level);
  const tone = MASTERY_TONES[level] ?? 'muted';

  return h('span', { className: 'mastery' }, [
    h(
      'span',
      { className: 'mastery-dots' },
      MASTERY_LEVELS.map((_, dotIndex) =>
        h('span', {
          key: dotIndex,
          className: `mastery-dot${dotIndex <= index ? ' on' : ''}`,
        }),
      ),
    ),
    h('span', { className: `mastery-word tone-${tone}` }, level || '未明'),
  ]);
}

function SkillCard({ data }) {
  const typeTone = SKILL_TYPE_TONES[data.type] ?? 'muted';
  const path = SKILL_PATHS[data.path] ?? { label: '?', tone: 'muted' };

  return h('article', { className: `s-card skill-card tone-${typeTone}` }, [
    h('div', { className: 'skill-head' }, [
      h('div', { className: 'skill-name' }, data.name || '未命名'),
      h(
        'span',
        { className: `skill-type tone-${typeTone}` },
        data.type || '其他',
      ),
      h('span', { className: `skill-path tone-${path.tone}` }, path.label),
    ]),
    h(
      'div',
      { className: 'skill-mastery' },
      h(MasteryDots, { level: data.mastery }),
    ),
    data.desc ? h('p', { className: 'skill-desc' }, data.desc) : null,
  ]);
}

function SkillTabContent({ user }) {
  const [filter, setFilter] = useState('*');
  const realms = user?.realms;
  const skills = Array.isArray(user?.skills)
    ? user.skills.filter(Boolean)
    : [];
  const filtered = skills.filter((skill) => {
    return filter === '*' || skill.type === filter;
  });
  const sorted = [...filtered].sort((a, b) => {
    return (
      (SKILL_PATH_ORDER[a.path] ?? 9) - (SKILL_PATH_ORDER[b.path] ?? 9) ||
      (SKILL_TYPE_ORDER[a.type] ?? 9) - (SKILL_TYPE_ORDER[b.type] ?? 9) ||
      MASTERY_LEVELS.indexOf(b.mastery) -
        MASTERY_LEVELS.indexOf(a.mastery) ||
      String(a.name || '').localeCompare(String(b.name || ''), 'zh')
    );
  });

  return h('div', { className: 'list-root' }, [
    h('div', { className: 'skill-summary' }, [
      h('span', { className: 'skill-summary-seal' }, '武'),
      h(
        'span',
        { className: 'skill-summary-realms' },
        h(RealmTags, { realms }),
      ),
      h('span', { className: 'skill-count' }, `${skills.length} 门`),
    ]),
    skills.length
      ? h(
          'div',
          { className: 'filter-row' },
          SKILL_FILTERS.map((item) =>
            h(
              'button',
              {
                key: item.key,
                className: `filter-btn${filter === item.key ? ' active' : ''}`,
                onClick: () => setFilter(item.key),
              },
              item.label,
            ),
          ),
        )
      : null,
    skills.length
      ? h(
          'div',
          { className: 'list-stack' },
          sorted.map((skill, index) =>
            h(SkillCard, {
              data: skill,
              key: `${skill.path}-${skill.type}-${skill.name}-${index}`,
            }),
          ),
        )
      : h(
          'div',
          { className: 'list-empty' },
          h('div', { className: 'chara-empty-icon' }, '武'),
          h('div', { className: 'chara-empty-text' }, '尚未习武'),
        ),
  ]);
}

// ============================================================
// Tab: 人物
// ============================================================
function MartialRow({ chara }) {
  const hasRealm = Boolean(chara.realms?.wudao || chara.realms?.xiuxian);
  const martial = chara.martial;

  if (!hasRealm && !martial) return null;

  const row = h('span', { className: 'martial-row' }, [
    h('span', { className: 'martial-seal' }, '武'),
    hasRealm
      ? h(
          'span',
          { className: 'martial-realms' },
          h(RealmTags, { realms: chara.realms }),
        )
      : null,
  ]);

  return martial
    ? h(STooltip, { content: martial, className: 'martial-tip' }, row)
    : row;
}

function CharaCard({ chara }) {
  const relationTone = RELATION_TONES[chara.relation] ?? 'muted';
  const statusTone = CHARA_STATUS_TONES[chara.status] ?? 'muted';

  return h(SExpand, {
    className: `chara-card tone-${relationTone}`,
    header: () => [
      h('span', { className: 's-card-title' }, chara.name),
      chara.relation
        ? h(
            'span',
            { className: `chara-relation tone-${relationTone}` },
            chara.relation,
          )
        : null,
      h(
        STooltip,
        { content: chara.statusDesc },
        h(
          'span',
          { className: `chara-status-tag tone-${statusTone}` },
          chara.status ?? '未知',
        ),
      ),
      h(
        'button',
        {
          className: 's-card-add',
          onClick: (event) => {
            event.stopPropagation();
            appendItemInput(chara);
          },
        },
        '✚',
      ),
    ],
    children: () => [
      h(ProfileCard, { chara }),
      h(MartialRow, { chara }),
      chara.statusDesc
        ? h('div', { className: 'card-desc' }, chara.statusDesc)
        : null,
      h(PropertyCard, { chara }),
    ],
  });
}

function CharasTabContent({ charas }) {
  const entries = Object.entries(charas || {});
  if (entries.length === 0) {
    return h(
      'div',
      { className: 'chara-empty' },
      h('div', { className: 'chara-empty-icon' }, '侠'),
      h('div', { className: 'chara-empty-text' }, '尚无江湖人物'),
    );
  }

  return h(
    'div',
    { className: 'charas-list' },
    entries.map(([name, data]) => h(CharaCard, { chara: data, key: name })),
  );
}

// ============================================================
// Tab: 势力
// ============================================================
function FactionCard({ data }) {
  const type = FACTION_TYPES[data.type] ?? FACTION_TYPES.其他;
  const relationTone = FACTION_RELATION_TONES[data.relation] ?? 'muted';
  const powerTone = FACTION_POWER_TONES[data.power] ?? 'muted';

  return h(SExpand, {
    className: `faction-card tone-${relationTone}`,
    header: () => [
      h(
        'span',
        { className: `faction-type-dot tone-${type.tone}` },
        type.icon,
      ),
      h('span', { className: 's-card-title' }, data.name || '未命名'),
      data.power
        ? h(
            'span',
            { className: `faction-power tone-${powerTone}` },
            data.power,
          )
        : null,
      h(
        'span',
        { className: `faction-relation tone-${relationTone}` },
        data.relation || '未知',
      ),
      h(
        'button',
        {
          className: 's-card-add',
          onClick: (event) => {
            event.stopPropagation();
            appendItemInput(data);
          },
        },
        '✚',
      ),
    ],
    children: () =>
      data.desc ? h('div', { className: 'card-desc' }, data.desc) : null,
  });
}

function FactionTabContent({ factions }) {
  const [filter, setFilter] = useState('*');
  const entries = Object.entries(factions || {});
  const filtered = entries.filter(([, data]) => {
    return filter === '*' || data.relation === filter;
  });

  if (entries.length === 0) {
    return h(
      'div',
      { className: 'list-empty' },
      h('div', { className: 'chara-empty-icon' }, '势'),
      h('div', { className: 'chara-empty-text' }, '尚无势力'),
    );
  }

  return h(
    'div',
    { className: 'list-root' },
    h(
      'div',
      { className: 'filter-row' },
      FACTION_FILTERS.map((item) =>
        h(
          'button',
          {
            key: item.key,
            className: `filter-btn${filter === item.key ? ' active' : ''}`,
            onClick: () => setFilter(item.key),
          },
          item.label,
        ),
      ),
    ),
    h(
      'div',
      { className: 'list-stack' },
      filtered.map(([name, data]) => h(FactionCard, { data, key: name })),
    ),
  );
}

// ============================================================
// Tab: 江湖
// ============================================================
function JianghuCard({ data }) {
  const tone = JIANGHU_KINDS[data.kind] ?? 'muted';

  return h('article', { className: `s-card jianghu-card tone-${tone}` }, [
    h(
      'div',
      { className: 'jianghu-head' },
      h(
        'span',
        { className: `jianghu-kind tone-${tone}` },
        data.kind || '事',
      ),
      h('div', { className: 'jianghu-title' }, data.title || '未题'),
    ),
    data.desc ? h('p', { className: 'jianghu-desc' }, data.desc) : null,
  ]);
}

function JianghuTabContent({ jianghu }) {
  const [filter, setFilter] = useState('*');
  const entries = Array.isArray(jianghu)
    ? jianghu.filter(Boolean)
    : [];
  const filtered = entries.filter((entry) => {
    return filter === '*' || entry.kind === filter;
  });

  if (entries.length === 0) {
    return h(
      'div',
      { className: 'list-empty' },
      h('div', { className: 'chara-empty-icon' }, '闻'),
      h('div', { className: 'chara-empty-text' }, '江湖无事'),
    );
  }

  return h(
    'div',
    { className: 'list-root' },
    h(
      'div',
      { className: 'filter-row' },
      JIANGHU_FILTERS.map((item) =>
        h(
          'button',
          {
            key: item.key,
            className: `filter-btn${filter === item.key ? ' active' : ''}`,
            onClick: () => setFilter(item.key),
          },
          item.label,
        ),
      ),
    ),
    h(
      'div',
      { className: 'list-stack' },
      filtered.map((entry, index) =>
        h(JianghuCard, {
          data: entry,
          key: `${entry.kind}-${entry.title}-${index}`,
        }),
      ),
    ),
  );
}

// ============================================================
// Tab: 行囊
// ============================================================
function ItemCard({ data }) {
  const type = ITEM_TYPES[data.type] ?? ITEM_TYPES.杂物;
  const statusTone = ITEM_STATUS_TONES[data.status] ?? 'muted';

  return h(SExpand, {
    className: `item-card tone-${type.tone}`,
    header: () => [
      h('span', { className: `item-type-dot tone-${type.tone}` }, type.icon),
      h('span', { className: 's-card-title' }, data.name || '未命名'),
      data.status
        ? h(
            'span',
            { className: `item-status-tag tone-${statusTone}` },
            data.status,
          )
        : null,
      h(
        'button',
        {
          className: 's-card-add',
          onClick: (event) => {
            event.stopPropagation();
            appendItemInput(data);
          },
        },
        '✚',
      ),
    ],
    children: () =>
      data.desc ? h('div', { className: 'card-desc' }, data.desc) : null,
  });
}

function ItemTabContent({ items }) {
  const [filter, setFilter] = useState('*');
  const entries = Object.entries(items || {});
  const filtered = entries.filter(([, data]) => {
    if (filter === '*') return true;
    if (filter === '杂物') {
      return data.type === '杂物' || !KNOWN_ITEM_TYPES.has(data.type);
    }
    return data.type === filter;
  });

  if (entries.length === 0) {
    return h(
      'div',
      { className: 'list-empty' },
      h('div', { className: 'chara-empty-icon' }, '囊'),
      h('div', { className: 'chara-empty-text' }, '行囊空空'),
    );
  }

  return h(
    'div',
    { className: 'list-root' },
    h(
      'div',
      { className: 'filter-row' },
      ITEM_FILTERS.map((item) =>
        h(
          'button',
          {
            key: item.key,
            className: `filter-btn${filter === item.key ? ' active' : ''}`,
            onClick: () => setFilter(item.key),
          },
          item.label,
        ),
      ),
    ),
    h(
      'div',
      { className: 'list-stack' },
      filtered.map(([name, data]) => h(ItemCard, { data, key: name })),
    ),
  );
}

// ============================================================
// App
// ============================================================
function SceneBar({ scene }) {
  if (!scene) return null;

  return h('div', { className: 'scene-bar' }, [
    h('span', { className: 'scene-seal' }, '行'),
    h('span', { className: 'scene-text' }, scene),
  ]);
}

function App() {
  const [variables] = useMessageData('variables');

  return SFloating({
    children: () =>
      h(STab, {
        layout: (header, content) =>
          h(
            'div',
            {
              className: 'sim-panel',
            },
            h('div', { className: 'panel-frame', 'aria-hidden': 'true' }),
            h(SceneBar, { scene: get(variables, 'scene', '') }),
            header,
            content,
          ),
        tabs: [
          {
            id: 'property',
            header: () => '自身',
            content: () =>
              h(PropertyTabContent, {
                user: get(variables, 'user', {}),
              }),
          },
          {
            id: 'skills',
            header: () => '武学',
            content: () =>
              h(SkillTabContent, {
                user: get(variables, 'user', {}),
              }),
          },
          {
            id: 'charas',
            header: () => '人物',
            content: () =>
              h(CharasTabContent, {
                charas: get(variables, 'charas', {}),
              }),
          },
          {
            id: 'factions',
            header: () => '势力',
            content: () =>
              h(FactionTabContent, {
                factions: get(variables, 'factions', {}),
              }),
          },
          {
            id: 'jianghu',
            header: () => '江湖',
            content: () =>
              h(JianghuTabContent, {
                jianghu: get(variables, 'jianghu', []),
              }),
          },
          {
            id: 'items',
            header: () => '行囊',
            content: () =>
              h(ItemTabContent, {
                items: get(variables, 'items', {}),
              }),
          },
        ],
      }),
    button: () => '侠',
    className: 'sim-floating',
  });
}

renderComponent(App, 'sim-app');
