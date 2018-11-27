'use strict';

var iterator = Symbol.iterator;

var instance = Symbol.hasInstance;

var primative = Symbol.toPrimitive;

// @TODO use build script with .replace for each
// const isNode =
//   typeof process === 'object' &&
//   typeof process.release === 'object' &&
//   process.release.name === 'node'
//
// if (isNode) {
//   module.exports = require('./Chainable.node')
// }
// else {
//   module.exports = require('./Chainable.all')
// }





var F = Function.prototype;

/**
 * @type {Chainable}
 * @prop {Chainable | any} parent
 * @prop {string} className
 * @prop {Array<Class|Object> | null} mixed
 */
var Chainable = function Chainable(parent) {
  if (parent) { this.parent = parent; }
  this.className = this.constructor.name;
};

/**
 * @NOTE assigned to a variable so buble ignores it
 * @since 0.5.0
 * @example for (var [key, val] of chainable) {}
 * @example
 ** [Symbol.iterator](): void { for (const item of this.store) yield item }
 * @see https://github.com/sindresorhus/quick-lru/blob/master/index.js
 * @see https://stackoverflow.com/questions/36976832/what-is-the-meaning-of-symbol-iterator-in-this-context
 * @see this.store
 * @type {generator}
 * @return {Object} {value: undefined | any, done: true | false}
 */
Chainable.prototype[iterator] = function () {
  var entries = this.entries ? this.entries() : false;
  var values = this.values();
  var size = this.store.size;
  var keys = entries === false ? new Array(size) : Object.keys(entries);

  return {
    i: 0,
    next: function next() {
      var i = this.i;
      var key = i;
      var val = values[i];
      if (entries) { key = keys[i]; }

      // done - no more values, or iteration reached size
      if ((key === undefined && val === undefined) || size <= i) {
        return {value: undefined, done: true}
      }

      this.i++;

      // return
      return {value: [key, val], done: false}
    },
  }
};

/**
 * @NOTE could just do chain.values().forEach...
 * @desc loop over values
 * @since 1.0.2
 * @param {Function} cb
 * @return {Chainable} @chainable
 */
// forEach(cb) {
// this.values().forEach(cb, this)
// return this
// }

/**
 * @since 1.0.2
 * @desc
 *    checks mixins,
 *    checks prototype,
 *    checks if it has a store
 *    or parent or className
 *
 * @example new Chainable() instanceof Chainable
 * @type {Symbol.wellknown}
 * @param {Chainable | Object | any} instance
 * @return {boolean} instanceof
 */
Chainable.prototype[instance] = function (instance$$1) {
  return Chainable[instance](instance$$1, this)
};

/**
 * @since 0.4.0
 * @see Chainable.parent
 * @return {Chainable | any}
 */
Chainable.prototype.end = function end () {
  return this.parent
};

/**
 * @description
 *when the condition is true,
 *trueBrancher is called,
 *else, falseBrancher is called
 *
 * @example
 *const prod = process.env.NODE_ENV === 'production'
 *chains.when(prod, c => c.set('prod', true), c => c.set('prod', false))
 *
 * @param{boolean} condition
 * @param{Function} [trueBrancher=Function.prototype] called when true
 * @param{Function} [falseBrancher=Function.prototype] called when false
 * @return {ChainedMap}
 */
Chainable.prototype.when = function when (condition, trueBrancher, falseBrancher) {
    if ( trueBrancher === void 0 ) trueBrancher = F;
    if ( falseBrancher === void 0 ) falseBrancher = F;

  if (condition) {
    trueBrancher(this);
  }
  else {
    falseBrancher(this);
  }

  return this
};

/**
 * @since 0.3.0
 * @return {Chainable}
 */
Chainable.prototype.clear = function clear () {
  this.store.clear();
  return this
};

/**
 * @since 0.3.0
 * @description calls .delete on this.store.map
 * @param {string | any} key
 * @return {Chainable}
 */
Chainable.prototype.delete = function delete$1 (key) {
  this.store.delete(key);
  return this
};

/**
 * @since 0.3.0
 * @example if (chain.has('eh') === false) chain.set('eh', true)
 * @param {any} value
 * @return {boolean}
 */
Chainable.prototype.has = function has (value) {
  return this.store.has(value)
};

/**
 * @since 0.4.0
 * @NOTE: moved from ChainedMap and ChainedSet to Chainable @2.0.2
 * @NOTE: this was [...] & Array.from(this.store.values())
 * @see https://kangax.github.io/compat-table/es6/#test-Array_static_methods
 * @see https://stackoverflow.com/questions/20069828/how-to-convert-set-to-array
 * @desc spreads the entries from ChainedMap.store.values
 * @return {Array<any>}
 */
Chainable.prototype.values = function values () {
  var vals = [];
  this.store.forEach(function (v) { return vals.push(v); });
  return vals
};

/**
 * @see http://2ality.com/2015/09/well-known-symbols-es6.html#default-tostring-tags
 * @since 1.0.2
 * @example chain + 1 (calls this)
 * @param {string} hint
 * @return {Primative}
 */
Chainable.prototype[primative] = function (hint) {
    var this$1 = this;

  if (hint === 'number' && this.toNumber) {
    return this.toNumber()
  }
  else if (hint === 'string' && this.toString) {
    return this.toString()
  }
  else if (this.getContents !== undefined) {
    var content = this.getContents();
    if (typeof content === 'string') { return content }
  }

  // default:
  // if (this.valueOf) return this.valueOf(hint)
  var methods = [
    'toPrimative',
    'toNumber',
    'toArray',
    'toJSON',
    'toBoolean',
    'toObject' ];
  for (var m = 0; m < methods.length; m++) {
    if (this$1[methods[m]] !== undefined) {
      return this$1[methods[m]](hint)
    }
  }

  return this.toString()
};

function define(Chain) {
  /**
   * @since 0.5.0
   * @example for (var i = 0; i < chain.length; i++)
   * @see ChainedMap.store
   * @return {number}
   */
  Object.defineProperty(Chain, 'length', {
    configurable: true,
    enumerable: false,
    get: function get() {
      return this.store.size
    },
  });
  Object.defineProperty(Chain, instance, {
    configurable: true,
    enumerable: false,
    // writable: false,
    value: function (instance$$1, thisArg) {
      // @NOTE depreciated mixins because of speed, but will use this elsewhere
      // if (thisArg && thisArg.mixed !== undefined) {
      //   for (let m = 0; m < thisArg.mixed.length; m++) {
      //     const mixin = thisArg.mixed[m]
      //     if (mixin && typeof mixin === 'object' && instance instanceof mixin) {
      //       return true
      //     }
      //   }
      // }

      return (
        instance$$1 &&
        (Object.prototype.isPrototypeOf.call(instance$$1, Chain) ||
          !!instance$$1.className ||
          !!instance$$1.parent ||
          !!instance$$1.store)
      )
    },
  });
}

define(Chainable);
define(Chainable.prototype);

var Chainable_1 = Chainable;

// https://github.com/sindresorhus/is-obj/blob/master/index.js
var pureObj = function (x) { return x !== null && typeof x === 'object'; };

var array = Array.isArray;

var toS = function (obj) { return Object.prototype.toString.call(obj); };

var ezType = function (x) { return (array(x) ? 'array' : typeof x); };

// @TODO convert forEach for faster loops
function isMergeableObj(val) {
  return (
    // not null object
    pureObj(val) &&
    // object toString is not a date or regex
    !['[object RegExp]', '[object Date]'].includes(toS(val))
  )
}

function emptyTarget(val) {
  return array(val) ? [] : {}
}
function cloneIfNeeded(value, optsArg) {
  return optsArg.clone === true && isMergeableObj(value)
    ? deepmerge(emptyTarget(value), value, optsArg)
    : value
}

function defaultArrayMerge(target, source, optsArg) {
  var destination = target.slice();
  source.forEach(function (v, i) {
    if (typeof destination[i] === 'undefined') {
      destination[i] = cloneIfNeeded(v, optsArg);
    }
    else if (isMergeableObj(v)) {
      destination[i] = deepmerge(target[i], v, optsArg);
    }
    else if (target.indexOf(v) === -1) {
      destination.push(cloneIfNeeded(v, optsArg));
    }
  });
  return destination
}

function mergeObj(target, source, optsArg) {
  var destination = {};
  if (isMergeableObj(target)) {
    Object.keys(target).forEach(function (key) {
      destination[key] = cloneIfNeeded(target[key], optsArg);
    });
  }
  Object.keys(source).forEach(function (key) {
    if (!isMergeableObj(source[key]) || !target[key]) {
      destination[key] = cloneIfNeeded(source[key], optsArg);
    }
    else {
      destination[key] = deepmerge(target[key], source[key], optsArg);
    }
  });
  return destination
}

function deepmerge(target, source, optsArg) {
  if (array(source)) {
    var arrayMerge = optsArg.arrayMerge;
    return array(target)
      ? arrayMerge(target, source, optsArg)
      : cloneIfNeeded(source, optsArg)
  }

  // else
  return mergeObj(target, source, optsArg)
}

// unused
// @TODO options for merging arr, and on any type combo
// const todoOpts = {
//   // when: { left(cb), right(cb) }
//   // whenLeft(cb): {}
//   objToArr: false, // not implemented
//   stringConcat: false, // not implemented
//   numberOperation: "+ * ^ toarr cb",
//   promises... wait until finished then call merge???
//   boolPrefer: 0, 1, true, false
// }

function eqq(arr1, arr2) {
  return arr1[0] === arr2[0] && arr1[1] === arr2[1]
}

function eqCurry(types) {
  return eqq.bind(null, types)
}

