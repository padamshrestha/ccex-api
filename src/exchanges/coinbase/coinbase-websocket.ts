import { Observable, ReplaySubject, empty } from 'rxjs';

import { WebSocketRxJs } from '../../common/websocket-rxjs';
import { WebsocketRequest, WebsocketMessageResponse } from './coinbase-common.types';
import { websocketEndpoint } from './coinbase-common';

export class CoinbaseWebsocket {
  private websocket: WebSocketRxJs<WebsocketMessageResponse>;
  private keyStreamMap: {[key: string]: ReplaySubject<any>} = {};

  constructor() {}

  /**
   * allow only 1 product and 1 channel for each subscribe
   * @param subscribeRequest
   * {"type":"subscribe","product_ids":["BTC-USD"],"channels":["ticker"]}
   */
  subscribe<T>(subscribeRequest: WebsocketRequest): Observable<T> {
    if (!this.websocket) {
      this.initWebsocket();
    }

    if (subscribeRequest.type !== 'subscribe') {
      return empty();
    }

    const key = getKeyFromRequest(subscribeRequest);
    if (!this.keyStreamMap[key]) {
      this.keyStreamMap[key] = new ReplaySubject<T>(1);
      this.websocket.send(JSON.stringify(subscribeRequest));
    }

    return this.keyStreamMap[key].asObservable();
  }

  /**
   * 
   * @param unsubscribeRequest
   * {"type":"unsubscribe","product_ids":["BTC-USD"],"channels":["ticker"]}
   */
  unsubscribe(unsubscribeRequest: WebsocketRequest): void {
    if (!this.websocket) {
      return;
    }

    if (unsubscribeRequest.type !== 'unsubscribe') {
      return;
    }

    this.websocket.send(JSON.stringify(unsubscribeRequest));
    const key = getKeyFromRequest(unsubscribeRequest);
    delete this.keyStreamMap[key];
  }

  private initWebsocket() {
    if (this.websocket) {
      throw new Error('Coinbase websocket is already initialized');
    }

    this.websocket = new WebSocketRxJs(websocketEndpoint);
    this.websocket.message$.subscribe((response: any) => {
      if (response.type && response.product_id) {
        const messageResponse = <WebsocketMessageResponse>response;
        const key = getKeyFromResponse(messageResponse);
        if (this.keyStreamMap[key]) {
          this.keyStreamMap[key].next(messageResponse);
        }
      }
    });
  }
}

function getKeyFromRequest(request: WebsocketRequest): string {
  return request.channels[0] + request.product_ids[0];
}

function getKeyFromResponse(response: WebsocketMessageResponse): string {
  return response.type + response.product_id;
}
