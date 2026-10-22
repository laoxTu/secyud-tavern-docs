import { h } from "preact";

const { useMessageData, renderComponent } = window.sUtils;

// 深色系配色：红、赭、棕、琥珀、绿、墨绿、青、蓝、靛、紫、梅、石墨
const INKS = [
  "rgba(153, 27, 27, 0.95)",
  "rgba(154, 52, 18, 0.95)",
  "rgba(146, 64, 14, 0.95)",
  "rgba(113, 63, 18, 0.95)",
  "rgba(22, 101, 52, 0.95)",
  "rgba(19, 78, 74, 0.95)",
  "rgba(22, 78, 99, 0.95)",
  "rgba(30, 58, 138, 0.95)",
  "rgba(55, 48, 163, 0.95)",
  "rgba(88, 28, 135, 0.95)",
  "rgba(131, 24, 67, 0.95)",
  "rgba(63, 63, 70, 0.95)",
];

function style(name, value) {
  const ink = INKS[(name.codePointAt(0) ?? 0) % INKS.length];
  const pos = ((value.codePointAt(0) ?? 0) % 10) + 1;
  return `margin-left:${pos * 50}px;--ink:${ink};`;
}

// 每条弹幕折算成多少秒，周期 = 总条数 × 这个系数
const SECONDS_PER_BULLET = 1.8;

// 粗估周期，最少给 10 秒，免得条数太少时飙过去
function estimateCycle(groups) {
  let total = 0;
  groups.forEach((group) => {
    total += Object.keys(group).length;
  });
  return Math.max(10, total * SECONDS_PER_BULLET);
}

function App() {
  const [variables] = useMessageData("variables");
  const groups = Object.values(variables?.space?.bullets ?? {});

  return h(
    "div",
    {
      className: "bullets-bg",
      "aria-hidden": "true",
      style: `--cycle:${estimateCycle(groups).toFixed(1)}s;`,
    },
    groups.map((group) =>
      h(
        "div",
        { className: "bullets" },
        Object.entries(group).map(([name, value]) =>
          h(
            "div",
            {
              className: "bullet",
              style: style(name, value),
            },
            h("span", { className: "name" }, name),
            h("span", { className: "content" }, value),
          ),
        ),
      ),
    ),
  );
}

renderComponent(App, "bullet");
