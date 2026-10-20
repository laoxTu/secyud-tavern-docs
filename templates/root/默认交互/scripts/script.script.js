import { h } from 'preact';
import { useState } from 'preact/hooks';

const { SText } = window.sComponents;
const { useMessageData, renderComponent } = window.sUtils;

function ht(text, m) {
  return text ? m(h(SText, { text })) : null;
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
    ht(space.thought, (t) =>
      h(collapsable, { label: '💭 思考过程', content: () => t }),
    ),
    space.callings?.length
      ? space.callings.map((u) =>
          h(collapsable, {
            label: `⚒️ 工具调用 ${u.name}`,
            content: () => [h('div', {}, u.arguments), h('div', {}, u.result)],
          }),
        )
      : null,
    ht(space.output, (t) => h('div', { className: 'output' }, t)),
  );
}

// 主应用组件
function App() {
  const [message] = useMessageData();
  // 使用 h 函数创建元素
  return h(
    'div',
    { className: 'container' },
    ht(message.prompt, (t) => h('div', { className: 'prompt' }, t)),
    message.spaces?.length ? message.spaces.map((u) => h(space, u)) : null,
  );
}

renderComponent(App, 'app');
