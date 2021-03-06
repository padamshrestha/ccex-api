import { Observable, EMPTY } from 'rxjs';

import { ExchangeApi } from '../exchange-api.abstract';
import { ExchangeInfo, SupportFeatures, Ticker, Orderbook, Trade, CandleStick } from '../exchange-types';
import { SampleTicker } from './ticker/sample-ticker';

export class SampleApi extends ExchangeApi {
  private readonly sampleTicker: SampleTicker;

  get exchangeInfo(): ExchangeInfo {
    return {
      name: 'sample',
      logoUrl: 'https://sample-logo.png',
      homepage: 'https://www.sample.com/',
      country: 'Exchange country',
    };
  }

  get markets(): string[] {
    return ['btc_jpy'];
  }

  get representativeMarkets(): string[] {
    return ['btc_jpy'];
  }

  get supportFeatures(): SupportFeatures {
    return {
      ticker: false,
      orderbook: false,
      chart: false,
    };
  }

  constructor() {
    super();
    this.sampleTicker = new SampleTicker();
  }

  // api request for ticker
  fetchTicker$(pair: string): Observable<Ticker> {
    return this.sampleTicker.fetchTicker$(pair);
  }

  // realtime ticker
  ticker$(pair: string): Observable<Ticker> {
    return this.sampleTicker.ticker$(pair);
  }

  // stop realtime ticker
  stopTicker(pair: string): void {
    this.sampleTicker.stopTicker(pair);
  }

  // api request for depth
  fetchOrderbook$(pair: string): Observable<Orderbook> {
    return EMPTY;
  }

  // realtime depth
  orderbook$(pair: string): Observable<Orderbook> {
    return EMPTY;
  }

  // stop realtime orderbook
  stopOrderbook(pair: string): void {
    // implement
  }

  fetchTrades$(pair: string): Observable<Trade[]> {
    return EMPTY;
  }

  trade$(pair: string): Observable<Trade> {
    return EMPTY;
  }

  // stop realtime trade
  stopTrade(pair: string): void {
    // implement
  }

  // request candlestick by time range and resolution
  fetchCandleStickRange$(pair: string, minutesFoot: number, start: number, end: number): Observable<CandleStick[]> {
    return EMPTY;
  }
}
