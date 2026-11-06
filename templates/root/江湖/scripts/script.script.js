/* 江湖 · 主界面（code: script，覆盖默认交互的渲染器）
   依赖 ui_default 提供 preact importmap 与 window.sUtils / sComponents。 */
import { h, Fragment } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

const utils = window.sUtils || {};
const components = window.sComponents || {};
const { useMessageData, renderComponent } = utils;
const { SExpand, STab, SVariableImage } = components;

const EDGE_COLORS = {
  '义': '#b8892f',
  '情': '#a95563',
  '恩': '#3f6b5a',
  '怨': '#9e2b25',
  '仇': '#6e1f1a',
  '?': '#7b7468'
};

const FACTION_COLORS = {
  qingcheng: '#6f9a83',
  luoshui: '#6b8fae',
  xuebang: '#c05a4a',
  guanfu: '#b09a6a',
  none: '#8a8175'
};

const STAGE_COLORS = {
  '知交': '#b8892f',
  '生死之交': '#b8892f',
  '相识': '#3f6b5a',
  '陌生': '#8a8175',
  '未识': '#8a8175',
  '仇隙': '#9e2b25',
  '血仇': '#6e1f1a'
};

const DIRECTION = { up: '↑', down: '↓', clash: '⚔', still: '→' };

const NODE_POS = {
  player: [450, 320],
  shenyan: [450, 76],
  xuanzang: [704, 146],
  guchangfeng: [796, 326],
  wumian: [686, 512],
  xiewujiu: [450, 574],
  ajiu: [216, 512],
  laozhou: [106, 326],
  suwan: [198, 146]
};

const MAP_POS = {
  luoyang: [292, 300],
  qingcheng: [612, 208],
  jiangnan: [664, 416]
};

function num(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback || 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) || {};
    } catch (err) {
      return {};
    }
  }
  return value || {};
}

function hasInput() {
  return !!(
    (window.__api && window.__api.input && window.__api.input.text) ||
    (window.userInput && window.userInput.text)
  );
}

function fillInput(text) {
  const api = window.__api && window.__api.input && window.__api.input.text;
  if (api && typeof api.set === 'function') {
    let start = 0;
    let end = 0;
    try {
      const element = api.element && api.element();
      if (element) {
        start = element.selectionStart ?? 0;
        end = element.selectionEnd ?? start;
      }
    } catch (err) {
      // ignore
    }
    api.set((value) => {
      const current = String(value || '');
      return current.slice(0, start) + text + current.slice(end);
    });
    return true;
  }
  const legacy = window.userInput && window.userInput.text;
  if (legacy && typeof legacy.set === 'function') {
    legacy.set(text);
    return true;
  }
  return false;
}

function factionColor(id) {
  return FACTION_COLORS[id] || FACTION_COLORS.none;
}

function stageColor(stage) {
  return STAGE_COLORS[stage] || STAGE_COLORS['未识'];
}

