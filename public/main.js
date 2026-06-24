import { Canvas, Cell } from "./index.js";
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui/dist/lil-gui.esm.min.js';
import BFS from "./BFS.js";
import AStar from "./AStar.js";

const container = document.getElementById("container");
const scene = new Canvas(container);

const startPoint = new Cell(2, 2, Canvas.CELL_TYPES.startPoint);
const endPoint = new Cell(2, 15, Canvas.CELL_TYPES.endPoint);

// 默认选择
const BFSControl = BFS(scene, startPoint, endPoint);
const AStarControl = AStar(scene, startPoint, endPoint);
let currentAlgorithm = AStarControl; // 当前使用的算法控制器


let result = [startPoint]
let isFind = false



let pen = Canvas.CELL_TYPES.wall
function getPen() {
  return pen;
}
// 点击增加墙壁
scene.on("cellClick", (cell) => {
  const pen = getPen();
  if(pen == Canvas.CELL_TYPES.startPoint) {
    startPoint.type = Canvas.CELL_TYPES.default
    scene.updateCell(startPoint)
    startPoint.x = cell.x
    startPoint.y = cell.y
    startPoint.type = Canvas.CELL_TYPES.startPoint
    scene.updateCell(startPoint)
  } else if(pen == Canvas.CELL_TYPES.endPoint) {
    endPoint.type = Canvas.CELL_TYPES.default
    scene.updateCell(endPoint)
    endPoint.x = cell.x
    endPoint.y = cell.y
    endPoint.type = Canvas.CELL_TYPES.endPoint
    scene.updateCell(endPoint)
  }
  scene.updateCell(new Cell(cell.x, cell.y, getPen()))
})

const FPS = 20;            // 每秒帧数（1 = 每秒1次，0.5 = 每2秒1次）
const interval = 1000 / FPS; // 每帧间隔（毫秒）
let lastUpdate = 0;

function findWay(timestamp) {
  if (isFind) {
    console.log("搜索完成，终点已找到，共遍历", currentAlgorithm.searchCount, "个格子")
    handleFind()
    return; // 已找到终点，停止搜索
  }

  if (lastUpdate === 0) {
    lastUpdate = timestamp;
  } else if (timestamp - lastUpdate >= interval) {
    // 达到间隔时间，执行更新
    lastUpdate += interval; // 累加间隔，避免累积误差
    ({result, isFind} = currentAlgorithm.search(result))
  }

  if(result.length === 0 && !isFind) {
    console.log("搜索完成，未找到终点，共遍历", currentAlgorithm.searchCount, "个格子")
    return;
  }
  requestAnimationFrame(findWay);
}

// 处理找到终点的方法
function handleFind(){
  let cycleCell = result[0]
  while(cycleCell.parent != null ) {
    cycleCell.type = Canvas.CELL_TYPES.lineWay
    scene.updateCell(cycleCell)
    cycleCell = cycleCell.parent
  }
}

// 初始化gui
const gui = new GUI();
const searchControl = gui.addFolder('搜索控制');
searchControl.add({ start: () => {
  if (!isFind) requestAnimationFrame(findWay);
}}, 'start').name('开始寻路');
searchControl.add({ reset: () => {
  isFind = false
  result = [startPoint]
  currentAlgorithm.searchCount = 0
  scene.reset()
  scene.updateCell(startPoint)
  scene.updateCell(endPoint)
  // 动画
  lastUpdate = 0
}}, 'reset').name('重置');
searchControl.add({step: () => {
  if (!isFind) {
    ({result, isFind} = currentAlgorithm.search(result))
    if(result.length === 0 && !isFind) {
      console.log("搜索完成，未找到终点，共遍历", currentAlgorithm.searchCount, "个格子")
      return;
    }
  }
}}, 'step').name('单步搜索');
searchControl.add({
  algorithm: "BFS"
}, "algorithm", ["BFS", "A*"]).name('搜索算法').onChange((value => {
  switch(value) {
    case "BFS": currentAlgorithm = BFSControl; break;
    case "A*": currentAlgorithm = AStarControl; break;
  }
}));

const penControl = gui.addFolder('笔刷选择');
penControl.add({ setDefaultPen: () => {
  pen = Canvas.CELL_TYPES.default;
}}, 'setDefaultPen').name('设置默认笔刷');
penControl.add({ setWallPen: () => {
  pen = Canvas.CELL_TYPES.wall;
}}, 'setWallPen').name('设置墙壁笔刷');
penControl.add({ setStartPointPen: () => {
  pen = Canvas.CELL_TYPES.startPoint;
}}, 'setStartPointPen').name('设置起点笔刷');
penControl.add({ setEndPointPen: () => {
  pen = Canvas.CELL_TYPES.endPoint;
}}, 'setEndPointPen').name('设置终点笔刷');

