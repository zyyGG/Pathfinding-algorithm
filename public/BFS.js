// 广度优先算法
import { Canvas, Cell } from "./index.js";

/**
 * 
 * @param {Canvas} scene 
 * @param {Cell} startPoint 
 * @param {Cell} endPoint 
 * @returns {Object} 返回一个对象，包含update方法
 * update方法接收两个参数：
 * 1. cells: 当前搜索的格子数组
 * 2. isFind: 是否找到终点
 * @returns {(CELL, Boolean) => {result: Array, isFind: Boolean}} search
 */
export default function BFS(scene, startPoint, endPoint) {
  // 初始化起始点与终点
  // scene.setCellType();
  // scene.setCellType(endPoint.x, endPoint.y, Canvas.CELL_TYPES.endPoint);
  scene.updateCell(startPoint)
  scene.updateCell(endPoint)

  let searchCount = 0 // 记录已遍历的格子数量

  /**
   * 
   * @param {Cell[]} cells 
   * @param {Boolean} isFind 
   * @returns 
   */
  function search(cells, isFind = false) {
    // debugger
    const result = []
    for(let i = 0 ; i < cells.length; i++) {
      const cell = cells[i]
      // 更改格子种类
      if (cell.type !== Canvas.CELL_TYPES.startPoint) {
        cell.type = Canvas.CELL_TYPES.searched
        scene.updateCell(cell)
        searchCount++ // 遍历一个格子就加一
      }

      // 开始寻找接下来的格子进行遍历
      const topCell = scene.getCell(cell.x, cell.y - 1)
      const rightCell = scene.getCell(cell.x + 1, cell.y)
      const bottomCell = scene.getCell(cell.x, cell.y + 1)
      const leftCell = scene.getCell(cell.x - 1, cell.y)

      // 检查上下左右是否找到了endpoint
      if(
        topCell && topCell.type === Canvas.CELL_TYPES.endPoint ||
        rightCell && rightCell.type === Canvas.CELL_TYPES.endPoint ||
        bottomCell && bottomCell.type === Canvas.CELL_TYPES.endPoint ||
        leftCell && leftCell.type === Canvas.CELL_TYPES.endPoint
      ) {
        console.log("找到终点")
        return {result: [cell], isFind: true}
      }

      if(topCell && topCell.type === Canvas.CELL_TYPES.default) {
        result.push(topCell)
        topCell.type = Canvas.CELL_TYPES.searching
        scene.updateCell(topCell)
        topCell.parent = cell // 记录父节点
      }
      if(rightCell && rightCell.type === Canvas.CELL_TYPES.default) {
        result.push(rightCell)
        rightCell.type = Canvas.CELL_TYPES.searching
        scene.updateCell(rightCell)
        rightCell.parent = cell // 记录父节点
      }
      if(bottomCell && bottomCell.type === Canvas.CELL_TYPES.default) {
        result.push(bottomCell)
        bottomCell.type = Canvas.CELL_TYPES.searching
        scene.updateCell(bottomCell)
        bottomCell.parent = cell // 记录父节点
      }
      if(leftCell && leftCell.type === Canvas.CELL_TYPES.default) {
        result.push(leftCell)
        leftCell.type = Canvas.CELL_TYPES.searching
        scene.updateCell(leftCell)
        leftCell.parent = cell // 记录父节点
      }
    }
    return {result, isFind}
  }

  return {
    search,
    get searchCount() { return searchCount; },
    set searchCount(value) { searchCount = value; }
  }
}