function outputHtml(text) {
  if (!text) {
    return '<p class="jh-empty">雨声渐密。供桌上的半枚铜钱，被人翻了个面。</p>';
  }
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text
    .split(/\n{2,}/)
    .map((p) => '<p>' + p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>')
    .join('');
}

function useGame() {
  const [variables] = useMessageData('variables');
  const [content] = useMessageData('content');
  const raw = useMemo(() => normalize(variables), [variables]);
  const world = raw.world || {};
  const now = world.now || {};
  const spaces = content && Array.isArray(content.spaces) ? content.spaces : [];
  let last = spaces.length ? spaces[spaces.length - 1] : null;
  if (Array.isArray(last)) last = last[last.length - 1] || null;
  const output = (last && last.output) || (content && content.output) || '';
  return {
    raw,
    p: raw.p || {},
    world,
    now,
    relations: raw.relations || {},
    edges: raw.edges || [],
    companions: raw.companions || [],
    recent: raw.recent || [],
    arts: raw.arts || [],
    bag: raw.bag || [],
    map: raw.map || { regions: [], routes: [] },
    choices: world.choices || [],
    output
  };
}

function TopBar({ game }) {
  const p = game.p;
  return h(
    'header',
    { class: 'jh-top' },
    h(
      'div',
      { class: 'jh-brand' },
      h('span', { class: 'jh-seal' }, '江湖'),
      h('span', { class: 'jh-brand-sub' }, game.world.date || game.now.date || '')
    ),
    h(
      'div',
      { class: 'jh-top-meta' },
      h('span', {}, game.world.place || ''),
      h('i'),
      h('span', {}, game.world.weather || ''),
      h('i'),
      h('span', {}, game.world.time || '')
    ),
    h(
      'div',
      { class: 'jh-top-res' },
      h('span', {}, '银 ' + num(p.silver) + ' 两'),
      h('i'),
      h('span', {}, p.realm || '未入门')
    )
  );
}

function Portrait({ p }) {
  const fallback = () =>
    h(
      'div',
      { class: 'jh-portrait-ring' },
      h('span', {}, (p.name || '无').slice(0, 1))
    );
  return h(
    'div',
    { class: 'jh-portrait' },
    SVariableImage
      ? h(SVariableImage, {
          name: p.name,
          className: 'jh-portrait-img',
          defaultComponent: fallback
        })
      : fallback(),
    h('em', {}, p.realm || '')
  );
}

function Radar({ attrs }) {
  const entries = Object.keys(attrs || {})
    .slice(0, 5)
    .map((key) => [key, clamp(num(attrs[key]), 0, 100)]);
  if (!entries.length) return null;

  const cx = 92;
  const cy = 92;
  const r = 62;
  const point = (index, factor) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / entries.length;
    return [cx + Math.cos(angle) * r * factor, cy + Math.sin(angle) * r * factor];
  };
  const points = (factor) =>
    entries
      .map((_, index) => {
        const p = point(index, factor);
        return p[0].toFixed(1) + ',' + p[1].toFixed(1);
      })
      .join(' ');

  const rings = [0.25, 0.5, 0.75, 1].map((factor, index) =>
    h('polygon', {
      key: 'ring-' + index,
      points: points(factor),
      fill: 'none',
      stroke: 'rgba(60,50,40,.16)',
      'stroke-width': 1
    })
  );

  const axes = entries.map((_, index) => {
    const p = point(index, 1);
    return h('line', {
      key: 'axis-' + index,
      x1: cx,
      y1: cy,
      x2: p[0].toFixed(1),
      y2: p[1].toFixed(1),
      stroke: 'rgba(60,50,40,.12)'
    });
  });

  const shape = entries
    .map((entry, index) => {
      const p = point(index, entry[1] / 100);
      return p[0].toFixed(1) + ',' + p[1].toFixed(1);
    })
    .join(' ');

  const labels = entries.map((entry, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / entries.length;
    const x = cx + Math.cos(angle) * (r + 18);
    const y = cy + Math.sin(angle) * (r + 18) + 3;
    return h(
      'text',
      {
        key: 'label-' + index,
        x: x.toFixed(1),
        y: y.toFixed(1),
        'text-anchor': 'middle',
        class: 'jh-radar-label'
      },
      entry[0]
    );
  });

  return h(
    'svg',
    { class: 'jh-radar', viewBox: '0 0 184 184', role: 'img', 'aria-label': '属性' },
    rings,
    axes,
    h('polygon', {
      points: shape,
      fill: 'rgba(158,43,37,.16)',
      stroke: '#9e2b25',
      'stroke-width': 1.6
    }),
    labels
  );
}

function Bar({ label, value, max, tone }) {
  const v = num(value);
  const m = num(max, 100) || 100;
  const pct = clamp((v / m) * 100, 0, 100);
  return h(
    'div',
    { class: 'jh-meter' },
    h('span', {}, label),
    h(
      'div',
      { class: 'jh-meter-track' },
      h('i', { class: tone || '', style: { width: pct.toFixed(1) + '%' } })
    ),
    h('b', {}, v)
  );
}

function AttitudeBar({ value }) {
  const v = clamp(num(value), -100, 100);
  const width = Math.abs(v) / 2;
  const left = v >= 0 ? 50 : 50 - width;
  return h(
    'div',
    { class: 'jh-meter' },
    h('span', {}, '好感'),
    h(
      'div',
      { class: 'jh-meter-track jh-center' },
      h('i', {
        class: v >= 0 ? 'pos' : 'neg',
        style: { left: left.toFixed(1) + '%', width: width.toFixed(1) + '%' }
      })
    ),
    h('b', {}, (v > 0 ? '+' : '') + v)
  );
}

function CharacterPanel({ game, onOpen }) {
  const p = game.p;
  const tags = [];
  (p.titles || []).slice(0, 3).forEach((title, index) => {
    tags.push(h('span', { key: 'title-' + index, class: 'jh-tag' }, title));
  });
  if (p.wounds && p.wounds !== '无') {
    tags.push(h('span', { key: 'wound', class: 'jh-tag jh-tag-wound' }, p.wounds));
  }

  return h(
    'section',
    { class: 'jh-panel jh-character' },
    h(Portrait, { p }),
    h('h2', { class: 'jh-name' }, p.name),
    h('p', { class: 'jh-title' }, (p.title || '') + ' · ' + (p.sect || '')),
    h(
      'div',
      { class: 'jh-meters' },
      h(Bar, { label: '气血', value: p.hp, max: p.hpMax, tone: 'hp' }),
      h(Bar, { label: '内力', value: p.inner, max: p.innerMax, tone: 'inner' })
    ),
    h('div', { class: 'jh-radar-wrap' }, h(Radar, { attrs: p.attrs })),
    h('div', { class: 'jh-tags' }, tags),
    h(
      'div',
      { class: 'jh-char-foot' },
      h('span', {}, '侠名 ', h('b', {}, num(p.rep))),
      h('span', {}, '恶名 ', h('b', {}, num(p.notoriety))),
      h('button', { class: 'jh-text-btn', onClick: onOpen }, '人物志 ›')
    )
  );
}