function getDefaults() {
  return {
    arrayMerge: defaultArrayMerge,
    stringToArray: true,
    boolToArray: false,
    boolAsRight: true,
    ignoreTypes: ['null', 'undefined', 'NaN'],
    debug: true,
  }
}

// eslint-disable-next-line complexity
function dopemerge(obj1, obj2, opts) {
  if ( opts === void 0 ) opts = {};

  // if they are identical, fastest === check
  if (obj1 === obj2) { return obj1 }

  // setup options
  var options = Object.assign(getDefaults(), opts);
  var ignoreTypes = options.ignoreTypes;
  var stringToArray = options.stringToArray;
  var boolToArray = options.boolToArray;
  var clone = options.clone;

  var types = [ezType(obj1), ezType(obj2)];

  // check one then check the other
  // @TODO might want to push undefined null nan into array but...
  if (ignoreTypes.includes(types[0]) === true) { return obj2 }
  if (ignoreTypes.includes(types[1]) === true) { return obj1 }

  var eq = eqCurry(types);

  // check types to prefer
  switch (true) {
    case eq(['boolean', 'boolean']): {
      return boolToArray ? [obj1, obj2] : obj2
    }
    case eq(['string', 'string']): {
      return stringToArray ? [obj1, obj2] : obj1 + obj2
    }
    case eq(['array', 'string']): {
      return (clone ? obj1.slice(0) : obj1).concat([obj2])
    }
    case eq(['string', 'array']): {
      return (clone ? obj2.slice(0) : obj2).concat([obj1])
    }
    default: {
      return deepmerge(obj1, obj2, options)
    }
  }
}

var dopemerge_1 = dopemerge;

var _function = function (x) { return typeof x === 'function'; };

/**
 * @since 1.0.0
 * @type {Map}
 */
var MergeChain = (function (Chainable) {
  function MergeChain(parent) {
    var this$1 = this;

    Chainable.call(this, parent);
    this.store = new Map();
    this.set = function (name, val) {
      this$1.store.set(name, val);
      return this$1
    };

    this.set('onValue', function () { return true; }).set('merger', dopemerge_1);
    this.get = function (name) { return this$1.store.get(name); };
  }

  if ( Chainable ) MergeChain.__proto__ = Chainable;
  MergeChain.prototype = Object.create( Chainable && Chainable.prototype );
  MergeChain.prototype.constructor = MergeChain;

  /**
   * @since 1.0.0
   * @desc can pass in a function same as .merge,
   *       but say, .set instead of merge
   *
   * @param  {Function} cb
   * @return {MergeChain} @chainable
   */
  MergeChain.init = function init (parent) {
    return new MergeChain(parent)
  };

  MergeChain.prototype.onExisting = function onExisting (cb) {
    return this.set('onExisting', cb)
  };

  /**
   * @since 1.0.1
   * @desc can pass in a function to check values, such as ignoring notReal
   * @example .onValue(val => val !== null && val !== undefined)
   * @param  {Function} cb
   * @return {MergeChain} @chainable
   */
  MergeChain.prototype.onValue = function onValue (cb) {
    return this.set('onValue', cb)
  };

  /**
   * @since 1.0.2
   * @desc for using custom callback
   * @param  {Object} obj
   * @return {MergeChain} @chainable
   */
  MergeChain.prototype.obj = function obj (obj$1) {
    return this.set('obj', obj$1)
  };

  /**
   * @since 1.0.2
   * @desc options for merging with dopemerge
   *       @modifies this.merger | this.opts
   * @param  {Object | Function} opts
   * @return {MergeChain} @chainable
   *
   * @example
   * {
   *   stringToArray: true,
   *   boolToArray: false,
   *   boolAsRight: true,
   *   ignoreTypes: ['null', 'undefined', 'NaN'],
   *   debug: false,
   * }
   *
   * @example
   *  .merger(require('lodash.mergewith')())
   */
  MergeChain.prototype.merger = function merger (opts) {
    if (_function(opts)) { return this.set('merger', opts) }
    return this.set('opts', opts)
  };

  /**
   * @since 1.0.0
   *
   * @TODO issue here if we extend without shorthands &
   *       we want to merge existing values... :s
   *
   * @desc merges object in, goes through all keys, checks cbs, dopemerges
   * @param  {Object} obj2 object to merge in
   * @return {MergeChain} @chainable
   */
  MergeChain.prototype.merge = function merge (obj2) {
    var this$1 = this;

    var onExisting = this.get('onExisting');
    var onValue = this.get('onValue');
    var opts = this.get('opts') || {};
    var obj = this.has('obj') === true && !obj2 ? this.get('obj') : obj2 || {};
    var merger = this.get('merger');
    var sh = this.parent.shorthands || [];
    var keys = Object.keys(obj);

    // @TODO do this
    // if (obj2 instanceof Chainable) {
    //   // is map
    //   if (obj2.entries) obj2 = obj2.entries()
    //   // set, much easier to merge
    //   // else if (obj2.values)
    // }
    // @TODO isEqual here?
    //
    // @NOTE
    // since this would be slower
    // if I want to not have a speedy default when using .onExisting
    // need to note to use .extend
    // when using chains without a class & doing .merge (edge-case)
    var handleExisting = function (key, value) {
      // when fn is a full method, not an extended shorthand
      var hasFn = _function(this$1.parent[key]);
      var hasKey = this$1.parent.has(key);
      var set = function (k, v) { return (hasFn ? this$1.parent[k](v) : this$1.parent.set(k, v)); };

      // check if it is shorthanded
      // has a value already
      if (hasKey === true) {
        // get that value
        var existing = this$1.parent.get(key);

        // if we have a cb, call it
        // default to dopemerge
        if (onExisting === undefined) {
          // console.log('no onExisting', {existing, value, key})
          set(key, merger(existing, value, opts));
        }
        else {
          // maybe we should not even have `.onExisting`
          // since we can just override merge method...
          // and then client can just use a custom merger...
          //
          // could add and remove subscriber but that's overhead and ug
          // tricky here, because if we set a value that was just set...
          // console.log('has onExisting', {existing, value, key, onExisting})
          set(key, onExisting(existing, value, opts));
        }
      }
      else {
        set(key, value);
      }
    };

    for (var k = 0, len = keys.length; k < len; k++) {
      var key = keys[k];
      var value = obj[key];
      var method = this$1.parent[key];

      // use onValue when set
      if (!onValue(value, key, this$1)) {
        // console.log('used onValue returning false')
        continue
      }
      else if (method instanceof Chainable) {
        // when property itself is a Chainable
        this$1.parent[key].merge(value);
      }
      else if (method || sh.includes(key)) {
        // console.log('has method or shorthand')
        handleExisting(key, value);
      }
      else {
        // console.log('went to default')
        // default to .set on the store
        this$1.parent.set(key, value);
      }
    }

    return this.parent
  };

  return MergeChain;
}(Chainable_1));

var MergeChain_1 = MergeChain;

var reduce = function (map) {
  var entries = Array.from(map.entries());

  var reduced = {};
  if (entries.length !== 0) {
    reduced = entries.reduce(function (acc, ref) {
      var key = ref[0];
      var value = ref[1];

      acc[key] = value;
      return acc
    }, {});
  }
  return reduced
};

// Object.prototype.toString.call(val) === '[object Object]' &&
var objWithKeys = function (val) { return toS(val) && Object.keys(val).length === 0; };

var map = function (obj) { return obj instanceof Map || toS(obj) === '[object Map]'; };

var real = function (x) { return x !== null && x !== undefined && !isNaN(x); };

var ignored = function (k) { return k === 'inspect' ||
  k === 'parent' ||
  k === 'store' ||
  k === 'shorthands' ||
  k === 'decorated' ||
  // k === 'transformers' ||
  k === 'className'; };

var isMapish = function (x) { return x && (x instanceof Chainable_1 || map(x)); };

// const keys = (obj, fn) => Object.keys(obj).forEach(fn)

/**
 * @tutorial https://ponyfoo.com/articles/es6-maps-in-depth
 * @tutorial https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Map
 * @inheritdoc
 * @type {Chainable}
 * @prop {Array} shorthands
 * @prop {Map} store
 */
