export declare type OnOpenFn = (client: SocketClient) => void;
export declare class SocketClient {
    url: string;
    authSent: boolean;
    emitter: any;
    client: WebSocket;
    constructor(opts: any);
    reconnect(fn: any): void;
    on(event: any, fn: any): void;
    connect(fn?: OnOpenFn): void;
    close(): void;
    send(eventName: any, data: any): void;
    private error;
    /** Wires up the socket client messages to be emitted on our event emitter */
    private bindEvents;
}