function Stage({ game, mock, setMock, choose, notify }) {
  const choices = (game.choices || []).slice(0, 3);
  const numbers = ['一', '二', '三'];
  const sendMock = () => {
    if (!mock.trim()) {
      notify('先说点什么。');
      return;
    }
    notify('（预览）你：' + mock.trim());
  };
  const mockInput = hasInput()
    ? null
    : h(
        'div',
        { class: 'jh-mock' },
        h('input', {
          id: 'jh-mock',
          placeholder: '说点什么…（预览输入框）',
          value: mock,
          onInput: (event) => setMock(event.target.value),
          onKeyDown: (event) => {
            if (event.key === 'Enter') sendMock();
          }
        }),
        h('button', { onClick: sendMock }, '送入')
      );

  return h(
    'section',
    { class: 'jh-panel jh-stage' },
    h(
      'div',
      { class: 'jh-scene-head' },
      h(
        'div',
        {},
        h('span', { class: 'jh-scene-kicker' }, game.now.place || game.world.place || ''),
        h('h1', {}, game.now.sceneTitle || game.world.sceneTitle || '破庙夜雨')
      ),
      h('span', { class: 'jh-scene-time' }, game.world.time || '')
    ),
    h('div', {
      class: 'jh-prose',
      dangerouslySetInnerHTML: { __html: outputHtml(game.output) }
    }),
    h(
      'div',
      { class: 'jh-choices' },
      choices.map((choice, index) =>
        h(
          'button',
          {
            key: 'choice-' + index,
            class: 'jh-choice',
            onClick: () => choose(choice.text)
          },
          h('span', { class: 'jh-choice-num' }, numbers[index]),
          h(
            'span',
            { class: 'jh-choice-main' },
            h('b', {}, choice.text),
            h('em', {}, choice.hint || '')
          )
        )
      )
    ),
    h(
      'div',
      { class: 'jh-stage-foot' },
      '选择会填入输入框；也可以自由输入。',
      hasInput() ? null : h('em', {}, '（预览输入框）')
    ),
    mockInput
  );
}

function NowBoard({ game, onOpen, onFaction }) {
  const now = game.now;
  const factions = (now.factions || []).map((faction, index) =>
    h(
      Fragment,
      { key: 'faction-' + index },
      h(
        'button',
        { class: 'jh-faction', onClick: () => onFaction(faction.id) },
        h('span', {
          class: 'jh-faction-dot',
          style: {
            background: factionColor(faction.id),
            boxShadow: '0 0 8px ' + factionColor(faction.id)
          }
        }),
        h(
          'span',
          { class: 'jh-faction-main' },
          h('b', {}, faction.name),
          h('em', {}, faction.action)
        ),
        h(
          'span',
          { class: 'jh-dir ' + (DIRECTION[faction.direction] ? faction.direction : 'still') },
          DIRECTION[faction.direction] || '→'
        )
      ),
      faction.note ? h('p', { class: 'jh-faction-note' }, faction.note) : null
    )
  );

  const quests = (now.quests || []).map((quest, index) =>
    h(
      'button',
      { key: 'quest-' + index, class: 'jh-quest', onClick: () => onOpen('now') },
      h(
        'span',
        { class: 'jh-quest-main' },
        h('b', {}, quest.name),
        h('em', {}, quest.action + ' · ' + quest.step)
      ),
      quest.countdown != null ? h('span', { class: 'jh-count' }, num(quest.countdown)) : null
    )
  );

  const rumors = (now.rumors || []).map((rumor, index) =>
    h(
      'div',
      { key: 'rumor-' + index, class: 'jh-rumor' },
      h('span', { class: 'jh-rumor-mark' }, '闻'),
      h('p', {}, rumor.text),
      h(
        'em',
        { class: rumor.credibility === 'confirmed' ? 'ok' : '' },
        rumor.credibility === 'confirmed' ? '确讯' : '传闻'
      )
    )
  );

  return h(
    'aside',
    { class: 'jh-now' },
    h(
      'div',
      { class: 'jh-now-head' },
      h(
        'div',
        {},
        h('span', { class: 'jh-now-title' }, '江湖动向'),
        h('span', { class: 'jh-round' }, '本轮')
      ),
      h('button', { class: 'jh-text-btn', onClick: () => onOpen('now') }, '展开')
    ),
    now.last ? h('p', { class: 'jh-last' }, '上回：' + now.last) : null,
    h(
      'section',
      { class: 'jh-now-sec' },
      h('h3', {}, '势力'),
      factions.length ? factions : h('p', { class: 'jh-none' }, '风平浪静。')
    ),
    h(
      'section',
      { class: 'jh-now-sec' },
      h('h3', {}, '任务'),
      quests.length ? quests : h('p', { class: 'jh-none' }, '暂无在办。')
    ),
    h(
      'section',
      { class: 'jh-now-sec' },
      h('h3', {}, '风声'),
      rumors.length ? rumors : h('p', { class: 'jh-none' }, '没有新消息。')
    ),
    h('p', { class: 'jh-now-foot' }, '只看本轮 · 历史见对话记录')
  );
}