var ChainedMap = (function (Chainable) {
  function ChainedMap(parent) {
    Chainable.call(this, parent);
    this.shorthands = [];
    this.store = new Map();

    // @TODO for wrapping methods to force return `this`
    // this.chainableMethods = []
  }

  if ( Chainable ) ChainedMap.__proto__ = Chainable;
  ChainedMap.prototype = Object.create( Chainable && Chainable.prototype );
  ChainedMap.prototype.constructor = ChainedMap;

  /**
   * @since 0.7.0
   * @see this.set, this.get
   * @desc   tap a value with a function
   *         @modifies this.store.get(name)
   *
   * @example
   *  chain
   *    .set('moose', {eh: true})
   *    .tap('moose', moose => {moose.eh = false; return moose})
   *    .get('moose') === {eh: false}
   *
   * @param  {string | any} name key to `.get`
   * @param  {Function} fn function to tap with
   * @return {Chain} @chainable
   */
  ChainedMap.prototype.tap = function tap (name, fn) {
    var old = this.get(name);
    var updated = fn(old, dopemerge_1);
    return this.set(name, updated)
  };

  /**
   * @since 0.5.0
   * @TODO needs improvements like parsing stringify
   *       since it is just .merge atm
   *
   * @desc checks each property of the object
   *       calls the chains accordingly
   *
   * @example chain.from({eh: true}) === chain.eh(true)
   *
   * @param {Object} obj
   * @return {Chainable} @chainable
   */
  ChainedMap.prototype.from = function from (obj) {
    var this$1 = this;

    Object.keys(obj).forEach(function (key) {
      var val = obj[key];

      if (this$1[key] && this$1[key].merge) {
        return this$1[key].merge(val)
      }
      if (_function(this$1[key])) {
        // const fnStr = typeof fn === 'function' ? fn.toString() : ''
        // if (fnStr.includes('return this') || fnStr.includes('=> this')) {
        return this$1[key](val)
      }

      return this$1.set(key, val)
    });
    return this
  };

  /**
   * @since 0.4.0
   * @desc shorthand methods, from strings to functions that call .set
   * @example this.extend(['eh']) === this.eh = val => this.set('eh', val)
   * @param  {Array<string>} methods
   * @return {ChainedMap}
   */
  ChainedMap.prototype.extend = function extend (methods) {
    var this$1 = this;

    methods.forEach(function (method) {
      this$1.shorthands.push(method);
      this$1[method] = function (value) { return this$1.set(method, value); };
    });
    return this
  };

  /**
   * @since 0.4.0
   * @desc clears the map,
   *       goes through this properties,
   *       calls .clear if they are instanceof Chainable or Map
   *
   * @see https://github.com/fliphub/flipchain/issues/2
   * @return {ChainedMap} @chainable
   */
  ChainedMap.prototype.clear = function clear () {
    var this$1 = this;

    this.store.clear();
    Object.keys(this).forEach(function (key) {
      /* prettier-ignore */
      ignored(key)
      ? 0
      : isMapish(this$1[key])
        ? this$1[key].clear()
        : 0;
    });

    return this
  };

  /**
   * @since 0.4.0
   * @desc spreads the entries from ChainedMap.store (Map)
   *       return store.entries, plus all chain properties if they exist
   * @param  {boolean} [chains=false] if true, returns all properties that are chains
   * @return {Object}
   */
  ChainedMap.prototype.entries = function entries (chains) {
    if ( chains === void 0 ) chains = false;

    var reduced = reduce(this.store);

    if (chains === false) { return reduced }

    var add = function (self) {
      Object.keys(self).forEach(function (k) {
        if (ignored(k)) { return }
        var val = self[k];
        if (val && _function(val.entries)) {
          Object.assign(reduced, ( obj = {}, obj[k] = val.entries(true) || {}, obj ));
          var obj;
        }
      });

      return {add: add, reduced: reduced}
    };

    return add(this).add(reduced).reduced
  };

  /**
   * @since 0.4.0
   * @example chain.set('eh', true).get('eh') === true
   * @param  {any} key
   * @return {any}
   */
  ChainedMap.prototype.get = function get (key) {
    return this.store.get(key)
  };

  /**
   * @see ChainedMap.store
   * @since 0.4.0
   * @desc sets the value using the key on store
   * @example chain.set('eh', true).get('eh') === true
   * @param {any} key
   * @param {any} value
   * @return {ChainedMap}
   */
  ChainedMap.prototype.set = function set (key, value) {
    this.store.set(key, value);
    return this
  };

  /**
   * @TODO needs to pass in additional opts somehow...
   * @see dopemerge, MergeChain
   * @since 0.4.0
   *       ...as second arg? on instance property?
   * @example chain.set('eh', [1]).merge({eh: [2]}).get('eh') === [1, 2]
   * @desc merges an object with the current store
   * @param {Object} obj object to merge
   * @param {Function | null} cb return the merger to the callback
   * @return {ChainedMap} @chainable
   */
  ChainedMap.prototype.merge = function merge (obj, cb) {
    if ( cb === void 0 ) cb = null;

    var merger = MergeChain_1.init(this);
    if (cb === null) {
      merger.merge(obj);
    }
    else {
      cb(merger.obj(obj));
    }
    return this
  };

  /**
   * @since 0.4.0
   * @desc goes through the maps,
   *       and the map values,
   *       reduces them to array
   *       then to an object using the reduced values
   *
   * @param {Object} obj object to clean, usually .entries()
   * @return {Object}
   */
  ChainedMap.prototype.clean = function clean (obj) {
    return Object.keys(obj).reduce(function (acc, key) {
      var val = obj[key];
      if (!real(val)) { return acc }
      if (array(val) && !val.length) { return acc }
      if (objWithKeys(val)) { return acc }

      acc[key] = val;

      return acc
    }, {})
  };

  return ChainedMap;
}(Chainable_1));

var ChainedMap_1 = ChainedMap;

var toArr = function toArr(ar) {
  if (!ar) { return [] }
  if (Array.isArray(ar)) { return ar }
  if (typeof ar === 'string') { return ar.includes(',') ? ar.split(',') : [ar] }
  if (ar instanceof Set || ar instanceof Map || ar.values) {
    var vals = [];
    ar.values().forEach(function (v) { return vals.push(v); });
    return vals
  }

  return [ar]
};

// module.exports.slice = Array.prototype.slice.call.bind(Array.prototype.slice)

var species = Symbol.species;

var spreadable = Symbol.isConcatSpreadable;

/**
 * @TODO could add .first .last ?
 * @tutorial https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
 * @prop {Set} store
 * @type {Set}
 */
var ChainedSet = (function (Chainable) {
  function ChainedSet(parent) {
    Chainable.call(this, parent);
    this.store = new Set();
  }

  if ( Chainable ) ChainedSet.__proto__ = Chainable;
  ChainedSet.prototype = Object.create( Chainable && Chainable.prototype );
  ChainedSet.prototype.constructor = ChainedSet;

  /**
   * @since 0.4.0
   * @param {any} value
   * @return {ChainedSet} @chainable
   */
  ChainedSet.prototype.add = function add (value) {
    this.store.add(value);
    return this
  };

  /**
   * @since 0.4.0
   * @desc inserts the value at the beginning of the Set
   * @param {any} value
   * @return {ChainedSet} @chainable
   */
  ChainedSet.prototype.prepend = function prepend (value) {
    this.store = new Set([value].concat(Chainable.prototype.values.call(this)));
    return this
  };

  /**
   * @since 0.4.0
   * @param {Array | Set | Concatable} arr
   * @return {ChainedSet} @chainable
   */
  ChainedSet.prototype.merge = function merge (arr) {
    var this$1 = this;

    toArr(arr).forEach(function (v) { return this$1.store.add(v); });
    return this
  };

  return ChainedSet;
}(Chainable_1));

var d = function (objs) { return function (symbol) { return function (v) { return objs.map(function (obj) { return Object.defineProperty(obj, symbol, {
      configurable: true,
      enumerable: false,
      get: function get() {
        return v
      },
    }); }
  ); }; }; };

var set = d([ChainedSet.prototype, ChainedSet]);
set(species)(Set);
set(spreadable)(true);

var ChainedSet_1 = ChainedSet;

var regexp = function (obj) { return obj instanceof RegExp || toS(obj) === '[object RegExp]'; };

var error$1 = function (obj) { return obj instanceof Error || toS(obj) === '[object Error]'; };

var boolean_1 = function (obj) { return obj === true || obj === false || toS(obj) === '[object Boolean]'; };

var number = function (obj) { return toS(obj) === '[object Number]' ||
  (/^0x[0-9a-f]+$/i).test(obj) ||
  (/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/).test(obj); };

var string = function (obj) { return typeof obj === 'string' || toS(obj) === '[object String]'; };

var date = function (obj) { return obj instanceof Date || toS(obj) === '[object Date]'; };

var isArray$1 = Array.isArray;
var objectKeys = Object.keys;
var hasOwnProperty = function (x, y) { return Object.hasOwnProperty.call(x, y); };

// https://github.com/substack/js-traverse
// @TODO: symbol
var traverse = function(obj) {
  return new Traverse(obj)
};
var traverse_1 = traverse;

function Traverse(obj) {
  this.value = obj;
}

Traverse.prototype.get = function(ps) {
  var node = this.value;
  for (var i = 0; i < ps.length; i++) {
    var key = ps[i];
    if (!node || !hasOwnProperty(node, key)) {
      node = undefined;
      break
    }
    node = node[key];
  }
  return node
};

Traverse.prototype.has = function(ps) {
  var node = this.value;
  for (var i = 0; i < ps.length; i++) {
    var key = ps[i];
    if (!node || !hasOwnProperty(node, key)) {
      return false
    }
    node = node[key];
  }
  return true
};

Traverse.prototype.set = function(ps, value) {
  var node = this.value;
  for (var i = 0; i < ps.length - 1; i++) {
    var key = ps[i];
    if (!hasOwnProperty(node, key)) { node[key] = {}; }
    node = node[key];
  }
  node[ps[i]] = value;
  return value
};

Traverse.prototype.map = function(cb) {
  return walk(this.value, cb, true)
};

Traverse.prototype.forEach = function(cb) {
  this.value = walk(this.value, cb, false);
  return this.value
};

Traverse.prototype.reduce = function(cb, init) {
  var skip = arguments.length === 1;
  var acc = skip ? this.value : init;
  this.forEach(function(x) {
    if (!this.isRoot || !skip) {
      acc = cb.call(this, acc, x);
    }
  });
  return acc
};

Traverse.prototype.paths = function() {
  var acc = [];
  this.forEach(function(x) {
    acc.push(this.path);
  });
  return acc
};

Traverse.prototype.nodes = function() {
  var acc = [];
  this.forEach(function(x) {
    acc.push(this.node);
  });
  return acc
};

Traverse.prototype.clone = function() {
  var parents = [], nodes = [];

  return (function clone(src) {
    for (var i = 0; i < parents.length; i++) {
      if (parents[i] === src) {
        return nodes[i]
      }
    }

    if (pureObj(src)) {
      var dst = copy(src);

      parents.push(src);
      nodes.push(dst);

      forEach(objectKeys(src), function (key) {
        dst[key] = clone(src[key]);
      });

      parents.pop();
      nodes.pop();
      return dst
    }
    else {
      return src
    }
  })(this.value)
};

