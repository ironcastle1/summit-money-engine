import { compactNumber, marketPrice, percent, probability, score, wholeNumber } from './market-format.js';

function put(selector, value, className = '') {
  const element = document.querySelector(selector);
  if (!element) return;
  element.textContent = value;
  element.classList.remove('positive', 'negative', 'warning');
  if (className) element.classList.add(className);
}

export class MarketMetricPanel {
  render(analysis) {
    const asset = analysis?.asset || {};
    const outcome = analysis?.outcomes?.[0] || {};
    put('#market-detail-symbol', asset.symbol || 'N/A');
    put('#market-detail-name', asset.name || analysis?.reason || 'NO ANALYSIS');
    put('#market-detail-price', marketPrice(analysis?.quote?.price, asset.quoteCurrency));
    put('#market-detail-change', percent(analysis?.quote?.change24h, 2, true), (analysis?.quote?.change24h || 0) >= 0 ? 'positive' : 'negative');
    put('#market-rise-probability', probability(outcome.riseProbability), outcome.riseProbability >= 0.5 ? 'positive' : 'negative');
    put('#market-probability-range', Number.isFinite(outcome.probabilityRange90?.lower) ? `${probability(outcome.probabilityRange90.lower)}–${probability(outcome.probabilityRange90.upper)}` : 'N/A');
    put('#market-median-return', percent(outcome.medianReturn, 2, true), (outcome.medianReturn || 0) >= 0 ? 'positive' : 'negative');
    put('#market-return-range', Number.isFinite(outcome.returnRange80?.lower) ? `${percent(outcome.returnRange80.lower, 1)} / ${percent(outcome.returnRange80.upper, 1)}` : 'N/A');
    put('#market-opportunity-score', score(analysis?.opportunity?.score));
    put('#market-risk-score', score(analysis?.risk?.score));
    put('#market-confidence', score(outcome.confidence));
    put('#market-sample-size', `N=${wholeNumber(outcome.sampleSize)}`);
    put('#market-regime', analysis?.regime?.trend || 'N/A');
    put('#market-volatility', analysis?.regime?.volatility?.replaceAll('_', ' ') || 'N/A');
    put('#market-rsi', Number.isFinite(analysis?.feature?.rsi14) ? analysis.feature.rsi14.toFixed(1) : 'N/A');
    put('#market-atr', percent(analysis?.feature?.atrPct, 2));
    put('#market-volume', compactNumber(analysis?.quote?.quoteVolume24h));
    put('#market-source', analysis?.source?.candles?.id?.toUpperCase() || 'N/A');
    put('#market-candle-count', wholeNumber(analysis?.candleCount));
    put('#market-history', analysis?.firstCandleAt ? `${new Date(analysis.firstCandleAt).toLocaleDateString('en-GB')}–${new Date(analysis.lastCandleAt).toLocaleDateString('en-GB')}` : 'N/A');
  }
}