function BottomBar({ game, onOpen, onNpc }) {
  const companions = (game.companions || []).map((companion, index) =>
    h(
      'span',
      { key: 'companion-' + index, class: 'jh-chip jh-chip-walk' },
      h('b', {}, companion.name),
      h('em', {}, companion.reason || '')
    )
  );
  const recent = (game.recent || [])
    .map((id) => {
      const npc = game.relations[id];
      if (!npc) return null;
      return h(
        'button',
        { key: 'recent-' + id, class: 'jh-recent-name', onClick: () => onNpc(id) },
        npc.name,
        h('i', {}, npc.stage || '')
      );
    })
    .filter(Boolean);
  const grudges = Object.keys(game.relations || {}).filter(
    (key) => num(game.relations[key].debt) < 0
  ).length;

  return h(
    'footer',
    { class: 'jh-bottom' },
    h(
      'div',
      { class: 'jh-bottom-left' },
      h('span', { class: 'jh-bottom-label' }, '同行'),
      companions.length ? companions : h('span', { class: 'jh-chip jh-chip-empty' }, '独行')
    ),
    h(
      'div',
      { class: 'jh-bottom-mid' },
      h('span', { class: 'jh-bottom-label' }, '最近遇见'),
      recent.length ? recent : h('span', { class: 'jh-chip jh-chip-empty' }, '还没有'),
      h('span', { class: 'jh-grudge' }, '恩怨 ', h('b', {}, grudges))
    ),
    h(
      'nav',
      { class: 'jh-nav' },
      h('button', { onClick: () => onOpen('relations') }, h('i', {}, '缘'), h('span', {}, '关系')),
      h('button', { onClick: () => onOpen('arts') }, h('i', {}, '武'), h('span', {}, '武学')),
      h('button', { onClick: () => onOpen('bag') }, h('i', {}, '囊'), h('span', {}, '行囊')),
      h('button', { onClick: () => onOpen('map') }, h('i', {}, '图'), h('span', {}, '地图'))
    )
  );
}

function Overlay({ title, wide, close, children }) {
  return h(
    'div',
    { class: 'jh-scrim', onClick: close },
    h(
      'section',
      {
        class: 'jh-overlay' + (wide ? ' jh-overlay-wide' : ''),
        onClick: (event) => event.stopPropagation()
      },
      h(
        'header',
        { class: 'jh-overlay-head' },
        h(
          'div',
          {},
          h('span', { class: 'jh-overlay-kicker' }, '江湖'),
          h('h2', {}, title)
        ),
        h('button', { class: 'jh-close', onClick: close, 'aria-label': '关闭' }, '×')
      ),
      h('div', { class: 'jh-overlay-body' }, children)
    )
  );
}

function Network({ game, selected, onSelect }) {
  const lines = (game.edges || []).map((edge, index) => {
    const a = NODE_POS[edge.from];
    const b = NODE_POS[edge.to];
    if (!a || !b) return null;
    return h('line', {
      key: 'edge-' + index,
      x1: a[0],
      y1: a[1],
      x2: b[0],
      y2: b[1],
      stroke: EDGE_COLORS[edge.type] || EDGE_COLORS['?'],
      'stroke-width': edge.from === 'player' ? 2.4 : 1.2,
      'stroke-opacity': edge.from === 'player' ? 0.72 : 0.42,
      'stroke-linecap': 'round'
    });
  });

  const nodes = Object.keys(game.relations || {})
    .map((id) => {
      const npc = game.relations[id];
      const pos = NODE_POS[id];
      if (!pos || !npc) return null;
      const known = num(npc.met) > 0;
      const active = id === selected;
      const radius = num(npc.importance, 2) >= 3 ? 34 : 28;
      return h(
        'g',
        {
          key: 'node-' + id,
          class: 'jh-node',
          onClick: () => onSelect(id)
        },
        h('circle', {
          cx: pos[0],
          cy: pos[1],
          r: active ? radius + 6 : radius,
          fill: known ? 'rgba(245,237,222,.96)' : 'rgba(220,205,178,.7)',
          stroke: active ? '#9e2b25' : stageColor(npc.stage),
          'stroke-width': active ? 2.4 : 1.3
        }),
        h(
          'text',
          {
            x: pos[0],
            y: pos[1],
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            class: 'jh-node-name'
          },
          npc.name
        ),
        h(
          'text',
          {
            x: pos[0],
            y: pos[1] + radius + 15,
            class: 'jh-node-stage'
          },
          npc.stage || (known ? '相识' : '未识')
        )
      );
    })
    .filter(Boolean);

  return h(
    'svg',
    { class: 'jh-net', viewBox: '0 0 900 640', role: 'img', 'aria-label': '关系网' },
    lines,
    nodes,
    h(
      'g',
      { class: 'jh-node jh-node-player' },
      h('circle', {
        cx: 450,
        cy: 320,
        r: 40,
        fill: '#9e2b25',
        stroke: 'rgba(242,232,213,.35)',
        'stroke-width': 2
      }),
      h(
        'text',
        {
          x: 450,
          y: 320,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          class: 'jh-node-name'
        },
        '你'
      )
    )
  );
}

