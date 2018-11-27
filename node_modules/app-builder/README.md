# app-builder

Create composable promise based middleware pipelines.

`npm install app-builder`

[![circle-ci](https://circleci.com/gh/calebboyd/app-builder.png?style=shield)](https://circleci.com/gh/calebboyd/app-builder.png?style=shield)

## Example

```javascript
import { compose } from 'app-builder'

const app = compose([
  async function (ctx, next) {
    ctx.value += 1
    await next()
    ctx.value += 4
  },
  async function (ctx, next) {
    ctx.value += 2
    await next()
    ctx.value += 3
  }
]);

const context = { value: '' }
app(context).then(() => console.log(context.value)) // --> '1234'

```

This module has the following TypeScript definition, containing 2 named exports and default factory export.
As well as a Middleware interface definition
```typescript
declare module 'app-builder' {

  export default function createAppBuilder<T>() : AppBuilder<T> 

  export class AppBuilder<T> {
    use(middleware: Middleware<T>): AppBuilder<T>
    build(): Middleware<T>
  }

  export function compose<T> (middleware: Array<Middleware<T>|Array<Middleware<T>>) : Middleware<T>

  export interface Middleware<T> {
    (context?: T, next?: Middleware<T>): any
}
```
