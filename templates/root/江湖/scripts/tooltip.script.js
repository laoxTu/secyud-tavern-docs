import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

// ============================================================
// STooltip — 通用纸笺提示
//
// 目前放在江湖本地，后续可直接并入默认交互的组件库。
// 组件只负责定位与交互，外观由使用方的 CSS 提供（这里由
// 江湖的 .s-tooltip 主题负责）。
//
// 用法：
//   h(STooltip, { content: '详细说明' }, h('span', {}, '触发元素'))
// ============================================================

const CAN_HOVER =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover)').matches;

let tipNode = null;
let tipTrigger = null;
let tipRemoveListeners = null;

function ensureTipNode() {
  if (tipNode) return tipNode;

  tipNode = document.createElement('div');
  tipNode.className = 's-tooltip';
  tipNode.id = 's-tooltip-layer';
  tipNode.setAttribute('role', 'tooltip');
  tipNode.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tipNode);
  return tipNode;
}

function placeTip(trigger, placement, offset) {
  const node = ensureTipNode();
  const rect = trigger.getBoundingClientRect();
  const width = node.offsetWidth;
  const height = node.offsetHeight;

  let side;
  let top;

  if (placement === 'bottom') {
    side = 'bottom';
    top = rect.bottom + offset;
  } else {
    side = 'top';
    top = rect.top - height - offset;
    if (placement === 'auto' && top < 6) {
      side = 'bottom';
      top = rect.bottom + offset;
    }
  }

  if (top + height > window.innerHeight - 6) {
    top = Math.max(6, window.innerHeight - height - 6);
  }
  if (top < 6) top = 6;

  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(6, Math.min(left, window.innerWidth - width - 6));

  node.dataset.placement = side;
  node.style.left = `${left}px`;
  node.style.top = `${top}px`;
}

function hideTooltip() {
  if (tipNode) {
    tipNode.classList.remove('show');
    tipNode.setAttribute('aria-hidden', 'true');
    tipNode.textContent = '';
  }

  if (tipTrigger) {
    tipTrigger.removeAttribute('aria-describedby');
    tipTrigger = null;
  }

  if (tipRemoveListeners) {
    tipRemoveListeners();
    tipRemoveListeners = null;
  }
}

function showTooltip(trigger, content, placement, offset) {
  if (!content || !trigger) return;

  const node = ensureTipNode();
  if (tipTrigger && tipTrigger !== trigger) {
    tipTrigger.removeAttribute('aria-describedby');
  }

  tipTrigger = trigger;
  node.textContent = String(content);
  node.classList.add('show');
  node.setAttribute('aria-hidden', 'false');
  trigger.setAttribute('aria-describedby', node.id);
  placeTip(trigger, placement, offset);

  if (tipRemoveListeners) return;

  const onScroll = () => hideTooltip();
  const onResize = () => hideTooltip();
  const onPointerDown = (event) => {
    if (tipNode && tipNode.contains(event.target)) return;
    if (tipTrigger && !tipTrigger.contains(event.target)) hideTooltip();
  };
  const onKeyDown = (event) => {
    if (event.key === 'Escape') hideTooltip();
  };

  window.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', onResize);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('keydown', onKeyDown);
  tipRemoveListeners = () => {
    window.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('keydown', onKeyDown);
  };
}

function STooltip({
  children,
  content,
  className,
  placement = 'auto',
  offset = 8,
}) {
  const triggerRef = useRef(null);
  const hasContent = Boolean(content);

  useEffect(() => {
    const trigger = triggerRef.current;
    return () => {
      if (tipTrigger === trigger) hideTooltip();
    };
  }, []);

  return h(
    'span',
    {
      ref: triggerRef,
      className: `s-tooltip-trigger${className ? ` ${className}` : ''}`,
      tabIndex: hasContent ? 0 : undefined,
      onMouseEnter:
        hasContent && CAN_HOVER
          ? () =>
              showTooltip(
                triggerRef.current,
                content,
                placement,
                offset,
              )
          : undefined,
      onMouseLeave: hasContent && CAN_HOVER ? hideTooltip : undefined,
      onFocus:
        hasContent && CAN_HOVER
          ? () => showTooltip(triggerRef.current, content, placement, offset)
          : undefined,
      onBlur: hasContent && CAN_HOVER ? hideTooltip : undefined,
      onClick: hasContent
        ? (event) => {
            event.stopPropagation();
            if (CAN_HOVER) return;

            if (tipTrigger === triggerRef.current) {
              hideTooltip();
            } else {
              showTooltip(triggerRef.current, content, placement, offset);
            }
          }
        : undefined,
    },
    children,
  );
}

window.sComponents = window.sComponents || {};
window.sComponents.STooltip = STooltip;