function NpcCard({ game, id, notify }) {
  const npc = game.relations[id];
  if (!npc) return h('p', { class: 'jh-none' }, '尚未识得一人。');
  const unknown = num(npc.met) === 0;
  const debt = num(npc.debt);
  const debtText = debt > 0 ? '恩 +' + debt : debt < 0 ? '怨 ' + debt : '无';
  const debtClass = debt > 0 ? 'pos' : debt < 0 ? 'neg' : '';
  const act = (message) => () => notify(message);

  return h(
    Fragment,
    null,
    h(
      'div',
      { class: 'jh-npc-head' },
      h('div', { class: 'jh-npc-seal' }, npc.name.slice(0, 1)),
      h(
        'div',
        {},
        h('h3', {}, npc.name),
        h('p', {}, (npc.role || '') + ' · ' + (npc.stage || ''))
      )
    ),
    h('p', { class: 'jh-npc-line' }, unknown ? '“……”' : '“' + (npc.line || '……') + '”'),
    h(AttitudeBar, { value: npc.attitude }),
    h(Bar, { label: '信任', value: npc.trust, max: 100, tone: 'trust' }),
    h(
      'div',
      { class: 'jh-debt-row' },
      h('span', {}, '恩怨'),
      h('b', { class: debtClass }, debtText)
    ),
    h(
      'dl',
      { class: 'jh-npc-meta' },
      h('div', {}, h('dt', {}, '立场'), h('dd', {}, npc.stance || '—')),
      h(
        'div',
        {},
        h('dt', {}, '现状'),
        h('dd', {}, unknown ? '未曾谋面' : (npc.location || '—') + ' · ' + (npc.agenda || '—'))
      ),
      h('div', {}, h('dt', {}, '上次见面'), h('dd', {}, npc.lastSeen || '—')),
      h('div', {}, h('dt', {}, '相遇'), h('dd', {}, num(npc.met) + ' 次'))
    ),
    h(
      'div',
      { class: 'jh-actions' },
      h('button', { onClick: act('你托人给' + npc.name + '捎了口信。') }, '传信'),
      h('button', { onClick: act('你向' + npc.name + '开了口。这份人情，记在账上。') }, '求助'),
      h('button', { onClick: act('你把一件小物推到' + npc.name + '面前。') }, '赠礼'),
      h('button', { onClick: act('你打听起' + npc.name + '的近况。') }, '打听')
    )
  );
}

function Relations({ game, npcId, setNpcId, notify }) {
  const ids = Object.keys(game.relations || {});
  const selected = game.relations[npcId] ? npcId : ids[0] || '';
  return h(
    'div',
    { class: 'jh-rel-wrap' },
    h(
      'div',
      { class: 'jh-rel-graph' },
      h(Network, { game, selected, onSelect: setNpcId }),
      h(
        'div',
        { class: 'jh-legend' },
        h('span', {}, h('i', { style: { background: '#b8892f' } }), '义'),
        h('span', {}, h('i', { style: { background: '#a95563' } }), '情'),
        h('span', {}, h('i', { style: { background: '#3f6b5a' } }), '恩'),
        h('span', {}, h('i', { style: { background: '#9e2b25' } }), '怨'),
        h('span', {}, h('i', { style: { background: '#6e1f1a' } }), '仇')
      )
    ),
    h('aside', { class: 'jh-npc-card' }, h(NpcCard, { game, id: selected, notify }))
  );
}

function ArtCard({ art, notify }) {
  const mastery = num(art.mastery);
  const max = num(art.max, 6) || 6;
  const pips = [];
  for (let i = 0; i < max; i += 1) {
    pips.push(h('i', { key: 'pip-' + i, class: i < mastery ? 'on' : '' }));
  }
  return h(SExpand, {
    className: 'jh-art-card' + (mastery === 0 ? ' locked' : ''),
    header: () =>
      h(
        'div',
        { class: 'jh-art-top' },
        h('span', { class: 'jh-tier', 'data-tier': art.tier }, art.tier),
        h('div', {}, h('h3', {}, art.name), h('p', {}, art.type)),
        art.equipped ? h('span', { class: 'jh-eq' }, '已装备') : null
      ),
    children: () =>
      h(
        'div',
        { class: 'jh-art-body' },
        h('div', { class: 'jh-pips' }, pips, h('em', {}, mastery + ' / ' + max)),
        h('p', { class: 'jh-art-desc' }, art.desc),
        h(
          'div',
          { class: 'jh-art-foot' },
          h(
            'button',
            {
              onClick: () =>
                notify(art.equipped ? '你已将此式带在身上。' : '你将「' + art.name + '」列入随身武学。')
            },
            art.equipped ? '换下' : '装备'
          ),
          h('button', { onClick: () => notify('你闭目参悟「' + art.name + '」。') }, '参悟')
        )
      )
  });
}

