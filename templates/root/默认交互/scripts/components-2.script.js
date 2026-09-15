import { h, render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

// 辅助函数：渲染带换行的文本
function SText({ text }) {
  return text ? text.split('\n').map((line) => h('div', {}, line)) : null;
}

/**
 *
 * @param obj {object}
 * @param path {string}
 * @param defaultValue {*}
 * @returns {*}
 */
function get(obj, path, defaultValue = '') {
  const keys = path.split('.');
  let cur = obj;
  for (const k of keys) {
    if (!cur || typeof cur !== 'object') return defaultValue;
    cur = cur[k];
  }
  return cur ? cur : defaultValue;
}

function useMessageData(type = 'content') {
  const [message, setMessage] = useState(window.__messageData?.[type] ?? {});
  useEffect(() => {
    function handleMessage(e) {
      if (e.data?.type === type) {
        setMessage({ ...(window.__messageData?.[type] ?? {}) });
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [type]);

  return [message, setMessage];
}

function appendItemInput(item) {
  const input = window.userInput.text;
  if (input) {
    const element = input.element();
    const pos = element.selectionStart;
    input.set((u) => `${u.substring(0, pos)}[${item.name}]${u.substring(pos)}`);
  }
}

const DEFAULT_POSITION = { x: 12, y: 12 };

/**
 * children: () => VNode
 * button: () => VNode
 */
function SFloating({ children, button, className }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const dragRef = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);

  const onDragMove = (e) => {
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragging.current = true;
    setPosition({ x: dx, y: dy });
  };

  const onDragEnd = () => {
    setTimeout(() => (dragging.current = false), 100);
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
  };

  const dragProperty = {
    onMouseDown(e) {
      dragRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('mouseup', onDragEnd);
    },
  };
  const visibleProperty = {
    onClick: () => {
      if (!dragging.current) {
        setVisible((u) => !u);
      }
    },
  };

  return visible
    ? h(
        'div',
        {
          className: `s-floating-pnl ${className ?? ''}`,
          style: {
            left: `${position.x}px`,
            top: `${position.y}px`,
          },
        },
        [
          h('div', {
            className: 's-floating-drg',
            ...dragProperty,
          }),
          h(
            'div',
            {
              className: 's-floating-cls',
              ...visibleProperty,
            },
            h(
              'svg',
              {
                viewBox: '0 0 16 16',
                width: '14',
                height: '14',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': '1.5',
                'stroke-linecap': 'round',
              },
              [
                h('line', { x1: '3', y1: '3', x2: '13', y2: '13' }),
                h('line', { x1: '13', y1: '3', x2: '3', y2: '13' }),
              ],
            ),
          ),
          children(),
        ],
      )
    : h(
        'div',
        {
          className: `s-floating-btn ${className ?? ''}`,
          ...dragProperty,
          ...visibleProperty,
          style: {
            left: `${position.x}px`,
            top: `${position.y}px`,
          },
        },
        button(),
      );
}

/**
 * tab: {id: string, header: () => VNode, content: () => VNode}
 * layout: (header, content) => VNode
 */
function STab({ tabs, layout, className }) {
  const [tabId, setTabId] = useState(tabs[0]?.id ?? null);
  return layout(
    h(
      'div',
      { className: 's-tab-headers-wrap' },
      h(
        'ul',
        {
          className: `s-tab-headers ${className ?? ''}`,
        },
        tabs.map((tab) =>
          h(
            'li',
            {
              key: tab.id,
              className: `s-tab-header${tabId === tab.id ? ' active' : ''}`,
              onClick: () => setTabId(tab.id),
            },
            tab.header(),
          ),
        ),
      ),
    ),
    h(
      'div',
      {
        className: `s-tab-contents ${className ?? ''}`,
      },
      tabs.map((tab) =>
        h(
          'section',
          {
            key: tab.id,
            className: `s-tab-content${tabId === tab.id ? ' active' : ''}`,
          },
          tab.content(),
        ),
      ),
    ),
  );
}

function SRadarChart({ items, max, min, themeH = 270 }) {
  const uid = (SRadarChart._uid = (SRadarChart._uid || 0) + 1);
  const angles = [-90, -30, 30, 90, 150, 210];
  const polar = (angle, radius) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: (radius * Math.cos(rad)).toFixed(1),
      y: (radius * Math.sin(rad)).toFixed(1),
    };
  };
  // const a = `hsl(262 100% 93% / 0.41)`;
  const theme = (l = 70, a = 1) => `hsl(${themeH} 100% ${l}% / ${a})`;
  const color = (v, l = 70) =>
    v >= 0 ? `hsl(200 100% ${l}%)` : `hsl(0 100% ${l}%)`;

  const offset = 10;
  const maxR = 80;
  const maxP = 60;
  const size = 100;

  const pos = (p) => ((Math.abs(p.value) - min) / (max - min)) * maxP;
  // 只有数据点需要复用
  const points = items.map((p, i) => polar(angles[i], pos(p)));

  return h(
    'svg',
    {
      viewBox: `-${size} -${size} ${size * 2} ${size * 2}`,
      xmlns: 'http://www.w3.org/2000/svg',
      style: { width: '100%', height: '100%' },
    },
    [
      h(
        'defs',
        {},
        items.map((p, i) => {
          const j = (i + 1) % items.length;
          const p1 = points[i];
          const p2 = points[j];
          const v1 = items[i].value;
          const v2 = items[j].value;
          return h(
            'linearGradient',
            {
              id: `grad-${uid}-${i}`,
              gradientUnits: 'userSpaceOnUse',
              x1: p1.x,
              x2: p2.x,
              y1: p1.y,
              y2: p2.y,
            },
            [
              h('stop', { offset: '0%', 'stop-color': color(v1) }),
              h('stop', { offset: '100%', 'stop-color': color(v2) }),
            ],
          );
        }),
      ),

      // 1. 背景多边形
      h('polygon', {
        points: angles
          .map((a) => {
            const { x, y } = polar(a, maxR);
            return `${x},${y}`;
          })
          .join(' '),
        fill: theme(97),
      }),

      // 2. 绘制网格
      Array.from({ length: 4 }, (_, i) => {
        const r = (maxR / 4) * (i + 1);
        return h('polygon', {
          key: `grid-${i}`,
          points: angles
            .map((a) => {
              const { x, y } = polar(a, r);
              return `${x},${y}`;
            })
            .join(' '),
          fill: 'none',
          stroke: theme(80),
          'stroke-width': 1,
        });
      }),

      // 3. 绘制数据区域
      h('polygon', {
        points: points.map((p) => `${p.x},${p.y}`).join(' '),
        fill: 'rgb(249 221 255 / 0.5)',
      }),

      // 4. 绘制边框（带渐变）
      points.map((p, i) => {
        const j = (i + 1) % items.length;
        const p1 = points[i];
        const p2 = points[j];

        return h('line', {
          key: `edge-${i}`,
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          stroke: `url(#grad-${uid}-${i})`,
          'stroke-width': 2,
        });
      }),

      // 5. 绘制数据点
      items.map((p, i) =>
        h('circle', {
          key: `point-${i}`,
          cx: points[i].x,
          cy: points[i].y,
          r: 1.5,
          fill: color(p.value, 20),
        }),
      ),

      // 6. 绘制标签
      items.map((p, i) => {
        const { x, y } = polar(angles[i], maxR + offset);
        return h(
          'text',
          {
            key: `label-${i}`,
            x,
            y,
            fill: theme(50),
            'font-size': 10,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
          },
          p.name,
        );
      }),

      // 7. 绘制数值
      items.map((p, i) => {
        const { x, y } = polar(angles[i], pos(p) + offset);
        return h(
          'text',
          {
            key: `value-${i}`,
            x,
            y,
            fill: color(p.value, 50),
            'font-size': 10,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
          },
          Math.round(p.value),
        );
      }),
    ],
  );
}

/**
 * 可展开卡片
 * header: () => VNode | VNode[] — 头部内容（不含箭头）
 * children: () => VNode | VNode[] — 展开后内容
 */
function SExpand({ header, children, className }) {
  const [expanded, setExpanded] = useState(false);

  return h(
    'div',
    {
      className: `s-card${expanded ? ' expanded' : ''}${className ? ' ' + className : ''}`,
    },
    h(
      'div',
      { className: 's-card-header', onClick: () => setExpanded((u) => !u) },
      header(),
      h('span', { className: 's-card-arrow' }, expanded ? '▲' : '▼'),
    ),
    expanded ? h('div', { className: 's-card-body' }, children()) : null,
  );
}

function SVariableImage({ name, defaultComponent, className }) {
  const [variables] = useMessageData('variables');
  const images = variables?.images ?? {};
  const image = images[name];
  return image
    ? h('img', {
        className,
        src: image,
      })
    : defaultComponent && h(defaultComponent);
}

function renderComponent(component, id) {
  const app = document.createElement('div');
  app.id = id;
  document.body.appendChild(app);
  render(h(component), app);
}

function weightRandom(items, p) {
  // 1. 计算所有奖品的总权重
  const totalWeight = items.reduce((sum, item) => sum + p(item), 0);

  // 2. 生成一个 0 到 totalWeight 之间的随机浮点数
  let random = Math.random() * totalWeight;

  // 3. 遍历奖品，找到随机数落在哪个区间
  for (const item of items) {
    random -= p(item);
    if (random <= 0) {
      return item; // 命中！
    }
  }

  // 保险起见，返回最后一个（通常不会执行到这里）
  return items[items.length - 1];
}

window.sUtils = {
  get,
  useMessageData,
  appendItemInput,
  renderComponent,
  weightRandom,
};
window.sComponents = {
  SFloating,
  STab,
  SRadarChart,
  SExpand,
  SVariableImage,
  SText,
};
