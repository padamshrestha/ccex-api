import { Observable, concat, ReplaySubject } from 'rxjs';
import { map, take, filter, scan } from 'rxjs/operators';

import { fetchRxjs } from '../../../common';
import { updateOrderbook } from '../../../helpers';
import { Orderbook } from '../../exchange-types';
import { getSymbol } from '../bitfinex-common';
import { BitfinexWebsocket, getKey, WebsocketRequestBase } from '../websocket';

import { adaptBitfinexOrderbook, getOrderbookApiUrl } from './internal/functions';
import { BitfinexOrderbookSingleItem } from './internal/types';

export class BitfinexOrderbook {
  private readonly keyOderbookStreamMap: { [key: string]: ReplaySubject<Orderbook> } = {};

  /**
   * @param corsProxy
   * @param bitfinexWebsocket
   */
  constructor(private readonly corsProxy: string = '', private readonly bitfinexWebsocket: BitfinexWebsocket) {}

  fetchOrderbook$(pair: string, prec: string = 'P0'): Observable<Orderbook> {
    const originUrl = getOrderbookApiUrl(pair, prec);
    const url = this.corsProxy ? this.corsProxy + originUrl : originUrl;

    return fetchRxjs<BitfinexOrderbookSingleItem[]>(url).pipe(map(adaptBitfinexOrderbook));
  }

  orderbook$(pair: string, prec: string = 'P0', freq: string = 'F0', len: string = '25'): Observable<Orderbook> {
    const subscribeRequest = getOrderbookRequest(pair, prec, freq, len);

    const key = getKey(subscribeRequest);
    if (!this.keyOderbookStreamMap[key]) {
      this.keyOderbookStreamMap[key] = new ReplaySubject<Orderbook>(1);
      this.startOrderbook$(subscribeRequest).subscribe((orderbook) => this.keyOderbookStreamMap[key].next(orderbook));
    }

    return this.keyOderbookStreamMap[key].asObservable();
  }

  stopOrderbook(pair: string, prec: string = 'P0', freq: string = 'F0', len: string = '25'): void {
    const unsubscribeRequest = getOrderbookRequest(pair, prec, freq, len);

    const key = getKey(unsubscribeRequest);
    const subject = this.keyOderbookStreamMap[key];
    // complete and delete subject
    if (subject) {
      subject.complete();
      delete this.keyOderbookStreamMap[key];
    }
    this.bitfinexWebsocket.unsubscribe(unsubscribeRequest);
  }

  /**
   * Start subscribe to the orderbook for the first time
   * @param subscribeRequest
   */
  private startOrderbook$(subscribeRequest: WebsocketRequestBase): Observable<Orderbook> {
    const orderbookSnapshotAndUpdate$ = this.bitfinexWebsocket.subscribe<BitfinexOrderbookSingleItem[] | BitfinexOrderbookSingleItem>(
      subscribeRequest,
    );

    // snapshot (array of items) come at first
    const orderbookSnapshot$ = orderbookSnapshotAndUpdate$.pipe(
      filter((snapshot) => !!snapshot && !!snapshot.length),
      map((snapshot: any) => {
        // this case is not expected (1 item come instead of array),
        // this happens when the stream is hot because ws channel already subscribed before so only update come,
        // in that case consider single updating item as snapshot
        // if (typeof snapshot[0] === 'number') {
        //   snapshot = [snapshot];
        // }

        return <BitfinexOrderbookSingleItem[]>snapshot;
      }),
      map(adaptBitfinexOrderbook),
      take(1),
    );

    // orderbook updates,
    // TODO buffer some changes in 1 second into 1 to improve performance ?
    const orderbookUpdate$ = orderbookSnapshotAndUpdate$.pipe(
      filter((orderbookItem) => !!orderbookItem && orderbookItem.length > 0 && typeof orderbookItem[0] === 'number'),
      map((orderbookItem) => adaptBitfinexOrderbook(<BitfinexOrderbookSingleItem[]>[orderbookItem])),
    );

    return concat(orderbookSnapshot$, orderbookUpdate$).pipe(scan(updateOrderbook));
  }
}

function getOrderbookRequest(pair: string, prec: string = 'P0', freq: string = 'F0', len: string = '25'): WebsocketRequestBase {
  return {
    channel: 'book',
    symbol: getSymbol(pair),
    prec,
    freq,
    len,
  };
}
