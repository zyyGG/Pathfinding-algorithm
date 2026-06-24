/**
 * Canvas class that creates a canvas element and appends it to a container element.
 * @class Canvas
 * @property {HTMLElement} container - The container element to which the canvas will be appended.
 * @property {HTMLCanvasElement} canvas - The canvas element that is created and appended to the container.
 * 
 * @method drawCell - Draws a cell on the canvas at the specified coordinates with the specified color.
 * @param {number} x - The x-coordinate of the cell to be drawn.
 * @param {number} y - The y-coordinate of the cell to be drawn.
 * @param {string} color - The color of the cell to be drawn.
 * 
 * @event cellClick - 格子点击事件, detail: { x, y, nativeEvent }
 * @event cellHover - 格子悬停事件, detail: { x, y, nativeEvent }
 * @event cellLeave - 离开格子事件, detail: { nativeEvent }
 * @event cellRightClick - 格子右键事件, detail: { x, y, nativeEvent }
 */
export class Canvas {
  container = null
  canvas = null
  ctx = null
  // 画布的宽高
  width = 0
  height = 0
  // 格子的数量
  set cellHCount(value) {
    this._cellHCount = Math.max(0, Math.min(this.cellMaxHCount, value));
    this._computedOffset();
  }
  get cellHCount() {
    return this._cellHCount;
  }
  set cellVCount(value) {
    this._cellVCount = Math.max(0, Math.min(this.cellMaxVCount, value));
    this._computedOffset();
  }
  get cellVCount() {
    return this._cellVCount;
  }
  _cellHCount = 20
  _cellVCount = 20
  cellMaxHCount = 0 // 最大格子数量, (自动计算)
  cellMaxVCount = 0
  // 格子的大小
  cellWidth = 50 // 每个格子的高宽
  cellHeight = 50
  cellBorderColor = '#333' // 格子边框颜色
  cellBackgroundColor = '#fff' // 格子背景颜色
  cellOffsetX = 0 // 格子在x轴上的偏移量
  cellOffsetY = 0 // 格子在y轴上的偏移量
  cells = [] // 格子数据，可以在这里存储每个格子的状态等信息
  static CELL_TYPES = {
    default: 'default',
    wall: "wall",
    endPoint: "endPoint",
    startPoint: "startPoint",
    searching: "searching",
    searched: "searched",
    lineWay: "lineWay",
  }

  
  /**
   * 
   * @param {HTMLElement} container 
   * @param {Object} options - The options for the canvas.
   * @param {number?} options.width - The width of the canvas.
   * @param {number?} options.height - The height of the canvas.
   * @param {string?} options.backgroundColor - The background color of the canvas.
   */
  /** @type {{ [key: string]: Function[] }} */
  _listeners = {}
  /** @type {{ x: number, y: number } | null} */
  _hoveredCell = null

  constructor(container, options){
    this.container = container;

    const canvas = document.createElement('canvas');
    this.canvas = canvas;
    const aspectRatio = window.devicePixelRatio || 1;
    this.width = (options?.width || container.clientWidth) * aspectRatio;
    this.height = (options?.height || container.clientHeight) * aspectRatio;
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.backgroundColor = options?.backgroundColor || 'black';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    this.ctx = ctx;
    this._computedCellMaxCount();
    this._computedCellOffset()
    this._initScene();
    this._initEvents();
  }

  // ==================== 事件系统 ====================

  /**
   * 初始化 canvas 原生事件监听
   */
  _initEvents() {
    this.canvas.addEventListener('click', (e) => {
      const cell = this.getCellFromPixel(e.clientX, e.clientY);
      const type = cell ? this.cells[cell.y][cell.x].type : null;
      if (cell) this._emit('cellClick', { x: cell.x, y: cell.y, type: type, nativeEvent: e });
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const cell = this.getCellFromPixel(e.clientX, e.clientY);
      if (cell) this._emit('cellRightClick', { x: cell.x, y: cell.y, nativeEvent: e });
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const cell = this.getCellFromPixel(e.clientX, e.clientY);
      if (cell) {
        if (!this._hoveredCell || this._hoveredCell.x !== cell.x || this._hoveredCell.y !== cell.y) {
          this._hoveredCell = cell;
          this._emit('cellHover', { x: cell.x, y: cell.y, nativeEvent: e });
        }
      } else if (this._hoveredCell) {
        this._hoveredCell = null;
        this._emit('cellLeave', { nativeEvent: e });
      }
    });

    this.canvas.addEventListener('mouseleave', (e) => {
      if (this._hoveredCell) {
        this._hoveredCell = null;
        this._emit('cellLeave', { nativeEvent: e });
      }
    });
  }