function Arts({ game, filter, setFilter, notify }) {
  const types = ['全部'];
  (game.arts || []).forEach((art) => {
    if (art.type && types.indexOf(art.type) < 0) types.push(art.type);
  });
  const active = types.indexOf(filter) >= 0 ? filter : '全部';
  const list = (game.arts || []).filter((art) => active === '全部' || art.type === active);
  return h(
    Fragment,
    null,
    h(
      'div',
      { class: 'jh-filters' },
      types.map((type) =>
        h(
          'button',
          {
            key: 'type-' + type,
            class: 'jh-filter' + (type === active ? ' on' : ''),
            onClick: () => setFilter(type)
          },
          type
        )
      )
    ),
    h(
      'div',
      { class: 'jh-arts-grid' },
      list.length
        ? list.map((art) => h(ArtCard, { key: art.name, art, notify }))
        : h('p', { class: 'jh-none' }, '还没有学到武学。')
    )
  );
}

function BagCard({ item, notify }) {
  return h(SExpand, {
    className: 'jh-item-card',
    header: () =>
      h(
        'div',
        { class: 'jh-item-head' },
        h('div', { class: 'jh-item-glyph' }, (item.type || '物').slice(0, 1)),
        h(
          'div',
          { class: 'jh-item-main' },
          h(
            'div',
            { class: 'jh-item-top' },
            h('h3', {}, item.name),
            h('span', { class: 'jh-qty' }, '×' + num(item.qty, 1))
          ),
          h('p', { class: 'jh-item-meta' }, (item.type || '') + ' · ' + (item.quality || ''))
        )
      ),
    children: () =>
      h(
        'div',
        { class: 'jh-item-body' },
        h('p', { class: 'jh-item-desc' }, item.desc),
        h(
          'div',
          { class: 'jh-item-actions' },
          h('button', { onClick: () => notify('你取出了「' + item.name + '」。') }, '使用'),
          h('button', { onClick: () => notify('你掂了掂「' + item.name + '」，想着该送给谁。') }, '赠予')
        )
      )
  });
}

function Bag({ game, filter, setFilter, notify }) {
  const types = ['全部'];
  (game.bag || []).forEach((item) => {
    if (item.type && types.indexOf(item.type) < 0) types.push(item.type);
  });
  const active = types.indexOf(filter) >= 0 ? filter : '全部';
  const list = (game.bag || []).filter((item) => active === '全部' || item.type === active);
  return h(
    Fragment,
    null,
    h(
      'div',
      { class: 'jh-filters' },
      types.map((type) =>
        h(
          'button',
          {
            key: 'bag-' + type,
            class: 'jh-filter' + (type === active ? ' on' : ''),
            onClick: () => setFilter(type)
          },
          type
        )
      )
    ),
    h(
      'div',
      { class: 'jh-bag-grid' },
      list.length
        ? list.map((item) => h(BagCard, { key: item.name, item, notify }))
        : h('p', { class: 'jh-none' }, '行囊空空。')
    )
  );
}

function MapSvg({ game, selectedId, onSelect }) {
  const regions = game.map.regions || [];
  const routes = (game.map.routes || []).map((pair, index) => {
    const a = MAP_POS[pair[0]];
    const b = MAP_POS[pair[1]];
    if (!a || !b) return null;
    return h('path', {
      key: 'route-' + index,
      d:
        'M' +
        a[0] +
        ' ' +
        a[1] +
        ' Q' +
        (a[0] + b[0]) / 2 +
        ' ' +
        ((a[1] + b[1]) / 2 - 36) +
        ' ' +
        b[0] +
        ' ' +
        b[1],
      fill: 'none',
      stroke: 'rgba(70,58,42,.22)',
      'stroke-width': 1.2,
      'stroke-dasharray': '4 5'
    });
  });

  const nodes = regions.map((region) => {
    const pos = MAP_POS[region.id];
    if (!pos) return null;
    const active = region.id === selectedId;
    const current = region.id === game.map.current;
    return h(
      'g',
      { key: 'region-' + region.id, class: 'jh-region', onClick: () => onSelect(region.id) },
      h('circle', {
        cx: pos[0],
        cy: pos[1],
        r: active ? 46 : 42,
        fill: 'rgba(245,237,222,.86)',
        stroke: active ? '#9e2b25' : 'rgba(70,58,42,.35)',
        'stroke-width': active ? 2.4 : 1.2
      }),
      h(
        'text',
        { x: pos[0], y: pos[1] - 4, class: 'jh-region-name' },
        region.name
      ),
      h(
        'text',
        { x: pos[0], y: pos[1] + 14, class: 'jh-region-sub' },
        region.sub || ''
      ),
      current
        ? h('circle', {
            cx: pos[0] + 30,
            cy: pos[1] - 30,
            r: 4,
            fill: '#9e2b25'
          })
        : null
    );
  });

  return h(
    'svg',
    { class: 'jh-map-svg', viewBox: '0 0 900 520', role: 'img', 'aria-label': '地图' },
    h(
      'text',
      {
        x: 846,
        y: 44,
        'text-anchor': 'middle',
        fill: 'rgba(70,58,42,.4)',
        'font-size': 12
      },
      '北'
    ),
    h('line', { x1: 846, y1: 56, x2: 846, y2: 86, stroke: 'rgba(70,58,42,.25)' }),
    h('path', { d: 'M846 56 L840 68 L852 68 Z', fill: 'rgba(70,58,42,.25)' }),
    routes,
    nodes,
    h(
      'text',
      {
        x: 70,
        y: 486,
        fill: 'rgba(70,58,42,.35)',
        'font-size': 10,
        'letter-spacing': 3
      },
      '江湖路远'
    )
  );
}

