import path from 'node:path';
import { LiveDataPlatform } from '../live-data/live-data-platform.js';
import { LiveSnapshotStore } from '../live-data/snapshot-store.js';
import { EventRegistryConnector } from '../live-data/connectors/event-registry-connector.js';
import { NewsRegistryConnector } from '../live-data/connectors/news-registry-connector.js';
import { MacroConnector } from '../live-data/connectors/macro-connector.js';
import { PredictionConnector } from '../live-data/connectors/prediction-connector.js';
import { EcbFxConnector } from '../live-data/connectors/ecb-fx-connector.js';
import { UnSanctionsConnector } from '../live-data/connectors/un-sanctions-connector.js';
import { WorldBankCoreConnector } from '../live-data/connectors/world-bank-core-connector.js';
import { PortWatchCatalogConnector } from '../live-data/connectors/portwatch-catalog-connector.js';
import { CoinbasePublicConnector, BinancePublicConnector } from '../live-data/connectors/public-market-connectors.js';
import { NoaaCoopsConnector, NdbcObservationConnector } from '../live-data/connectors/shipping-observation-connectors.js';
import { UnComtradePublicConnector } from '../live-data/connectors/un-comtrade-public-connector.js';

export async function createLiveDataPlatformService(options = {}) {
  const store = new LiveSnapshotStore({
    filePath: path.resolve(options.rootDir, options.config.liveData.dataFile)
  });
  const platform = new LiveDataPlatform({
    store,
    logger: options.logger,
    enabled: options.config.liveData.enabled,
    autoStart: options.config.liveData.autoStart,
    refreshMs: options.config.liveData.refreshMs,
    timeoutMs: options.config.liveData.timeoutMs,
    concurrency: options.config.liveData.concurrency
  });

  platform.register('events-core', new EventRegistryConnector({ registry: options.registry }));
  platform.register('news-core', new NewsRegistryConnector({
    registry: options.newsRegistry,
    sources: ['gdelt', 'rss']
  }));
  platform.register('nasa-eonet', new EventRegistryConnector({
    registry: options.registry,
    sourceIds: ['eonet']
  }));
  platform.register('gdacs', new EventRegistryConnector({
    registry: options.registry,
    sourceIds: ['gdacs']
  }));
  platform.register('uk-floods', new EventRegistryConnector({
    registry: options.registry,
    sourceIds: ['uk-floods']
  }));
  platform.register('nws-alerts', new EventRegistryConnector({
    registry: options.registry,
    sourceIds: ['nws-alerts']
  }));

  platform.register('fred-graph', new MacroConnector({ service: options.macroMarkets }));
  platform.register('polymarket', new PredictionConnector({ service: options.predictionMarkets }));
  platform.register('ecb-fx', new EcbFxConnector({
    http: options.http,
    url: options.config.liveData.ecbFxUrl
  }));
  platform.register('coinbase-public', new CoinbasePublicConnector({
    http: options.http,
    baseUrl: options.config.liveData.coinbaseBaseUrl
  }));
  platform.register('binance-public', new BinancePublicConnector({
    http: options.http,
    baseUrl: options.config.liveData.binanceBaseUrl
  }));
  platform.register('un-sanctions', new UnSanctionsConnector({
    http: options.http,
    url: options.config.liveData.unSanctionsUrl
  }));

  const worldBank = options.intelligenceRegistry.get('world-bank');
  if (worldBank) {
    platform.register('world-bank', new WorldBankCoreConnector({
      source: worldBank,
      countries: options.config.liveData.countries
    }));
  }

  platform.register('imf-portwatch-catalog', new PortWatchCatalogConnector({
    http: options.http,
    baseUrl: options.config.liveData.portWatchCatalogUrl
  }));

  const noaaCoops = options.shippingRegistry.get('noaa-coops');
  if (noaaCoops) {
    platform.register('noaa-coops', new NoaaCoopsConnector({
      source: noaaCoops,
      catalog: options.shippingCatalog,
      limit: options.config.liveData.marinePortLimit
    }));
  }
  const ndbc = options.shippingRegistry.get('noaa-ndbc');
  if (ndbc) {
    platform.register('noaa-ndbc', new NdbcObservationConnector({
      source: ndbc,
      catalog: options.shippingCatalog,
      limit: options.config.liveData.marinePortLimit
    }));
  }
  const comtrade = options.shippingRegistry.get('un-comtrade');
  if (comtrade) {
    platform.register('un-comtrade', new UnComtradePublicConnector({ source: comtrade }));
  }

  await platform.initialize();
  return platform;
}
