# inspector-gadget 🕵🗜⚙

[![NPM version][inspector-gadget-npm-image]][inspector-gadget-npm-url]
[![MIT License][license-image]][license-url]
[![fliphub][gitter-badge]][gitter-url]
[![flipfam][flipfam-image]][flipfam-url]

[inspector-gadget-npm-image]: https://img.shields.io/npm/v/inspector-gadget.svg
[inspector-gadget-npm-url]: https://npmjs.org/package/inspector-gadget
[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: https://spdx.org/licenses/MIT
[gitter-badge]: https://img.shields.io/gitter/room/fliphub/pink.svg
[gitter-url]: https://gitter.im/fliphub/Lobby
[flipfam-image]: https://img.shields.io/badge/%F0%9F%8F%97%20%F0%9F%92%A0-flipfam-9659F7.svg
[flipfam-url]: https://www.npmjs.com/package/flipfam


![https://github.com/fliphub/fliphub]( https://cloud.githubusercontent.com/assets/4022631/24534601/e748baf2-1583-11e7-897b-d9707e3bcf53.png)



> preconfigured nodejs util for inspecting, and customizing inspecting

## inspectorGadget 🗜
configure what is exposed when inspecting

```js
const {inspectorGadget} = require('inspector-gadget')
class Eh {
  constructor() {
    this.inspect = inspectorGadget(this, ['property-to-ignore'])
  }
}
```

## inspector 🕵
```js
const {inspector} = require('inspector-gadget')
const inspected = inspector({
  some: {
    super: {
      deep: {
        data: {
          with: {
            colors: function() {
              this.array = ['with inspection with colors pre configured']
            }
          }
        }
      }
    }
  }
})
console.log(inspected)
```

## custom ⚙
```js
const {custom} = require('inspector-gadget')

// disables
custom(false)

// re-enables
custom(true)

// changes to your value, be careful.
custom(() => {})
```

### options
- if it fails to inspect, it will [javascript-stringify](https://www.npmjs.com/package/javascript-stringify)
- second arg is a number, how deep you want to go (default 30)
- 3rd arg is options to override pre-configured [nodejs util inspect options](https://nodejs.org/api/util.html#util_util_inspect_object_options)
- it also exports `util`, for your convenience in destructuring