function MapView({ game, regionId, setRegionId, notify }) {
  const regions = game.map.regions || [];
  let selected = regions.filter((region) => region.id === regionId)[0];
  if (!selected) selected = regions.filter((region) => region.id === game.map.current)[0] || regions[0];
  const selectedId = selected ? selected.id : '';

  return h(
    'div',
    { class: 'jh-map-wrap' },
    h(MapSvg, { game, selectedId, onSelect: setRegionId }),
    h(
      'aside',
      { class: 'jh-map-card' },
      selected
        ? h(
            Fragment,
            null,
            h('h3', {}, selected.name),
            h('p', { class: 'jh-map-sub' }, selected.sub || ''),
            h(
              'div',
              { class: 'jh-map-row' },
              h('span', {}, '控制'),
              h('b', {}, selected.control || '—')
            ),
            h(
              'div',
              { class: 'jh-map-row' },
              h('span', {}, '凶险'),
              h(
                'span',
                { class: 'jh-danger' },
                [0, 1, 2].map((index) =>
                  h('i', {
                    key: 'danger-' + index,
                    class: index < num(selected.danger) ? 'on' : ''
                  })
                )
              )
            ),
            h('p', { class: 'jh-map-note' }, selected.note || ''),
            h(
              'div',
              { class: 'jh-actions' },
              h(
                'button',
                { onClick: () => notify('你收拾行装，准备前往' + selected.name + '。') },
                '前往' + selected.name
              ),
              h(
                'button',
                { onClick: () => notify('你向人打听' + selected.name + '的近况。') },
                '打听'
              )
            )
          )
        : h('p', { class: 'jh-none' }, '地图尚未展开。')
    )
  );
}

function CharacterSheet({ game }) {
  const p = game.p;
  const attrs = p.attrs || {};
  const attrRows = Object.keys(attrs).map((key) => {
    const value = clamp(num(attrs[key]), 0, 100);
    return h(
      'div',
      { key: 'attr-' + key, class: 'jh-attr' },
      h('span', {}, key),
      h('div', { class: 'jh-meter-track' }, h('i', { style: { width: value + '%' } })),
      h('b', {}, value)
    );
  });
  const titles = (p.titles || []).map((title, index) =>
    h('span', { key: 'sheet-title-' + index, class: 'jh-tag' }, title)
  );
  const equipRows = Object.keys(p.equip || {}).map((key) =>
    h('li', { key: 'equip-' + key }, h('span', {}, key), h('b', {}, p.equip[key]))
  );

  return h(
    'div',
    { class: 'jh-sheet' },
    h(
      'div',
      { class: 'jh-sheet-head' },
      h(Portrait, { p }),
      h('h3', {}, p.name || '无名'),
      h('p', {}, (p.title || '') + ' · ' + (p.sect || '')),
      h('div', { class: 'jh-sheet-tags' }, titles)
    ),
    h(
      'div',
      { class: 'jh-sheet-body' },
      h(
        'div',
        { class: 'jh-sheet-block' },
        h('h4', {}, '属性'),
        h('div', { class: 'jh-attrs' }, attrRows)
      ),
      h(
        'div',
        { class: 'jh-sheet-block' },
        h('h4', {}, '江湖'),
        h(
          'ul',
          { class: 'jh-sheet-list' },
          h('li', {}, h('span', {}, '侠名'), h('b', {}, num(p.rep))),
          h('li', {}, h('span', {}, '恶名'), h('b', {}, num(p.notoriety))),
          h('li', {}, h('span', {}, '银两'), h('b', {}, num(p.silver) + ' 两')),
          h('li', {}, h('span', {}, '伤势'), h('b', {}, p.wounds || '无')),
          h('li', {}, h('span', {}, '年岁'), h('b', {}, num(p.age)))
        )
      ),
      h(
        'div',
        { class: 'jh-sheet-block' },
        h('h4', {}, '随身'),
        h('ul', { class: 'jh-sheet-list' }, equipRows)
      )
    )
  );
}