function walk(root, cb, immutable) {
  var path = [];
  var parents = [];
  var alive = true;

  return (function walker(node_) {
    var node = immutable ? copy(node_) : node_;
    var modifiers = {};

    var keepGoing = true;

    var state = {
      node: node,
      node_: node_,
      path: [].concat(path),
      parent: parents[parents.length - 1],
      parents: parents,
      key: path.slice(-1)[0],
      isRoot: path.length === 0,
      level: path.length,
      circular: null,
      update: function update(x, stopHere) {
        if (!state.isRoot) {
          state.parent.node[state.key] = x;
        }
        state.node = x;
        if (stopHere) { keepGoing = false; }
      },
      delete: function delete$1(stopHere) {
        delete state.parent.node[state.key];
        if (stopHere) { keepGoing = false; }
      },
      remove: function remove(stopHere) {
        // @NOTE safety
        if (state.parent === undefined) {
          return
        }
        else if (isArray$1(state.parent.node)) {
          state.parent.node.splice(state.key, 1);
        }
        else {
          delete state.parent.node[state.key];
        }
        if (stopHere) { keepGoing = false; }
      },
      keys: null,
      before: function before(f) {
        modifiers.before = f;
      },
      after: function after(f) {
        modifiers.after = f;
      },
      pre: function pre(f) {
        modifiers.pre = f;
      },
      post: function post(f) {
        modifiers.post = f;
      },
      stop: function stop() {
        alive = false;
      },
      block: function block() {
        keepGoing = false;
      },
    };

    if (!alive) { return state }

    function updateState() {
      if (pureObj(state.node)) {
        if (!state.keys || state.node_ !== state.node) {
          state.keys = objectKeys(state.node);
        }

        state.isLeaf = state.keys.length == 0;

        for (var i = 0; i < parents.length; i++) {
          if (parents[i].node_ === node_) {
            state.circular = parents[i];
            break
          }
        }
      }
      else {
        state.isLeaf = true;
        state.keys = null;
      }

      state.notLeaf = !state.isLeaf;
      state.notRoot = !state.isRoot;
    }

    updateState();

    // use return values to update if defined
    var ret = cb.call(state, state.node);
    if (ret !== undefined && state.update) { state.update(ret); }

    if (modifiers.before) { modifiers.before.call(state, state.node); }

    if (!keepGoing) { return state }

    if (pureObj(state.node) && !state.circular) {
      parents.push(state);

      updateState();

      forEach(state.keys, function (key, i) {
        path.push(key);

        if (modifiers.pre) { modifiers.pre.call(state, state.node[key], key); }

        var child = walker(state.node[key]);
        if (immutable && hasOwnProperty(state.node, key)) {
          state.node[key] = child.node;
        }

        child.isLast = i == state.keys.length - 1;
        child.isFirst = i == 0;

        if (modifiers.post) { modifiers.post.call(state, child); }

        path.pop();
      });
      parents.pop();
    }

    if (modifiers.after) { modifiers.after.call(state, state.node); }

    return state
  })(root).node
}

function copy(src) {
  // require('fliplog').data(src).bold('copying').echo()
  if (pureObj(src)) {
    var dst;

    // const reduce = require('./reduce')
    // const toarr = require('./to-arr')
    // require('fliplog').underline('is obj').echo()
    // @TODO:
    // if (isMap(src)) {
    //   require('fliplog').underline('is map').echo()
    //   dst = reduce(src.entries())
    // }
    // else if (isSet(src)) {
    //   dst = toarr(src)
    // }
    if (isArray$1(src)) {
      dst = [];
    }
    else if (date(src)) {
      dst = new Date(src.getTime ? src.getTime() : src);
    }
    else if (regexp(src)) {
      dst = new RegExp(src);
    }
    else if (error$1(src)) {
      dst = {message: src.message};
    }
    else if (boolean_1(src)) {
      dst = new Boolean(src);
    }
    else if (number(src)) {
      dst = new Number(src);
    }
    else if (string(src)) {
      dst = new String(src);
    }
    else if (Object.create && Object.getPrototypeOf) {
      dst = Object.create(Object.getPrototypeOf(src));
    }
    else if (src.constructor === Object) {
      dst = {};
    }
    else {
      // @NOTE: only happens if above getPrototypeOf does not exist
      var proto = (src.constructor && src.constructor.prototype) ||
      src.__proto__ || {};
      var T = function() {};
      T.prototype = proto;
      dst = new T();
    }

    forEach(objectKeys(src), function (key) {
      dst[key] = src[key];
    });
    return dst
  }
  else {
    // require('fliplog').red('is NOT OBJ').echo()
    return src
  }
}

/**
 * @TODO: unexpectedly breaks things iterating
 * if you are relying on internal functionality
 * (such as .path, .get, .value...) with map & set
 *
 * @desc if there is .forEach on the obj already, use it
 * otherwise, call function for each
 */
var forEach = function(xs, fn) {
  if (xs.forEach) { return xs.forEach(fn) }
  else { for (var i = 0; i < xs.length; i++) { fn(xs[i], i, xs); } }
};

forEach(objectKeys(Traverse.prototype), function (key) {
  traverse[key] = function(obj) {
    var args = [].slice.call(arguments, 1);
    var t = new Traverse(obj);
    return t[key].apply(t, args)
  };
});

var _class = function (o) { return (/^\s*class\s/).test(o.toString()); };

/**
 * @tutorial https://github.com/substack/camelize/blob/master/test/camel.js
 * @tutorial https://github.com/andrewplummer/Sugar/blob/9c018a257a38714b81f7df033b74d236dbf1e861/lib/string.js
 * @tutorial http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
 * @tutorial https://github.com/sindresorhus/camelcase
 * @param  {string} str
 * @return {string}
 *
 * s.charAt(0).toLowerCase() + string.slice(1)
 */
var camelCase = function (str) { return str.replace(/\s+/g, '_').replace(/[_.-](\w|$)/g, function (m, x) { return x.toUpperCase(); }); };

// putting it here allows buble to ignore it
// const hasSymbol = typeof Symbol !== 'undefined'
// hasSymbol ? Symbol.iterator : 'Symbol(iterator)'

var index$4 = {
  Iterator: Symbol.iterator,
  Primative: Symbol.toPrimitive,
  Instance: Symbol.hasInstance,
  Spreadable: Symbol.isConcatSpreadable,
  Species: Symbol.species,
};

var Primative$1 = index$4.Primative;

// https://www.youtube.com/watch?v=SwSle66O5sU
var OFF = (~315 >>> 3) + "@@";

// @IDEA
// could use a factory function for each chain,
// exports a class that dynamically extends a specific class
// for easier chained inheritence

var Define = function (SuperClass, opts) {
  if ( SuperClass === void 0 ) SuperClass = ChainedMap_1;

  /**
   * @TODO could put this all in extendable
   * @see http://2ality.com/2015/09/well-known-symbols-es6.html
   * @IDEA extendDotProp (to allow doing like path.eh, path().eh(), path(), 'path.eh'!)
   * @classdesc simple object define extension
   * @type {Map}
   */
  return (function (SuperClass) {
    function DefineChain () {
      SuperClass.apply(this, arguments);
    }

    if ( SuperClass ) DefineChain.__proto__ = SuperClass;
    DefineChain.prototype = Object.create( SuperClass && SuperClass.prototype );
    DefineChain.prototype.constructor = DefineChain;

    DefineChain.prototype.defineGetSet = function defineGetSet (methods) {
      var this$1 = this;

      methods.forEach(function (method) {
        // reference current method, since we overwrite it
        var ref = this$1[method] && this$1[method].bind
          ? this$1[method].bind(this$1)
          : this$1[method];

        var getter = function () { return ref(); };

        // when arg is not passed in, count it as a getter
        // because `call` can be getter
        var setter = function (arg) {
          if ( arg === void 0 ) arg = OFF;

          if (arg === OFF) { return getter() }
          return ref(arg)
        };

        // configurable
        Object.defineProperty(this$1, method, {
          configurable: true,
          enumerable: true,
          get: getter,
          set: setter,
        });
      });

      return this
    };

    /**
     * @desc add camelCased getX setX methods alongside the defined getSet
     * @since 1.0.2
     *
     * @example
     *  .extendGetSet(['eh'], this)
     *  -> setEh()
     *  -> .getEh,
     *  -> .eh {
     *      get(getter): getEh,
     *      set(setter): setEh
     *     }
     *
     * @example
     *  // usage
     *  this.extendGetSet(['ehOh'])
     *
     *  // with methods
     *  this.ehOh(true)
     *  this.ehOh() === this.getEhOh() === true
     *
     *  // with defined set and get + symbol toPrimative
     *  this.ehOh = false
     *  this.ehOh == false
     *  this.ehOh.valueOf() === false
     *
     * @param  {Array<string>}  methods
     * @param  {Object} thisArg
     * @return {This} @chainable
     */
    DefineChain.prototype.extendGetSet = function extendGetSet (methods, thisArg) {
      var this$1 = this;

      // @NOTE the variables when converted to a for loop have to be reassigned
      // and voided, so this is preferrable
      methods.forEach(function (method) {
        var getter;
        var setter;
        var name = typeof method === 'string' ? method : method.name;

        // when we have method, use it, fallback to get/set
        /* prettier-ignore */
        getter = method.get
          ? function (arg) { return method.get(arg); }
          : function (arg) { return this$1.get(name); };

        // create the method beforehand to scope it, vs every call
        var sets = method.set
          ? function (a, b, c) { return method.set(a, b, c); }
          : function (a) { return this$1.set(name, a); };

        // when arg is not passed in, count it as a getter
        // because `call` can be getter
        setter = function (a, b, c) {
          if ( a === void 0 ) a = OFF;

          return (a === OFF ? getter() : sets(a, b, c));
        };

        // if this was hoisted it would be smaller
        this$1[camelCase(("get-" + name))] = getter;
        this$1[camelCase(("set-" + name))] = setter;
        this$1.shorthands.push(name);

        // also should have `setGet`
        Object.defineProperty(this$1, name, {
          configurable: true,
          enumerable: true,
          get: function getr(arg1) {
            var getrAsFn = function (arg2) {
              if ( arg2 === void 0 ) arg2 = OFF;

              return setter(arg2) // getter
            };
            getrAsFn[Primative$1] = function (hint) {
              return getter(OFF)
            };
            getrAsFn.valueOf = function () { return getter(OFF); };
            return getrAsFn
          },
          set: function setr(arg1, arg2, arg3) {
            if ( arg1 === void 0 ) arg1 = OFF;
            if ( arg2 === void 0 ) arg2 = OFF;
            if ( arg3 === void 0 ) arg3 = OFF;

            return setter(arg1, arg2, arg3)
          },
        });
      });

      return this
    };

    return DefineChain;
  }(SuperClass))
};

