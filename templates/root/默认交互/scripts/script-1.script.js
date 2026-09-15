import { h } from 'preact';
import { useState } from 'preact/hooks';

const { SText } = window.sComponents;
const { useMessageData, renderComponent } = window.sUtils;

// 主应用组件
function App() {
  const [message] = useMessageData();
  const [thoughtCollapsed, setThoughtCollapsed] = useState(false);

  // 使用 h 函数创建元素
  return h(
    'div',
    { className: 'container' },
    message.inputs?.length
      ? h(
          'div',
          { className: 'user-inputs' },
          message.inputs.map((u) =>
            h('div', { className: 'user-input' }, h(SText, { text: u })),
          ),
        )
      : null,
    message.thought
      ? h(
          'div',
          { className: 'ai-think' },
          h(
            'div',
            {
              className: 'think-header',
              onClick: () => setThoughtCollapsed((u) => !u),
            },
            h('span', { style: 'font-weight:bold;' }, '💭 思考过程'),
            h('span', thoughtCollapsed ? '▶' : '▼'),
          ),
          thoughtCollapsed &&
            h(
              'div',
              { className: 'think-content' },
              h(SText, { text: message.thought }),
            ),
        )
      : null,
    message.output
      ? h('div', { className: 'ai-output' }, h(SText, { text: message.output }))
      : null,
  );
}

renderComponent(App, 'app');