function NowFull({ game }) {
  const now = game.now;
  const factions = (now.factions || []).map((faction, index) =>
    h(
      'div',
      { key: 'full-faction-' + index, class: 'jh-now-card' },
      h(
        'div',
        { class: 'jh-now-card-head' },
        h('span', {
          class: 'jh-faction-dot',
          style: {
            background: factionColor(faction.id),
            boxShadow: '0 0 8px ' + factionColor(faction.id)
          }
        }),
        h('b', {}, faction.name),
        h(
          'span',
          { class: 'jh-dir ' + (DIRECTION[faction.direction] ? faction.direction : 'still') },
          DIRECTION[faction.direction] || '→'
        )
      ),
      h('p', {}, h('b', {}, faction.action), faction.note ? ' · ' + faction.note : '')
    )
  );
  const quests = (now.quests || []).map((quest, index) =>
    h(
      'div',
      { key: 'full-quest-' + index, class: 'jh-now-card' },
      h(
        'div',
        { class: 'jh-now-card-head' },
        h('b', {}, quest.name),
        quest.countdown != null ? h('span', { class: 'jh-count' }, num(quest.countdown)) : null
      ),
      h('p', {}, quest.action + ' · ' + quest.step)
    )
  );
  const rumors = (now.rumors || []).map((rumor, index) =>
    h(
      'div',
      { key: 'full-rumor-' + index, class: 'jh-now-card' },
      h(
        'div',
        { class: 'jh-now-card-head' },
        h('b', {}, rumor.credibility === 'confirmed' ? '确讯' : '传闻')
      ),
      h('p', {}, rumor.text)
    )
  );

  return h(STab, {
    className: 'jh-now-tabs',
    layout: (header, content) => h('div', { class: 'jh-now-panel' }, header, content),
    tabs: [
      {
        id: 'factions',
        header: () => '势力',
        content: () =>
          h('div', { class: 'jh-now-tab' }, factions.length ? factions : h('p', { class: 'jh-none' }, '风平浪静。'))
      },
      {
        id: 'quests',
        header: () => '任务',
        content: () =>
          h('div', { class: 'jh-now-tab' }, quests.length ? quests : h('p', { class: 'jh-none' }, '暂无在办。'))
      },
      {
        id: 'rumors',
        header: () => '风声',
        content: () =>
          h('div', { class: 'jh-now-tab' }, rumors.length ? rumors : h('p', { class: 'jh-none' }, '没有新消息。'))
      }
    ]
  });
}

function App() {
  const game = useGame();
  const [view, setView] = useState(null);
  const [npcId, setNpcId] = useState('shenyan');
  const [artFilter, setArtFilter] = useState('全部');
  const [bagFilter, setBagFilter] = useState('全部');
  const [regionId, setRegionId] = useState('');
  const [mock, setMock] = useState('');
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
    },
    []
  );

  const notify = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  };

  if (!game.p.name) {
    return h(
      'div',
      { class: 'jh-boot' },
      h('span', { class: 'jh-seal' }, '江湖'),
      h('p', {}, '正在铺开江湖……')
    );
  }

  const close = () => setView(null);
  const choose = (text) => {
    if (fillInput(text)) {
      notify('已填入输入框');
      return;
    }
    setMock(text);
    notify('已填入预览输入框');
  };
  const openNpc = (id) => {
    setNpcId(id);
    setView('relations');
  };
  const openFaction = (id) => {
    const map = { qingcheng: 'xuanzang', luoshui: 'suwan', xuebang: 'wumian' };
    if (map[id] && game.relations[map[id]]) {
      openNpc(map[id]);
    } else {
      notify('这条线还没牵到你身上。');
    }
  };

  return h(
    Fragment,
    null,
    h(
      'div',
      { class: 'jh-app' },
      h(TopBar, { game }),
      h(
        'main',
        { class: 'jh-main' },
        h(CharacterPanel, { game, onOpen: () => setView('character') }),
        h(Stage, { game, mock, setMock, choose, notify }),
        h(NowBoard, { game, onOpen: setView, onFaction: openFaction })
      ),
      h(BottomBar, { game, onOpen: setView, onNpc: openNpc }),
      view === 'relations'
        ? h(
            Overlay,
            { title: '关系', wide: true, close },
            h(Relations, { game, npcId, setNpcId, notify })
          )
        : null,
      view === 'arts'
        ? h(Overlay, { title: '武学', wide: true, close }, h(Arts, { game, filter: artFilter, setFilter: setArtFilter, notify }))
        : null,
      view === 'bag'
        ? h(Overlay, { title: '行囊', wide: true, close }, h(Bag, { game, filter: bagFilter, setFilter: setBagFilter, notify }))
        : null,
      view === 'map'
        ? h(Overlay, { title: '地图', wide: true, close }, h(MapView, { game, regionId, setRegionId, notify }))
        : null,
      view === 'character'
        ? h(Overlay, { title: '人物志', close }, h(CharacterSheet, { game }))
        : null,
      view === 'now'
        ? h(Overlay, { title: '江湖动向 · 本轮', wide: true, close }, h(NowFull, { game }))
        : null
    ),
    h('div', { class: 'jh-toast' + (toast ? ' show' : ''), id: 'jh-toast' }, toast)
  );
}

if (
  typeof useMessageData !== 'function' ||
  typeof renderComponent !== 'function' ||
  typeof SExpand !== 'function' ||
  typeof STab !== 'function'
) {
  document.body.innerHTML =
    '<div class="jh-boot"><span class="jh-seal">江湖</span><p>缺少默认交互组件，请先导入「默认交互」预设。</p></div>';
} else if (!window.__jianghu_mounted) {
  window.__jianghu_mounted = true;
  // 如果默认渲染器仍然先挂载了 #app，移除它，避免两套界面叠在一起。
  const legacyApp = document.getElementById('app');
  if (legacyApp) legacyApp.remove();
  renderComponent(App, 'jianghu-root');
}
