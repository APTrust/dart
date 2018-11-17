# realm-utils

Realm-js has a set of functionality that helps solving many problems or impediments related to Promises.
Utilities live in this repository, apart from realm-js library. Typings included
### Install


```bash
npm install realm-utils --save
```

```js
import {each, chain, Chainable, utils} from 'realm-utils'; // typescript
const rutils = require('realm-utils'); // es6
```
### Each
Iterates a list of promises (objects) consecutively. Respects promises if provided
```js
var a = [1, 2, 3];
realm.each(a, (num) => {
  return new Promise((resolve, reject) => {
    setTimeout(function(){
      return resolve(num++)
    }, num);
  })
}).then(result => {
   // [2,3,4]
});
```

And another example with optional Promise
```js
realm.each(a, (num) => {
  if( num ===3) {
    return new Promise((resolve, reject) => {
      setTimeout(function(){
        return resolve("gotcha")
      }, 1);
    })
  }
  return num;
}).then(result => {
  // [1, 2, "gotcha"]
})
```

### Chains

Chain are very helpful when you have a logic flow, and you need to split it up, and keep you code clean.
All methods are executed in strict order. You can call it a waterfall. 
```js
class MyChain {
   
   setFoo() {
      // I am the first one. And i set this.foo = "foo1"
      return "foo1";
   }
   setBar() {
      // I am the second one, and i have "this.foo" at my disposal
      // And i set this.bar = "bar1"
      return "bar1";
   }
   justSomethingFunky()
   {
     // I am the third one, and everyone will wait for me
     let self = this;
     return new Promise(function(resolve, reject){
        // But i will not assign anything
        // Just have to resolve myself
        return resolve(self.bar)
     })
   }
   setHello()
   {
      // I am the last to be executed, and i will assign this.hello = "world"
      return "world";
   }
}
realm.chain(MyChain).then(function(result){
   // {foo : "foo1", bar : "bar1", hello: "world" }   
});
```

Executes methods in defined order. If a setter is defined, realm will assign the result into the instance of a class.

## Formatting the output

You can format the output as well using "format" method.
```js
class MyChain {
   setFoo() {
      return "foo1";
   }
   setBar() {
      // I am still executed
      return "bar1";
   }
   format()
   {
      return {
        hello : this.foo
      }
   }
}
realm.chain(MyChain).then(function(result){
     // {hello : "foo1" }   
});
```