var eq = function(a, b, loose) {
  if (loose === void 0) { loose = false; }

  var equal = true;
  var node = b;

  traverse_1(a).forEach(function(y) {
    var notEqual = function() {
      equal = false;
      //this.stop();
      return undefined
    };

    //if (node === undefined || node === null) return notEqual();

    if (!this.isRoot) {
      /*
            if (!Object.hasOwnProperty.call(node, this.key)) {
                return notEqual();
            }
        */
      if (typeof node !== 'object') {
        return notEqual()
      }
      node = node[this.key];
    }

    var x = node;

    this.post(function() {
      node = x;
    });

    var toS = function(o) {
      return Object.prototype.toString.call(o)
    };

    if (this.circular) {
      if (traverse_1(b).get(this.circular.path) !== x) {
        notEqual();
      }
    }
    else if (typeof x !== typeof y) {
      if (loose === true && x == y) {
      }
      else {
        notEqual();
      }
    }
    else if (x === null || y === null || x === undefined || y === undefined) {
      if (x !== y) {
        notEqual();
      }
    }
    else if (x.__proto__ !== y.__proto__) {
      notEqual();
    }
    else if (x === y) {
      // nop
    }
    else if (typeof x === 'function') {
      if (x instanceof RegExp) {
        // both regexps on account of the __proto__ check
        if (x.toString() != y.toString()) {
          notEqual();
        }
      }
      else if (x !== y) {
        notEqual();
      }
    }
    else if (typeof x === 'object') {
      if (toS(y) === '[object Arguments]' || toS(x) === '[object Arguments]') {
        if (toS(x) !== toS(y)) {
          notEqual();
        }
      }
      else if (toS(y) === '[object RegExp]' || toS(x) === '[object RegExp]') {
        if (!x || !y || x.toString() !== y.toString()) {
          notEqual();
        }
      }
      else if (x instanceof Date || y instanceof Date) {
        if (
          !(x instanceof Date) ||
          !(y instanceof Date) ||
          x.getTime() !== y.getTime()
        ) {
          notEqual();
        }
      }
      else {
        var kx = Object.keys(x);
        var ky = Object.keys(y);
        if (kx.length !== ky.length) {
          return notEqual()
        }
        for (var i = 0; i < kx.length; i++) {
          var k = kx[i];
          if (!Object.hasOwnProperty.call(y, k)) {
            notEqual();
          }
        }
      }
    }
  });

  return equal
};

// scoped clones
var objs = {};

var Observe_1 = function (SuperClass, opts) {
  if ( SuperClass === void 0 ) SuperClass = ChainedMap_1;

  /**
   * @see https://github.com/ReactiveX/rxjs/blob/master/src/Subscriber.ts
   * @see https://github.com/sindresorhus/awesome-observables
   */
  return (function (SuperClass) {
    function Observe () {
      SuperClass.apply(this, arguments);
    }

    if ( SuperClass ) Observe.__proto__ = SuperClass;
    Observe.prototype = Object.create( SuperClass && SuperClass.prototype );
    Observe.prototype.constructor = Observe;

    Observe.prototype.observe = function observe (properties, cb) {
      var this$1 = this;

      if (this.observers === undefined) {
        this.observers = new ChainedSet_1(this);
      }

      /* prettier-ignore */
      this.observers
        .add(function (changed) {
          var data = {};
          var props = toArr(properties);

          if (props.includes('*')) {
            data = this$1.entries();
          }
          else {
            for (var i = 0; i < props.length; i++) {
              data[props[i]] = this$1.get(props[i]);
            }
          }

          var keys = props.join('_');
          if (eq(objs[keys], data)) {
            return this$1
          }

          objs[keys] = traverse_1(data).clone();

          cb(data, this$1);
        });

      return this
    };

    return Observe;
  }(SuperClass))
};

/**
 * @since 2.0.0
 */

var encase = function (configs) { return function (a, b, c, d, e) {
  var onValid = configs.onValid;
  var onInvalid = configs.onInvalid;
  var ref = configs.ref;
  var rethrow = configs.rethrow;
  var result;
  try {
    result = ref(a, b, c, d, e);
    return onValid === 0 ? result : onValid(result)
  }
  catch (error) {
    if (onInvalid !== 0) { return onInvalid(error) }
    if (rethrow === true) { throw error }
    else { return e }
  }
}; };

var Shorthands_1 = function (SuperClass, opts) {
  return (function (SuperClass) {
    function Shorthands () {
      SuperClass.apply(this, arguments);
    }

    if ( SuperClass ) Shorthands.__proto__ = SuperClass;
    Shorthands.prototype = Object.create( SuperClass && SuperClass.prototype );
    Shorthands.prototype.constructor = Shorthands;

    Shorthands.prototype.encase = function encase$1 (method, rethrow) {
      var this$1 = this;
      if ( rethrow === void 0 ) rethrow = false;

      // const fn = typeof method === 'function'
      // or pass in a normal method...
      // let ref = fn ? method : this[method].bind(this)
      var ref = this[method].bind(this);

      var config = {
        onInvalid: 0,
        onValid: 0,
        rethrow: rethrow,
        ref: ref,
      };

      // @TODO improve this
      this.then = function (cb) {
        config.onValid = cb;
        return this$1
      };
      this.catch = function (cb) {
        config.onInvalid = cb;
        return this$1
      };

      // should be a child factory really...
      // if (fn !== false) {
      //   encased.call = () => encased.apply(this, arguments)
      //   encased.wrapped = () => {
      //     encased.apply(this, arguments)
      //     return this
      //   }
      //   encased.end = () => this
      //   return encased
      // }

      this[method] = encase(config);

      return this
    };

    /**
     * @TODO maybe just flow methods with a toFunction or something instead?
     * @since 1.0.2
     * @desc to allow flowing,
     * @param  {Array<string>} methods
     * @return {This} @chainable
     */
    Shorthands.prototype.bindMethods = function bindMethods (methods) {
      var this$1 = this;

      methods.forEach(function (method) { return (this$1[method] = this$1[method].bind(this$1)); });
      return this
    };

    /**
     * @desc wrap it simply to call a fn and return `this`
     * @since 1.0.2
     * @param  {string}   name
     * @param  {Function | null} [fn=null]
     * @return {This} @chainable
     */
    Shorthands.prototype.chainWrap = function chainWrap (name, fn) {
      var this$1 = this;
      if ( fn === void 0 ) fn = null;

      var ref = fn || this[name];
      this[name] = function (a, b, c) {
        ref.call(this$1, a, b, c);
        return this$1
      };
      return this
    };

    /**
     * @desc set if the value has not been set
     * @since 1.0.2
     * @see this.set
     * @param {string} name
     * @param {any} value
     * @return {This} @chainable
     */
    Shorthands.prototype.setIfEmpty = function setIfEmpty (name, value) {
      // this.when(this.has(name) === false, () => this.set(name, value))
      if (this.has('name') === false) { this.set(name, value); }
      return this
    };

    // --- added new ChainedMapExtendable stuff ---

    /**
     * @since 1.0.2
     * @desc traverse `this`, or `this.entries`
     * @see TraverseChain
     * @see js-traverse
     * @param  {Function[]} funcs functions to flow left to right
     * @return {Function} passes args through the functions, bound to this
     */
    // flow(...funcs) {
    //   const length = funcs ? funcs.length : 0
    //   return (...args) => {
    //     let index = 0
    //     // eslint-disable-next-line
    //     let result = length ? funcs[index].apply(this, args) : args[0]
    //     for (; index < length; ++index) {
    //       // eslint-disable-next-line
    //       result = funcs[index].call(this, result)
    //     }
    //     return result
    //   }
    // }

    /**
     * @desc return a value at the end of a chain regardless
     * @param  {any} value value to return at the end of a chain
     * @return {any}
     */
    Shorthands.prototype.return = function return$1 (value) {
      return value
    };

    /**
     * @desc execute something and return this
     * @param  {any} fn
     * @return {This} @chainable
     */
    Shorthands.prototype.wrap = function wrap (fn) {
      if (typeof fn === 'function') { fn.call(this, this); }
      return this
    };

    return Shorthands;
  }(SuperClass))
};

