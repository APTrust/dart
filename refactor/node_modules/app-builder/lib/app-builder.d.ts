import { compose, Middleware, ComposedMiddleware, Next } from './compose';
import { PromiseConfig } from './promise';
export declare class AppBuilder<T> {
    private middleware;
    build(): ComposedMiddleware<T>;
    use(mw: Middleware<T>): this;
}
export default function createAppBuilder<T>(): AppBuilder<T>;
export { compose, Middleware, Next, ComposedMiddleware, PromiseConfig };