  /**
   * 将鼠标屏幕坐标转换为格子坐标
   * @param {number} clientX - 鼠标的 clientX
   * @param {number} clientY - 鼠标的 clientY
   * @returns {{ x: number, y: number } | null} 格子坐标，超出范围返回 null
   */
  getCellFromPixel(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    const cellX = Math.floor((canvasX - this.cellOffsetX) / this.cellWidth);
    const cellY = Math.floor((canvasY - this.cellOffsetY) / this.cellHeight);
    if (cellX < 0 || cellX >= this.cellHCount || cellY < 0 || cellY >= this.cellVCount) {
      return null;
    }
    return { x: cellX, y: cellY };
  }

  /**
   * 注册自定义事件
   * @param {'cellClick' | 'cellHover' | 'cellLeave' | 'cellRightClick'} type
   * @param {(detail: { x?: number, y?: number, nativeEvent: Event }) => void} listener
   */
  on(type, listener) {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(listener);
  }

  /**
   * 移除自定义事件
   * @param {'cellClick' | 'cellHover' | 'cellLeave' | 'cellRightClick'} type
   * @param {(detail: { x?: number, y?: number, nativeEvent: Event }) => void} listener
   */
  off(type, listener) {
    const arr = this._listeners[type];
    if (arr) this._listeners[type] = arr.filter(l => l !== listener);
  }

  /**
   * 触发自定义事件
   * @param {string} type
   * @param {object} detail
   */
  _emit(type, detail) {
    this._listeners[type]?.forEach(fn => fn(detail));
  }

  /**
   * 直接访问 canvas 原生 addEventListener（备选方案）
   * @param {string} type
   * @param {EventListenerOrEventListenerObject} listener
   * @param {AddEventListenerOptions | boolean} [options]
   */
  /**
   * 初始化整个场景
   */
  _initScene() {
    // 绘制棋盘格
    for(let i = 0; i < this.cellHCount; i++) {
      for(let j = 0; j < this.cellVCount; j++) {
        const x = i * this.cellWidth;
        const y = j * this.cellHeight;
        // this.cells[j][i] = { type: Canvas.CELL_TYPES.default }; // 初始化格子数据
        this.cells[j] = this.cells[j] || [];
        this.cells[j][i] = new Cell(i, j, Canvas.CELL_TYPES.default); // 初始化格子数据
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(this.cellOffsetX, this.cellOffsetY);
        ctx.strokeStyle = this.cellBorderColor;
        ctx.fillStyle = this.cellBackgroundColor;
        ctx.fillRect(x, y, this.cellWidth, this.cellHeight);
        ctx.strokeRect(x, y, this.cellWidth, this.cellHeight);
        ctx.restore();
      }
    }
  }

  /**
   * 计算整个canvas能绘制的最大格子数量
   */
  _computedCellMaxCount() {
    this.cellMaxHCount = Math.floor(this.width / this.cellWidth);
    this.cellMaxVCount = Math.floor(this.height / this.cellHeight);
  }
  
  /**
   * 计算场景的偏移量，使得所有格子能够居中显示
   */
  _computedCellOffset() {
    const totalCellWidth = this.cellHCount * this.cellWidth;
    const totalCellHeight = this.cellVCount * this.cellHeight;
    this.cellOffsetX = (this.width - totalCellWidth) / 2;
    this.cellOffsetY = (this.height - totalCellHeight) / 2;
  }
  
