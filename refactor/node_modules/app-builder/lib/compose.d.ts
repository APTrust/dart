export interface Next<T> {
    (context?: T, next?: Next<T>): Promise<any> | any;
}
export interface ComposedMiddleware<T> {
    (context: T, next?: Middleware<T>): Promise<any> | any;
}
export interface Middleware<T> {
    (context: T, next: Next<T>): Promise<any> | any;
}
export declare function compose<T>(...middleware: (Middleware<T> | Middleware<T>[])[]): ComposedMiddleware<T>;
