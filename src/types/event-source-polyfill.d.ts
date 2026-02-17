declare module "event-source-polyfill" {
  export type EventSourcePolyfillInit = EventSourceInit & {
    headers?: Record<string, string>;
    heartbeatTimeout?: number;
  };

  export class EventSourcePolyfill extends EventSource {
    constructor(url: string, eventSourceInitDict?: EventSourcePolyfillInit);
  }

  export const NativeEventSource: typeof EventSource;
}