var escapeStringRegex = function (str) { return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'); };

var toTest = function (key, arg1, arg2) {
  var type = typeof key;
  // log
  //   .dim('testing keys')
  //   .data({test, arg1, matched: test.test(arg1)})
  //   .echo(debug)
  if (type === 'string') {
    var test = new RegExp(escapeStringRegex(key));
    return !!test.test(arg1)
  }
  if (type === 'function' && !key.test) { return !!key(arg1) }
  return !!key.test(arg1, arg2)
};

/**
 * @since 1.0.0
 * @type {Set}
 */
var TraverseChain = (function (ChainedMap) {
  function Traverser(parent) {
    ChainedMap.call(this, parent);
    this.set('keys', []).set('vals', []);
    this.call = this.traverse.bind(this);
  }

  if ( ChainedMap ) Traverser.__proto__ = ChainedMap;
  Traverser.prototype = Object.create( ChainedMap && ChainedMap.prototype );
  Traverser.prototype.constructor = Traverser;

  /**
   * @since 1.0.0
   * @alias data
   * @param  {Object | null} [obj=null]
   * @param  {boolean} [isBuilder=null] whether it is a function returning sub traversers
   * @return {Cleaner} @chainable
   */
  Traverser.prototype.obj = function obj (obj, isBuilder) {
    if ( obj === void 0 ) obj = null;
    if ( isBuilder === void 0 ) isBuilder = false;

    if (!obj) { return this }
    return this.set('obj', obj) // .set('isBuilder', isBuilder)
  };

  /**
   * @since 1.0.0
   * @desc matches for value
   *       @modifies this.vals
   * @param  {Array<Regexp | Function>} tests
   * @return {Traverser} @chainable
   */
  Traverser.prototype.keys = function keys (tests) {
    return this.set('keys', tests)
  };

  /**
   * @since 1.0.0
   * @desc matches for value
   *       @modifies this.vals
   * @param  {Array<Regexp | Function>} tests
   * @return {Traverser} @chainable
   */
  Traverser.prototype.vals = function vals (tests) {
    return this.set('vals', tests)
  };

  /**
   * @since 1.0.0
   * @desc callback for each match
   *       @modifies this.onMatch
   * @param  {Function} [cb=null] defaults to .remove
   * @return {Matcher} @chainable
   */
  Traverser.prototype.onMatch = function onMatch (cb) {
    if ( cb === void 0 ) cb = null;

    if (cb === null) {
      return this.set('onMatch', function (arg, traverser) {
        traverser.remove();
      })
    }

    return this.set('onMatch', cb)
  };

  /**
   * @since 1.0.0
   * @desc callback for each match
   *       @modifies this.onMatch
   * @param  {Function} [cb=null] defaults to .remove
   * @return {Matcher} @chainable
   */
  Traverser.prototype.onNonMatch = function onNonMatch (cb) {
    if ( cb === void 0 ) cb = null;

    return this.set('onNonMatch', cb)
  };

  /**
   * @since 1.0.0
   * @alias call
   * @desc runs traverser, checks the tests, calls the onMatch
   *       @modifies this.cleaned
   * @param  {boolean} [shouldReturn=false] returns object
   * @return {any} this.obj/data cleaned
   */
  Traverser.prototype.traverse = function traverse$1 (shouldReturn) {
    if (this.has('onMatch') === false) { this.onMatch(); }

    var ref = this.entries();
    var obj = ref.obj;
    var keys = ref.keys;
    var vals = ref.vals;
    var onMatch = ref.onMatch;
    var onNonMatch = ref.onNonMatch;
    var result = obj;

    // console.log('starting match...')
    // log.bold('key val matchers').fmtobj({keys, vals}).echo(debug)

    // diff between keys and val is order of arg in ^ tester
    var matcher = function (prop, val) {
      for (var i = 0; i < keys.length; i++) {
        if (toTest(keys[i], prop, val)) { return true }
      }
      for (var i$1 = 0; i$1 < vals.length; i$1++) {
        if (toTest(vals[i$1], val, prop)) { return true }
      }

      // log.red('did not match').fmtobj({prop, val}).echo(debug)
      return false
    };

    // bound to the traverser
    traverse_1(obj).forEach(function(x) {
      // log.data({ x, match }).bold(this.key).echo()
      // const match = matcher(this.key, x)
      if (matcher(this.key, x)) {
        // log.data({ x }).bold(this.key).echo()
        onMatch(x, this);
      }
      else if (onNonMatch) {
        onNonMatch(x, this);
        // log.data({ x }).red(this.key).echo()
      }
      // else {
      //   log.yellow('no match for me').data({key: this.key, path: this.path}).echo()
      // }
    });

    this.set('traversed', result);
    return shouldReturn === true ? result : this
  };

  /**
   * @see this.traverse
   * @return {Object | Array | any}
   */
  Traverser.prototype.traversed = function traversed () {
    return this.get('traversed')
  };

  return Traverser;
}(ChainedMap_1));

var obj = function (x) { return pureObj(x) || typeof x === 'function'; };

var Transform_1 = function (SuperClass, opts) {
  return (function (SuperClass) {
    function Transform () {
      SuperClass.apply(this, arguments);
    }

    if ( SuperClass ) Transform.__proto__ = SuperClass;
    Transform.prototype = Object.create( SuperClass && SuperClass.prototype );
    Transform.prototype.constructor = Transform;

    Transform.prototype.traverse = function traverse (useThis) {
      if ( useThis === void 0 ) useThis = false;

      /* prettier-ignore */
      return new TraverseChain(this)
        .obj(useThis === false
          ? this.entries(true)
          : useThis === true
            ? this
            : useThis
        )
    };

    // but could specify the key
    // could .tap methods with like .decorate
    // this is super expensive
    // afterNext(cb) {
    //   // loop each fn
    //   // wrap
    // }

    /**
     * @TODO dot-prop here
     * @since 1.0.2
     * @TODO handle transformers with an array...
     * @see obj-chain
     *
     * @example
     *   this
     *     .transform('dis', val => (typeof val === 'string' ? val : val.id))
     *     .set('dis', 'eh') // .get('dis') === 'eh'
     *     .set('dis', {id: 'eh'}) // .get('dis') === 'eh'
     *
     * @param  {string | Function} key currently just string
     * @param  {Function} value
     * @return {This} @chainable
     */
    Transform.prototype.transform = function transform (key, value) {
      if (this.transformers === undefined) { this.transformers = {}; }
      if (this.transformers[key]) { this.transformers[key].push(value); }
      else { this.transformers[key] = [value]; }
      return this
    };

    Transform.prototype.compute = function compute (key, cb) {
      var this$1 = this;

      return this.transform(key, function (value) {
        cb(value, this$1);
        return value
      })
    };

    /**
     * @TODO dot-prop here
     * @inheritdoc
     * @see this.observe, this.transform
     * @since 1.0.0
     */
    Transform.prototype.set = function set (prop, val) {
      var this$1 = this;

      var value = val;
      var key = prop;

      /* prettier-ignore */
      if (this.transformers !== undefined && this.transformers[key] !== undefined) {
        for (var i = 0; i < this.transformers[key].length; i++) {
          value = this$1.transformers[key][i].call(this$1, value, this$1);
        }
      }

      SuperClass.prototype.set.call(this, key, value);

      if (this.observers !== undefined) {
        this.observers.values().forEach(function (observer) { return observer({key: key, value: value}); });
      }

      return this
    };

    // --- remap ---

    /**
     * @TODO: could also be a function, but then might as well use .transform
     * @since 1.0.0
     * @example
     *  this
     *    .remapKeys()
     *    .remapKey('dis', 'dat')
     *    .from({dis: true})
     *  == {dat: true}
     *
     * @param  {string} from property name
     * @param  {string} to property name to change key to
     * @return {Chain} @chainable
     */
    Transform.prototype.remap = function remap (from, to) {
      var this$1 = this;

      var remap = from;
      if (!obj(from)) { remap = {};
        remap[from] = to; }

      /* prettier-ignore */
      Object.keys(remap).forEach(function (key) { return this$1.transform(key, function (val) {
        this$1.set(remap[key], val);
        return val
      }); });

      return this
    };

    return Transform;
  }(SuperClass))
};

var Types = function (SuperClass, opts) {
  return (function (SuperClass) {
    function TypeChain () {
      SuperClass.apply(this, arguments);
    }

    if ( SuperClass ) TypeChain.__proto__ = SuperClass;
    TypeChain.prototype = Object.create( SuperClass && SuperClass.prototype );
    TypeChain.prototype.constructor = TypeChain;

    TypeChain.prototype.validators = function validators (validators$1) {
      // icky but shorter: merge existing, or use variable
      /* prettier-ignore */
      return this
        .set('validators', this.has('validators') === true
          ? dopemerge_1(this.get('validators'), validators$1)
          : validators$1)
    };

    /**
     * @since 1.0.0
     * @desc add a validated function to do .set
     * @param  {string | null} [name=null] shorthand for .name
     * @return {FactoryChain} @chainable
     */
    TypeChain.prototype.typed = function typed (name) {
      var this$1 = this;
      if ( name === void 0 ) name = null;

      var FactoryChain = FactoryChain_1;
      var typed = new FactoryChain(this);

      var chain = typed
        .prop('type')
        .prop('name')
        .prop('onInvalid')
        .prop('onValid')
        .chainUpDown(this.typed)
        .chainUpDowns(['typed'])
        .onDone(function (data) {
          this$1.extendTyped(data.name, data.type, data.onInvalid, data.onValid);
        });

      // notNullType
      if (string(name)) {
        chain.name(name);
        return chain
      }
      if (pureObj(name)) {
        return chain.merge(name).end()
      }

      return chain
    };

    /**
     * @protected
     * @since 1.0.0
     * @desc extend a type
     * @param  {string} name
     * @param  {any} type
     * @param  {Function | null} [onInvalid=null]
     * @param  {Function | null} [onValid=null]
     * @return {This} @chainable
     */
    TypeChain.prototype.extendTyped = function extendTyped (name, type, onInvalid, onValid) {
      var this$1 = this;
      if ( onInvalid === void 0 ) onInvalid = null;
      if ( onValid === void 0 ) onValid = null;

      this[name] = function (arg) {
        var typeError = function () {
          var errorMsg = "[typof: " + (typeof name) + ", name: " + name + "] was not of type " + type;
          return new TypeError(errorMsg)
        };
        if (onInvalid === null) {
          onInvalid = function (e) {
            throw typeError()
          };
        }

        var validator = typeof type === 'string'
          ? this$1.get('validators')[type]
          : type;

        if (typeof validator !== 'function') {
          // console.error({validators: this.get('validators')}, '\n\n')
          throw new TypeError((validator + " for " + type + " was not a function"))
        }

        var valid = true;

        // @NOTE: should use `.encase` but we do not know this will inherit it
        // @TODO remove try catch unless `.encase` is used
        // try {
        valid = validator(arg);
        // }
        // catch (e) {
        // valid = e
        // }

        // if (this.get('debug') === true) {
        //   // console.log('validating: ', {valid, arg, name})
        // }

        // .error, .stack, === 'object'
        if (valid === null || valid === true) {
          this$1.set(name, arg);
          if (onValid !== null) { onValid(arg, this$1, typeError()); }
        }
        else {
          onInvalid(arg, this$1);
        }
        return this$1
      };
      return this
    };

    return TypeChain;
  }(SuperClass))
};

var dotSegments = function (path) {
  var pathArr = path.split('.');
  var parts = [];

  for (var i = 0; i < pathArr.length; i++) {
    var p = pathArr[i];

    while (p[p.length - 1] === '\\' && pathArr[i + 1] !== undefined) {
      p = p.slice(0, -1) + '.';
      p += pathArr[++i];
    }

    parts.push(p);
  }

  return parts
};

// https://github.com/sindresorhus/dot-prop/blob/master/index.js
// https://github.com/sindresorhus/is-obj/blob/master/index.js



var dotProp = {
  get: function get(obj$$1, path, value) {
    if (!obj(obj$$1) || typeof path !== 'string') {
      return value === undefined ? obj$$1 : value
    }

    var pathArr = dotSegments(path);

    for (var i = 0; i < pathArr.length; i++) {
      if (!Object.prototype.propertyIsEnumerable.call(obj$$1, pathArr[i])) {
        return value
      }

      obj$$1 = obj$$1[pathArr[i]];

      if (obj$$1 === undefined || obj$$1 === null) {
        // `obj` is either `undefined` or `null` so we want to stop the loop, and
        // if this is not the last bit of the path, and
        // if it did't return `undefined`
        // it would return `null` if `obj` is `null`
        // but we want `get({foo: null}, 'foo.bar')` to equal `undefined`, or the supplied value, not `null`
        if (i !== pathArr.length - 1) {
          return value
        }

        break
      }
    }

    return obj$$1
  },

  set: function set(obj$$1, path, value) {
    var full = obj$$1;
    if (!obj(obj$$1) || typeof path !== 'string') {
      return obj$$1
    }

    var pathArr = dotSegments(path);

    for (var i = 0; i < pathArr.length; i++) {
      var p = pathArr[i];

      if (!obj(obj$$1[p])) {
        obj$$1[p] = {};
      }

      if (i === pathArr.length - 1) {
        obj$$1[p] = value;
      }

      obj$$1 = obj$$1[p];
    }
  },

  delete: function delete$1(obj$$1, path) {
    var full = obj$$1;
    if (!obj(obj$$1) || typeof path !== 'string') {
      return obj$$1
    }

    var pathArr = dotSegments(path);

    for (var i = 0; i < pathArr.length; i++) {
      var p = pathArr[i];

      if (i === pathArr.length - 1) {
        delete obj$$1[p];
        return
      }

      obj$$1 = obj$$1[p];

      if (!obj(obj$$1)) {
        return
      }
    }
  },

  has: function has(obj$$1, path) {
    if (!obj(obj$$1) || typeof path !== 'string') {
      return false
    }

    var pathArr = dotSegments(path);

    for (var i = 0; i < pathArr.length; i++) {
      if (obj(obj$$1)) {
        if (!(pathArr[i] in obj$$1)) {
          return false
        }

        obj$$1 = obj$$1[pathArr[i]];
      }
      else {
        return false
      }
    }

    return true
  },
};

var dot = function (k) { return typeof k === 'string' && k.includes('.'); };

/**
 * @since 2.0.0
 */




/**
 * @desc checks if this._dot != false & isDot(key)
 * @see this.dot
 * @param  {string} key
 * @param  {DotProp} thisArg
 * @return {boolean}
 */
var shouldDot = function (key, thisArg) {
  return thisArg._dot !== false && dot(key)
};

var DotProp_1 = function (SuperClass, opts) {
  return (function (SuperClass) {
    function DotProp () {
      SuperClass.apply(this, arguments);
    }

    if ( SuperClass ) DotProp.__proto__ = SuperClass;
    DotProp.prototype = Object.create( SuperClass && SuperClass.prototype );
    DotProp.prototype.constructor = DotProp;

    DotProp.prototype.dot = function dot$$1 (useDot) {
      if ( useDot === void 0 ) useDot = true;

      this._dot = useDot;
      return this
    };

    /**
     * @inheritdoc
     * @see .dot
     * @desc since we have a map,
     *       we need to ensure the first property is available
     *       otherwise we have an empty map.entries obj
     *       which does nothing by reference
     */
    DotProp.prototype.set = function set (key, val) {
      if (shouldDot(key, this)) {
        var prop = key.split('.').shift();

        // we already know it is .dot, call super instead
        if (!SuperClass.prototype.has.call(this, prop)) { SuperClass.prototype.set.call(this, prop, {}); }

        // spread
        var data = SuperClass.prototype.entries.call(this);

        // set on the spread data
        dotProp.set(data, key, val);

        // is already by ref, but be extra safe
        return SuperClass.prototype.set.call(this, prop, data[prop])
      }
      return SuperClass.prototype.set.call(this, key, val)
    };
    /**
     * @inheritdoc
     * @see .dot
     */
    DotProp.prototype.get = function get (key) {
      return shouldDot(key, this)
        ? dotProp.get(SuperClass.prototype.entries.call(this), key)
        : SuperClass.prototype.get.call(this, key)
    };
    /**
     * @inheritdoc
     * @see .dot
     */
    DotProp.prototype.has = function has (key) {
      return shouldDot(key, this)
        ? dotProp.has(SuperClass.prototype.entries.call(this), key)
        : SuperClass.prototype.has.call(this, key)
    };

    /**
     * @inheritdoc
     * @see .dot
     */
    DotProp.prototype.delete = function delete$1 (key) {
      return shouldDot(key, this)
        ? dotProp.delete(SuperClass.prototype.entries.call(this), key)
        : SuperClass.prototype.delete.call(this, key)
    };

    /**
     * @desc returns a dot chain
     * @since 1.0.0
     * @param {string | null} [name=null]
     * @return {Object}
     */
    DotProp.prototype.dotter = function dotter (name) {
      var this$1 = this;
      if ( name === void 0 ) name = null;

      if (name !== null) {
        // if (this.get('debug') === true) {
        //   console.log('chain:dotter:used-name', {name})
        // }
        return this._dotter(name)
      }

      return {
        name: function (dotName) { return this$1._dotter(dotName); },
      }
    };

    /**
     * @protected
     * @since 1.0.0
     * @TODO split into a class
     * @see FlipChain.when
     * @desc take a dot-prop (or normal string) name
     *       returns an object with `.dotted` & `.otherwise`
     * @param  {string} name
     * @return {Object}
     */
    DotProp.prototype._dotter = function _dotter (name) {
      var value;
      var dotted = {};
      var hasDot = dot(name);

      // @NOTE: shifting the first one off will change accessor
      // @example moose.simple -> first: 'moose', accessor: ['simple']
      var accessor = hasDot ? dotSegments(name) : false;
      var first = accessor ? accessor.shift() : false;

      dotted.dotted = function (cb) {
        if (hasDot === false) { return dotted }
        value = cb(first, accessor, name);
        return dotted
      };

      dotted.otherwise = function (cb) {
        if (hasDot === true) { return dotted }
        value = cb(name);
        return dotted
      };

      // chain it
      dotted.dotted.otherwise = dotted.otherwise;

      dotted.value = function () {
        return value
      };

      return dotted
    };

    return DotProp;
  }(SuperClass))
};

/**
 * @since 2.0.0
 */




// const {addPrefix, removePrefix} = require('../deps/prefix')

function getDecoration(decoration) {
  var method = pureObj(decoration)
    ? Object.keys(decoration).pop()
    : decoration.method || decoration;

  return {
    method: method,
    returnee: decoration.return,
    key: decoration.key || method,
    cb: pureObj(decoration) ? decoration[method] : null,
  }
}

/**
 * @inheritdoc
 */
var Extend = function (SuperClass, opts) {
  if ( SuperClass === void 0 ) SuperClass = ChainedMap_1;

  return (function (SuperClass) {
    function Extendable(parent) {
      SuperClass.call(this, parent);

      // this.methodsAlias = this.extendAlias.bind(this)
      // this.methodsWith = this.extendWith.bind(this)
      // this.methodsAutoIncrement = this.extendIncrement.bind(this)

      if (parent && parent.has && parent.has('debug')) {
        this._debug = parent.get('debug');
        // this.debug(parent.get('debug'))
      }
      else {
        // this._debug = false
        this.debug(false);
      }
    }

    if ( SuperClass ) Extendable.__proto__ = SuperClass;
    Extendable.prototype = Object.create( SuperClass && SuperClass.prototype );
    Extendable.prototype.constructor = Extendable;

    // --- --- --- debug --- --- ---

    /**
     * @since 1.0.0
     * @inheritdoc
     * @override
     * @desc same as ChainedMap.get, but checks for debug
     */
    Extendable.prototype.get = function get (name) {
      if (name === 'debug') { return this._debug }
      return SuperClass.prototype.get.call(this, name)
    };
    /**
     * @since 0.2.0
     * @NOTE sets on store not this.set for easier extension
     * @param {boolean} [should=true]
     * @return {Chainable} @chainable
     */
    Extendable.prototype.debug = function debug (should) {
      if ( should === void 0 ) should = true;

      this._debug = should;
      return this
      // return this.store.set('debug', should)
    };

    // --- original ChainedMap ---

    /**
     * @since 1.0.0
     * @alias extendParent
     * @desc add methods to the parent for easier chaining
     * @see ChainedMap.parent
     * @param  {Array<string | Object>} decorations
     * @return {ChainedMap} @chainable
     */
    Extendable.prototype.decorateParent = function decorateParent (decorations) {
      var this$1 = this;

      // can use this to "undecorate"
      if (this.parent && !this.parent.decorated) {
        this.parent.decorated = this.parent.decorated || [];
      }

      decorations.forEach(function (decoration) {
        // console.log({method, key}, 'parent decorations')
        var ref = getDecoration(decoration);
        var method = ref.method;
        var cb = ref.cb;
        var returnee = ref.returnee;
        var key = ref.key;

        // @NOTE ignores when no parent
        if (!returnee && !this$1.parent) {
          // if (this.get('debug') === true) {
          //   console.log('had no parent: ', method, this.className)
          // }
          return
        }

        this$1.parent.decorated.push(method);
        this$1.parent[method] = function (arg1, arg2, arg3) {
          cb = cb || this$1[method];
          var result;
          if (cb) { result = cb.call(this$1, arg1, arg2, arg3); }
          else { this$1.set(key, arg1); }
          return returnee || result || this$1.parent || this$1
        };
      });

      return this
    };

    // --- extend extend ---

    /**
     * @since 0.4.0
     * @param  {Array<string>} methods
     * @param  {string}  name
     * @param  {Boolean} [thisArg=null]
     * @example
     *  chain.extendAlias(['eh'], 'canada')
     *  chain.eh == chain.canada
     * @return {ChainedMap}
     */
    Extendable.prototype.extendAlias = function extendAlias (methods, name, thisArg) {
      var this$1 = this;
      if ( thisArg === void 0 ) thisArg = null;

      /* prettier-ignore */
      toArr(methods)
        .forEach(function (method) { return (this$1[method] = this$1[name].bind(thisArg || this$1)); });

      return this
    };

    /**
     * @desc add methods for keys with default values, or val as default value
     * @param {Array<string> | Object} methods
     * @param {any} [val='undefined']
     * @return {ChainedMap} @chainable
     */
    Extendable.prototype.extendWith = function extendWith (methods, val) {
      var this$1 = this;
      if ( val === void 0 ) val = undefined;

      var isArr = Array.isArray(methods);
      var keys = isArr ? methods : Object.keys(methods);

      keys.forEach(function (method) {
        this$1.shorthands.push(method);
        var v = isArr === false ? methods[method] : val;
        this$1[method] = function (value) {
          if ( value === void 0 ) value = v;

          return this$1.set(method, value);
        };
      });
      return this
    };

    // --- boolean & increment presets ---

    /**
     * @since 0.4.0
     * @desc when called, increments the value
     * @example this.extendIncrement(['eh']).eh().eh().eh().get('eh') === 3
     * @param  {Array<string>} methods
     * @return {ChainedMap}
     */
    Extendable.prototype.extendIncrement = function extendIncrement (methods) {
      var this$1 = this;

      methods.forEach(function (method) {
        this$1.shorthands.push(method);
        this$1[method] = function () {
          var value = (this$1.get(method) || 0) + 1;
          this$1.set(method, value);
          return this$1
        };
      });
      return this
    };

    return Extendable;
  }(SuperClass))
};

// @TODO child, immutable, Symbols (take out of Chainable)
// const Symbols = require('./Symbols')

// optimize this as much as possible
function compose(SuperClass, o) {
  if ( SuperClass === void 0 ) SuperClass = ChainedMap_1;
  if ( o === void 0 ) o = true;

  var composed = SuperClass;
  var opts = o;
  if (opts === true) {
    // single arg
    if (typeof composed === 'object' && _class(composed) === false) {
      opts = composed;
      composed = ChainedMap_1;
      // require('fliplog').bold('was not a class').data(composed, opts).exit()
    }
    else {
      opts = {
        symbols: true,
        define: true,
        observe: true,
        shorthands: true,
        transform: true,
        types: true,
        dot: true,
        extend: true,
      };
    }
  }
  else {
    opts = {};
  }

  // if (opts.symbols === true) composed = Symbols(composed)
  if (opts.extend === true) { composed = Extend(composed); }
  if (opts.define === true) { composed = Define(composed); }
  if (opts.observe === true) { composed = Observe_1(composed); }
  if (opts.shorthands === true) { composed = Shorthands_1(composed); }
  if (opts.transform === true) { composed = Transform_1(composed); }
  if (opts.types === true) { composed = Types(composed); }
  if (opts.dot === true) { composed = DotProp_1(composed); }

  return composed
}

// compose.Symbols = Symbols
compose.Extend = Extend;
compose.Define = Define;
compose.Observe = Observe_1;
compose.Shorthands = Shorthands_1;
compose.Transform = Transform_1;
compose.Types = Types;
compose.DotProp = Types;

var index$2 = compose;

var Composed = index$2({extend: true});

/**
 * @inheritdoc
 * @prop {Object} data
 * @prop {Set} _calls
 * @type {Map}
 */
var FactoryChain = (function (Composed) {
  function FactoryChain(parent) {
    Composed.call(this, parent);

    this.data = {};
    this.factory();
    Composed.prototype.extend.call(this, ['optional', 'required', 'chainUpDown']).set('chainLength', 0);
    // super.extendIncrement(['chainLength'])
    this._calls = new ChainedSet_1(this);
  }

  if ( Composed ) FactoryChain.__proto__ = Composed;
  FactoryChain.prototype = Object.create( Composed && Composed.prototype );
  FactoryChain.prototype.constructor = FactoryChain;

  /**
   * @TODO should have a debug log for this
   * @desc chain back up to parent for any of these
   * @param  {Array<string>} methods
   * @return {FactoryChain} @chainable
   */
  FactoryChain.prototype.chainUpDowns = function chainUpDowns (methods) {
    var this$1 = this;

    methods.forEach(function (m) {
      this$1[m] = function (arg1, arg2, arg3, arg4, arg5) {
        this$1.end();
        return this$1.parent[m](arg1, arg2, arg3, arg4, arg5)
      };
    });
    return this
  };

  // extend(props) {
  //   super.extend(props)
  //   return this
  // }

  FactoryChain.prototype.props = function props (names) {
    var this$1 = this;

    names.forEach(function (name) { return this$1.prop(name); });
    return this
  };

  FactoryChain.prototype.onDone = function onDone (cb) {
    return this.set('onDone', cb)
  };

  FactoryChain.prototype.prop = function prop (name, cb) {
    var this$1 = this;
    if ( cb === void 0 ) cb = null;

    this.tap('chainLength', function (len) { return len + 1; });

    // console.log({name}, this.get('chainLength'))

    // so if we call a property twice,
    // chain back up to parent,
    // add a new chain
    if (this[name] !== undefined && this.has('chainUpDown') === true) {
      this.end();
      return this.get('chainUpDown')()[name](cb)
    }

    // @TODO need to spread as needed
    this[name] = function (args) {
      if (cb === null) { this$1.data[name] = args; }
      else { cb(args); }

      this$1._calls.add(name);

      // aka magicReturn
      return this$1._calls.length === this$1.get('chainLength') ? this$1.end() : this$1
    };
    return this
  };

  /**
   * @param  {any} [prop=null] key of the data, or returns all data
   * @return {any}
   */
  FactoryChain.prototype.getData = function getData (prop) {
    if ( prop === void 0 ) prop = null;

    return prop === null ? this.data : this.data[prop]
  };

  FactoryChain.prototype.factory = function factory (obj) {
    var this$1 = this;
    if ( obj === void 0 ) obj = {};

    this.end = function (arg) {
      if (obj.end !== undefined) {
        var ended = obj.end(this$1.data, this$1.parent, this$1, arg);
        if (ended && ended !== this$1) { return ended }
      }
      else if (this$1.has('onDone')) {
        var ended$1 = this$1.get('onDone')(this$1.data, this$1.parent, this$1, arg);
        if (ended$1 && ended$1 !== this$1) { return ended$1 }
      }

      return this$1.parent
    };

    return this
  };

  return FactoryChain;
}(Composed));

var FactoryChain_1 = FactoryChain;

// core



// merge



// easy

// composer


// export
var exp = index$2();
exp.init = function (parent) { return new exp(parent); };
exp.Chain = exp;
exp.compose = index$2;
exp.traverse = traverse_1;
exp.toArr = toArr;
exp.camelCase = toArr;
exp.dot = dotProp;
// exp.saw = require('./deps/chainsaw')

// function d(name, opts) {
//   Object.defineProperty(exp, name, {
//     configurable: true,
//     enumerable: false,
//     get() {
//       return Composer(opts)
//     },
//   })
// }
// d('Types', {types: true})

// core
exp.Chainable = Chainable_1;
exp.ChainedSet = ChainedSet_1;
exp.ChainedMap = ChainedMap_1;
exp.FactoryChain = FactoryChain_1;
// merge
exp.MergeChain = MergeChain_1;
exp.dopemerge = dopemerge_1;

var index = exp;

module.exports = index;
//# sourceMappingURL=index.cjs.dev.js.map
