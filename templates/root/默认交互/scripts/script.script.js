import { h } from 'preact';
import { useState } from 'preact/hooks';

const { useMessageData, renderComponent } = window.sUtils;

function ht(text, properties, m) {
  return text
    ? m(h('div', { ...properties, dangerouslySetInnerHTML: { __html: text } }))
    : null;
}

function collapsable({ label, content }) {
  const [cpllapsed, setCpllapsed] = useState(false);

  return h(
    'div',
    { className: 'collapse' },
    h(
      'div',
      {
        className: 'collapse-hd',
        onClick: () => setCpllapsed((u) => !u),
      },
      h('span', {}, label),
      h('span', {}, cpllapsed ? '▶' : '▼'),
    ),
    cpllapsed && h('div', { className: 'collapse-bd' }, content()),
  );
}

function space(space) {
  return h(
    'div',
    { className: 'space' },
    ht(space.thought, {}, (t) =>
      h(collapsable, { label: '💭 思考过程', content: () => t }),
    ),
    space.callings?.length
      ? space.callings.map((u) =>
          ht(`${u.arguments}\n${u.result}`, {}, (t) =>
            h(collapsable, {
              label: `⚒️ 工具调用 ${u.name}`,
              content: () => t,
            }),
          ),
        )
      : null,
    ht(space.output, { className: 'output' }, (t) => t),
  );
}

// 主应用组件
function App() {
  const [message] = useMessageData();
  // 使用 h 函数创建元素
  return h(
    'div',
    { className: 'container' },
    ht(message.prompt, { className: 'prompt' }, (t) => t),
    message.spaces?.length ? message.spaces.map((u) => h(space, u)) : null,
  );
}

renderComponent(App, 'app');
