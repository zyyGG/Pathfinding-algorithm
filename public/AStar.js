// A* Algorithm Implementation
// 核心是两个权重
// g(n) = 从起点到当前节点的代价
// h(n) = 从当前节点到终点的估计代价（启发式函数）
// f(n) = g(n) + h(n)
// 我这里直接将当前格子距离终点的直线距离当作启发式函数的值

import { Cell, Canvas } from "./index.js";

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
export default function A_Star(scene, startPoint, endPoint) {
  scene.updateCell(startPoint)
  scene.updateCell(endPoint)

  let searchCount = 0 // 记录已遍历的格子数量

  /**
   * 
   * @param {Cell[]} cells 
   * @param {Boolean} isFind 
   */
  function search(cells, isFind = false) {
    // console.log("A*算法搜索中，已遍历", searchCount, "个格子")
    let result = cells
    const cell = result.shift() // 取出第一个格子进行搜索
    
    // if(cell == undefined || cell == null) {
    //   console.log("搜索完成，未找到终点，共遍历", searchCount, "个格子")
    //   return { result: [], isFind: false }
    // }

    if (cell && cell.type !== Canvas.CELL_TYPES.startPoint) {
      cell.type = Canvas.CELL_TYPES.searched
      scene.updateCell(cell)
      searchCount++ // 遍历一个格子就加一
    }

    // 获取cell的上下左右格子
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
      topCell.parent = cell
      result.push(topCell)
      topCell.type = Canvas.CELL_TYPES.searching
      // 计算当前格子到终点的距离
      topCell.h = Math.sqrt(Math.pow(topCell.x - endPoint.x, 2) + Math.pow(topCell.y - endPoint.y, 2))
      topCell.g = (cell.g || 0) + 1
      topCell.f = topCell.g + topCell.h
      scene.updateCell(topCell)
    }
    if(rightCell && rightCell.type === Canvas.CELL_TYPES.default) {
      rightCell.parent = cell
      result.push(rightCell)
      rightCell.type = Canvas.CELL_TYPES.searching
      rightCell.h = Math.sqrt(Math.pow(rightCell.x - endPoint.x, 2) + Math.pow(rightCell.y - endPoint.y, 2))
      rightCell.g = (cell.g || 0) + 1
      rightCell.f = rightCell.g + rightCell.h
      scene.updateCell(rightCell)
    }
    if(bottomCell && bottomCell.type === Canvas.CELL_TYPES.default) {
      bottomCell.parent = cell
      result.push(bottomCell)
      bottomCell.type = Canvas.CELL_TYPES.searching
      bottomCell.h = Math.sqrt(Math.pow(bottomCell.x - endPoint.x, 2) + Math.pow(bottomCell.y - endPoint.y, 2))
      bottomCell.g = (cell.g || 0) + 1
      bottomCell.f = bottomCell.g + bottomCell.h
      scene.updateCell(bottomCell)
    }
    if(leftCell && leftCell.type === Canvas.CELL_TYPES.default) {
      leftCell.parent = cell
      result.push(leftCell)
      leftCell.type = Canvas.CELL_TYPES.searching
      leftCell.h = Math.sqrt(Math.pow(leftCell.x - endPoint.x, 2) + Math.pow(leftCell.y - endPoint.y, 2))
      leftCell.g = (cell.g || 0) + 1
      leftCell.f = leftCell.g + leftCell.h
      scene.updateCell(leftCell)
    }

    // 按照cell.f重新排序
    result = result.sort((a, b) => a.f - b.f)
    console.log(result)

    return { result, isFind }
  }

  return {
    search,
    get searchCount() { return searchCount; },
    set searchCount(value) { searchCount = value; }
  }
}