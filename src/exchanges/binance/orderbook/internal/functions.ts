import { Orderbook } from '../../../exchange-types';
import { apiEndPoint, wsEndpoint, binancePair } from '../../binance-common';
import { BinanceRawWsOrderbook } from './types';

// orderbook rest api url
export function binanceOrderbookApiUrl(pair: string, limit: number = 20): string {
  const symbol = binancePair(pair).toUpperCase();

  return `${apiEndPoint}/api/v1/depth?limit=${limit}&symbol=${symbol}`;
}

// orderbook ws channel
export function binanceOrderbookChannel(pair: string): string {
  return `${wsEndpoint}/${binancePair(pair)}@depth`;
}

// adapt socket orderbook
export function adaptBinanceWsOrderbook(binanceOrderbook: BinanceRawWsOrderbook): Orderbook {
  return {
    bids: binanceOrderbook.b,
    asks: binanceOrderbook.a,
    lastUpdateId: binanceOrderbook.u,
  };
}
