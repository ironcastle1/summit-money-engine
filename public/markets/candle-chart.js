import { marketPrice, percent } from './market-format.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
function node(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

function extent(values) {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return [0, 1];
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const pad = Math.max((max - min) * 0.08, Math.abs(max) * 0.002, 1e-9);
  return [min - pad, max + pad];
}

function movingAverage(values, period) {
  const output = new Array(values.length).fill(null);
  let total = 0;
  for (let index = 0; index < values.length; index += 1) {
    total += values[index];
    if (index >= period) total -= values[index - period];
    if (index >= period - 1) output[index] = total / period;
  }
  return output;
}

export class CandleChart {
  constructor(container) {
    this.container = container;
    this.candles = [];
    this.asset = null;
    this.resizeObserver = new ResizeObserver(() => this.render());
    this.resizeObserver.observe(container);
  }

  setData(candles, asset) {
    this.candles = (candles || []).map(row => Array.isArray(row) ? { timestamp: row[0], open: row[1], high: row[2], low: row[3], close: row[4], volume: row[5] } : row).slice(-240);
    this.asset = asset;
    this.render();
  }

  clear(message = 'NO MARKET DATA') {
    this.candles = [];
    this.container.innerHTML = `<div class="chart-empty">${message}</div>`;
  }

  render() {
    if (!this.candles.length || this.container.clientWidth < 100) return this.clear();
    const width = Math.max(320, this.container.clientWidth);
    const height = Math.max(260, this.container.clientHeight);
    const margin = { top: 18, right: 72, bottom: 34, left: 12 };
    const volumeHeight = Math.max(42, height * 0.18);
    const priceBottom = height - margin.bottom - volumeHeight - 12;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = priceBottom - margin.top;
    const [minimum, maximum] = extent(this.candles.flatMap(candle => [candle.low, candle.high]));
    const maxVolume = Math.max(...this.candles.map(candle => candle.volume || 0), 1);
    const x = index => margin.left + (index + 0.5) * plotWidth / this.candles.length;
    const y = value => margin.top + (maximum - value) / (maximum - minimum) * plotHeight;
    const svg = node('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `${this.asset?.symbol || ''} price chart` });
    svg.classList.add('candle-svg');

    for (let line = 0; line <= 5; line += 1) {
      const value = minimum + (maximum - minimum) * line / 5;
      const yPosition = y(value);
      svg.append(node('line', { x1: margin.left, x2: width - margin.right, y1: yPosition, y2: yPosition, class: 'chart-grid' }));
      const label = node('text', { x: width - margin.right + 8, y: yPosition + 3, class: 'chart-axis' });
      label.textContent = marketPrice(value, this.asset?.quoteCurrency || 'USD');
      svg.append(label);
    }

    const candleWidth = Math.max(1, Math.min(8, plotWidth / this.candles.length * 0.68));
    this.candles.forEach((candle, index) => {
      const rise = candle.close >= candle.open;
      const group = node('g', { class: rise ? 'candle-up' : 'candle-down' });
      group.append(node('line', { x1: x(index), x2: x(index), y1: y(candle.high), y2: y(candle.low), class: 'candle-wick' }));
      const top = y(Math.max(candle.open, candle.close));
      const bottom = y(Math.min(candle.open, candle.close));
      group.append(node('rect', { x: x(index) - candleWidth / 2, y: top, width: candleWidth, height: Math.max(1, bottom - top), class: 'candle-body' }));
      const volumeTop = height - margin.bottom - (candle.volume || 0) / maxVolume * volumeHeight;
      group.append(node('rect', { x: x(index) - candleWidth / 2, y: volumeTop, width: candleWidth, height: height - margin.bottom - volumeTop, class: 'volume-bar' }));
      svg.append(group);
    });

    const closes = this.candles.map(candle => candle.close);
    const average20 = movingAverage(closes, 20);
    const points = average20.map((value, index) => Number.isFinite(value) ? `${x(index)},${y(value)}` : null).filter(Boolean).join(' ');
    if (points) svg.append(node('polyline', { points, class: 'chart-average' }));

    const first = this.candles[0].close;
    const last = this.candles.at(-1).close;
    const change = first > 0 ? last / first - 1 : null;
    const title = node('text', { x: margin.left + 5, y: margin.top + 12, class: 'chart-title' });
    title.textContent = `${this.asset?.symbol || ''}  ${marketPrice(last, this.asset?.quoteCurrency || 'USD')}  ${percent(change, 2, true)}`;
    svg.append(title);

    const tickCount = Math.min(6, this.candles.length);
    for (let tick = 0; tick < tickCount; tick += 1) {
      const index = Math.round(tick * (this.candles.length - 1) / Math.max(1, tickCount - 1));
      const label = node('text', { x: x(index), y: height - 10, class: 'chart-time', 'text-anchor': tick === 0 ? 'start' : tick === tickCount - 1 ? 'end' : 'middle' });
      label.textContent = new Date(this.candles[index].timestamp).toLocaleString('en-GB', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      svg.append(label);
    }
    this.container.replaceChildren(svg);
  }
}