  /**
   * 根据格子类型获取对应的颜色
   * @param {Canvas.CELL_TYPES} type 
   * @returns {string} 颜色字符串
   */
  _getColorByType(type) {
    switch(type) {
      case Canvas.CELL_TYPES.wall: return '#aaa';
      case Canvas.CELL_TYPES.startPoint: return '#0f0';
      case Canvas.CELL_TYPES.endPoint: return '#f00';
      case Canvas.CELL_TYPES.searching: return '#ff0';
      case Canvas.CELL_TYPES.searched: return '#0ff';
      case Canvas.CELL_TYPES.lineWay: return '#f0f';
      case Canvas.CELL_TYPES.default:
      default: return this.cellBackgroundColor;
    }
  }

  /**
   * 绘制指定颜色的格子
   * @param {number} x
   * @param {number} y
   * @param {string} color
   */
  drawCell(cell_x, cell_y, color) {
    const ctx = this.ctx;
    const x = cell_x * this.cellWidth;
    const y = cell_y * this.cellHeight;
    ctx.save();
    ctx.translate(this.cellOffsetX, this.cellOffsetY);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, this.cellWidth, this.cellHeight);
    ctx.strokeRect(x, y, this.cellWidth, this.cellHeight);
    ctx.restore();
  }

  drawText(cell_x, cell_y, text) {
    const ctx = this.ctx;
    const x = cell_x * this.cellWidth;
    const y = cell_y * this.cellHeight;
    ctx.save();
    ctx.translate(this.cellOffsetX, this.cellOffsetY);
    ctx.fillStyle = '#000';
    ctx.font = `${this.cellHeight / 2.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + this.cellWidth / 2, y + this.cellHeight / 2);
    ctx.restore();
  }

  /**
   * 
   * @param {Cell} cell 
   */
  updateCell(cell) {
    if (this.cells[cell.y] && this.cells[cell.y][cell.x]) {
      this.cells[cell.y][cell.x].type = cell.type;
      this.cells[cell.y][cell.x].color = this._getColorByType(cell.type);
      this.drawCell(cell.x, cell.y, this.cells[cell.y][cell.x].color);
    }

    if(cell.f !== undefined) {
      this.drawText(cell.x, cell.y, cell.f.toFixed(1));
    }
  }

  addEventListener(type, listener, options) {
    this.canvas.addEventListener(type, listener, options);
  }

  /**
   * 指定格子的属性
   * @param {number} cell_x 
   * @param {number} cell_y 
   * @param {Canvas.CELL_TYPES} type 
   */
  setCellType(cell_x, cell_y, type) {
    if (this.cells[cell_y] && this.cells[cell_y][cell_x]) {
      this.cells[cell_y][cell_x].type = type;
      this.cells[cell_y][cell_x].color = this._getColorByType(type);
      this.drawCell(cell_x, cell_y, this.cells[cell_y][cell_x].color);
    }
  }

  getCell(cell_x, cell_y) {
    if (this.cells[cell_y] && this.cells[cell_y][cell_x]) {
      return new Cell(cell_x, cell_y, this.cells[cell_y][cell_x].type);
    }
    return null;
  }

  reset() {
    for(let i = 0; i < this.cellHCount; i++) {
      for(let j = 0; j < this.cellVCount; j++) {
        if(this.cells[j][i].type == Canvas.CELL_TYPES.wall) continue; // 墙壁不重置
        this.cells[j][i].type = Canvas.CELL_TYPES.default;
        this.cells[j][i].color = this._getColorByType(Canvas.CELL_TYPES.default);
        this.drawCell(i, j, this.cells[j][i].color);
      }
    }
  }
}

/**
 * 表示一个格子
 */
export class Cell {
  x
  y
  _type
  color
  g
  h
  f
  parent = null
  set type(value) {
    this._type = value
    this.color = this.#getCellColor()
  }
  get type() {
    return this._type
  }
  constructor(x, y, type) {
    this.x = x
    this.y = y
    this.type = type
  }
  #getCellColor() {
    switch(this.type) {
      case Canvas.CELL_TYPES.wall: return '#aaa';
      case Canvas.CELL_TYPES.startPoint: return '#0f0';
      case Canvas.CELL_TYPES.endPoint: return '#f00';
      case Canvas.CELL_TYPES.searching: return '#ff0';
      case Canvas.CELL_TYPES.searched: return '#0ff';
      case Canvas.CELL_TYPES.lineWay: return '#f0f';
      case Canvas.CELL_TYPES.default:
      default:
         return '#fff'
    }
  }
}