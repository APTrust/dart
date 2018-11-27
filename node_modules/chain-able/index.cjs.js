function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

require('inspector-gadget');
var util = _interopDefault(require('util'));

const isArr = Array.isArray;
const isObj = o => o && typeof o === 'object';

function defaultKeyFn({val, i, array, obj}) {
  // if (typeof val === 'object') {
  //   obj = Object.assign(obj, val)
  // } else if (typeof val === 'string') { }
  return val
}
function defaultValFn({val, i, array, obj}) {
  return val
}

// array items become object values,
// fn maps items to keys
function arrToObj(array, keyValFns = {}) {
  const key = keyValFns.keyFn || defaultKeyFn;
  const val = keyValFns.valFn || defaultValFn;

  const obj = {};
  if (!isArr(array) && isObj(array)) return array
  const len = array.length;
  for (let i = 0; i < len; i++) {
    const _val = val({val: array[i], i, array, obj});
    const _key = key({val: _val, i, array, obj});
    obj[_key] = _val;
  }
  return obj
}

// @example:
// var array = ['eh', 'canada']
// valAsKey(array, 'woot')
// {eh: 'woot', canada: 'woot'}
function valAsKey(array, fn) {
  return arrToObj(array, {
    valFn: () => undefined,
    keyFn: ({i}) => (typeof fn === 'function' ? fn(i) : fn || array[i]),
  })
}

// @example:
// var array = ['eh', 'canada']
// valAsVal(array)
// {'1': 'eh', '2': 'canada'}
function valAsVal(array, fn) {
  return arrToObj(array, {
    valFn: ({i, val}) => (typeof fn === 'function' ? fn(val, i) : fn || i),
    keyFn: () => undefined,
  })
}

// is default...
function valAsKeyAndVal(array, fn) {
  return arrToObj(array, {
    valFn: defaultValFn,
    keyFn: defaultKeyFn,
  })
}

// function valAsValAndKey(array, fn) {}

arrToObj.valAsKey = valAsKey;
arrToObj.valAsVal = valAsVal;
arrToObj.valAsKeyAndVal = valAsKeyAndVal;

var arrToObj_1 = arrToObj;

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
}



function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

/**
 * @type {Chainable}
 * @property {Chainable | any} parent
 */
class Chainable$2 {
  /**
   * @param {Chainable | any} parent
   */
  constructor(parent) {
    this.parent = parent;
  }

  /**
   * @since 0.4.0
   * @see Chainable.parent
   * @return {Chainable | any}
   */
  end() {
    return this.parent
  }

  /**
   * @since 0.4.0
   * @param  {any} key
   * @param  {Function} [trueBrancher=Function.prototype]
   * @param  {Function} [falseBrancher=Function.prototype]
   * @return {ChainedMap}
   */
  whenHas(
    key,
    trueBrancher = Function.prototype,
    falseBrancher = Function.prototype
  ) {
    if (this.has(key) === true) {
      trueBrancher(this.get(key), this);
    }
    else {
      falseBrancher(false, this);
    }
    return this
  }

  /**
   * @description
   *  when the condition is true,
   *  trueBrancher is called,
   *  else, falseBrancher is called
   *
   * @param  {boolean} condition
   * @param  {Function} [trueBrancher=Function.prototype]
   * @param  {Function} [falseBrancher=Function.prototype]
   * @return {ChainedMap}
   */
  when(
    condition,
    trueBrancher = Function.prototype,
    falseBrancher = Function.prototype
  ) {
    if (condition) {
      trueBrancher(this);
    }
    else {
      falseBrancher(this);
    }

    return this
  }

  /**
   * @since 0.5.0
   * @see ChainedMap.store
   * @return {number}
   */
  get length() {
    return this.store.size
  }

  /**
   * @since 0.3.0
   * @return {Chainable}
   */
  clear() {
    this.store.clear();
    return this
  }

  /**
   * @since 0.3.0
   * @description calls .delete on this.store.map
   * @param {string | any} key
   * @return {Chainable}
   */
  delete(key) {
    this.store.delete(key);
    return this
  }

  /**
   * @since 0.3.0
   * @param {any} value
   * @return {boolean}
   */
  has(value) {
    return this.store.has(value)
  }
}

var Chainable_all = Chainable$2;

var javascriptStringify = createCommonjsModule(function (module, exports) {
(function (root, stringify) {
  /* istanbul ignore else */
  if (typeof commonjsRequire === 'function' && 'object' === 'object' && 'object' === 'object') {
    // Node.
    module.exports = stringify();
  } else if (typeof undefined === 'function' && undefined.amd) {
    // AMD, registers as an anonymous module.
    undefined(function () {
      return stringify();
    });
  } else {
    // Browser global.
    root.javascriptStringify = stringify();
  }
})(commonjsGlobal, function () {
  /**
   * Match all characters that need to be escaped in a string. Modified from
   * source to match single quotes instead of double.
   *
   * Source: https://github.com/douglascrockford/JSON-js/blob/master/json2.js
   */
  var ESCAPABLE = /[\\\'\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

  /**
   * Map of characters to escape characters.
   */
  var META_CHARS = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    "'":  "\\'",
    '"':  '\\"',
    '\\': '\\\\'
  };

  /**
   * Escape any character into its literal JavaScript string.
   *
   * @param  {string} char
   * @return {string}
   */
  function escapeChar (char) {
    var meta = META_CHARS[char];

    return meta || '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
  }

  /**
   * JavaScript reserved word list.
   */
  var RESERVED_WORDS = {};

  /**
   * Map reserved words to the object.
   */
  (
    'break else new var case finally return void catch for switch while ' +
    'continue function this with default if throw delete in try ' +
    'do instanceof typeof abstract enum int short boolean export ' +
    'interface static byte extends long super char final native synchronized ' +
    'class float package throws const goto private transient debugger ' +
    'implements protected volatile double import public let yield'
  ).split(' ').map(function (key) {
    RESERVED_WORDS[key] = true;
  });

  /**
   * Test for valid JavaScript identifier.
   */
  var IS_VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

  /**
   * Check if a variable name is valid.
   *
   * @param  {string}  name
   * @return {boolean}
   */
  function isValidVariableName (name) {
    return !RESERVED_WORDS[name] && IS_VALID_IDENTIFIER.test(name);
  }

  /**
   * Return the global variable name.
   *
   * @return {string}
   */
  function toGlobalVariable (value) {
    return 'Function(' + stringify('return this;') + ')()';
  }

  /**
   * Serialize the path to a string.
   *
   * @param  {Array}  path
   * @return {string}
   */
  function toPath (path) {
    var result = '';

    for (var i = 0; i < path.length; i++) {
      if (isValidVariableName(path[i])) {
        result += '.' + path[i];
      } else {
        result += '[' + stringify(path[i]) + ']';
      }
    }

    return result;
  }

  /**
   * Stringify an array of values.
   *
   * @param  {Array}    array
   * @param  {string}   indent
   * @param  {Function} next
   * @return {string}
   */
  function stringifyArray (array, indent, next) {
    // Map array values to their stringified values with correct indentation.
    var values = array.map(function (value, index) {
      var str = next(value, index);

      if (str === undefined) {
        return String(str);
      }

      return indent + str.split('\n').join('\n' + indent);
    }).join(indent ? ',\n' : ',');

    // Wrap the array in newlines if we have indentation set.
    if (indent && values) {
      return '[\n' + values + '\n]';
    }

    return '[' + values + ']';
  }

  /**
   * Stringify a map of values.
   *
   * @param  {Object}   object
   * @param  {string}   indent
   * @param  {Function} next
   * @return {string}
   */
  function stringifyObject (object, indent, next) {
    // Iterate over object keys and concat string together.
    var values = Object.keys(object).reduce(function (values, key) {
      var value = next(object[key], key);

      // Omit `undefined` object values.
      if (value === undefined) {
        return values;
      }

      // String format the key and value data.
      key   = isValidVariableName(key) ? key : stringify(key);
      value = String(value).split('\n').join('\n' + indent);

      // Push the current object key and value into the values array.
      values.push(indent + key + ':' + (indent ? ' ' : '') + value);

      return values;
    }, []).join(indent ? ',\n' : ',');

    // Wrap the object in newlines if we have indentation set.
    if (indent && values) {
      return '{\n' + values + '\n}';
    }

    return '{' + values + '}';
  }

  /**
   * Convert JavaScript objects into strings.
   */
  var OBJECT_TYPES = {
    '[object Array]': stringifyArray,
    '[object Object]': stringifyObject,
    '[object Error]': function (error) {
      return 'new Error(' + stringify(error.message) + ')';
    },
    '[object Date]': function (date) {
      return 'new Date(' + date.getTime() + ')';
    },
    '[object String]': function (string) {
      return 'new String(' + stringify(string.toString()) + ')';
    },
    '[object Number]': function (number) {
      return 'new Number(' + number + ')';
    },
    '[object Boolean]': function (boolean) {
      return 'new Boolean(' + boolean + ')';
    },
    '[object Uint8Array]': function (array, indent) {
      return 'new Uint8Array(' + stringifyArray(array) + ')';
    },
    '[object Set]': function (array, indent, next) {
      if (typeof Array.from === 'function') {
        return 'new Set(' + stringify(Array.from(array), indent, next) + ')';
      } else return undefined;
    },
    '[object Map]': function (array, indent, next) {
      if (typeof Array.from === 'function') {
        return 'new Map(' + stringify(Array.from(array), indent, next) + ')';
      } else return undefined;
    },
    '[object RegExp]': String,
    '[object Function]': String,
    '[object global]': toGlobalVariable,
    '[object Window]': toGlobalVariable
  };

  /**
   * Convert JavaScript primitives into strings.
   */
  var PRIMITIVE_TYPES = {
    'string': function (string) {
      return "'" + string.replace(ESCAPABLE, escapeChar) + "'";
    },
    'number': String,
    'object': String,
    'boolean': String,
    'symbol': String,
    'undefined': String
  };

  /**
   * Convert any value to a string.
   *
   * @param  {*}        value
   * @param  {string}   indent
   * @param  {Function} next
   * @return {string}
   */
  function stringify (value, indent, next) {
    // Convert primitives into strings.
    if (Object(value) !== value) {
      return PRIMITIVE_TYPES[typeof value](value, indent, next);
    }

    // Handle buffer objects before recursing (node < 6 was an object, node >= 6 is a `Uint8Array`).
    if (typeof Buffer === 'function' && Buffer.isBuffer(value)) {
      return 'new Buffer(' + next(value.toString()) + ')';
    }

    // Use the internal object string to select stringification method.
    var toString = OBJECT_TYPES[Object.prototype.toString.call(value)];

    // Convert objects into strings.
    return toString ? toString(value, indent, next) : undefined;
  }

  /**
   * Stringify an object into the literal string.
   *
   * @param  {*}               value
   * @param  {Function}        [replacer]
   * @param  {(number|string)} [space]
   * @param  {Object}          [options]
   * @return {string}
   */
  return function (value, replacer, space, options) {
    options = options || {};

    // Convert the spaces into a string.
    if (typeof space !== 'string') {
      space = new Array(Math.max(0, space|0) + 1).join(' ');
    }

    var maxDepth = Number(options.maxDepth) || 100;
    var references = !!options.references;
    var skipUndefinedProperties = !!options.skipUndefinedProperties;
    var valueCount = Number(options.maxValues) || 100000;

    var path = [];
    var stack = [];
    var encountered = [];
    var paths = [];
    var restore = [];

    /**
     * Stringify the next value in the stack.
     *
     * @param  {*}      value
     * @param  {string} key
     * @return {string}
     */
    function next (value, key) {
      if (skipUndefinedProperties && value === undefined) {
        return undefined;
      }

      path.push(key);
      var result = recurse(value, stringify);
      path.pop();
      return result;
    }

    /**
     * Handle recursion by checking if we've visited this node every iteration.
     *
     * @param  {*}        value
     * @param  {Function} stringify
     * @return {string}
     */
    var recurse = references ?
      function (value, stringify) {
        if (value && (typeof value === 'object' || typeof value === 'function')) {
          var seen = encountered.indexOf(value);

          // Track nodes to restore later.
          if (seen > -1) {
            restore.push(path.slice(), paths[seen]);
            return;
          }

          // Track encountered nodes.
          encountered.push(value);
          paths.push(path.slice());
        }

        // Stop when we hit the max depth.
        if (path.length > maxDepth || valueCount-- <= 0) {
          return;
        }

        // Stringify the value and fallback to
        return stringify(value, space, next);
      } :
      function (value, stringify) {
        var seen = stack.indexOf(value);

        if (seen > -1 || path.length > maxDepth || valueCount-- <= 0) {
          return;
        }

        stack.push(value);
        var value = stringify(value, space, next);
        stack.pop();
        return value;
      };

    // If the user defined a replacer function, make the recursion function
    // a double step process - `recurse -> replacer -> stringify`.
    if (typeof replacer === 'function') {
      var before = recurse;

      // Intertwine the replacer function with the regular recursion.
      recurse = function (value, stringify) {
        return before(value, function (value, space, next) {
          return replacer(value, space, function (value) {
            return stringify(value, space, next);
          });
        });
      };
    }

    var result = recurse(value, stringify);

    // Attempt to restore circular references.
    if (restore.length) {
      var sep = space ? '\n' : '';
      var assignment = space ? ' = ' : '=';
      var eol = ';' + sep;
      var before = space ? '(function () {' : '(function(){';
      var after = '}())';
      var results = ['var x' + assignment + result];

      for (var i = 0; i < restore.length; i += 2) {
        results.push('x' + toPath(restore[i]) + assignment + 'x' + toPath(restore[i + 1]));
      }

      results.push('return x');

      return before + sep + results.join(eol) + eol + after
    }

    return result;
  };
});
});

const inspector = (msg, depth = 30, opts = {}) => {
  // allow taking in different depths
  if (!Number.isInteger(depth)) depth = 10;
  const defaults = {
    depth,
    maxArrayLength: depth,
    showHidden: true,
    showProxy: true,
    colors: true,
  };
  opts = Object.assign(defaults, opts);

  const util$$1 = util;
  try {
    const inspected = util$$1.inspect(msg, opts);
    return inspected
  } catch (e) {
    console.log(e);
    try {
      const stringify = javascriptStringify;
      const stringified = stringify(msg, null, '  ');
      return stringified
    } catch (error) {
      return msg
    }
  }
};

var inspector_1 = inspector;

// https://www.bennadel.com/blog/2829-string-interpolation-using-util-format-and-util-inspect-in-node-js.htm
const filter = [
  'helpers',
  'addDebug',
  'inspect',
  'emit',
  'on',
  'debugFor',
  'translator',
  'appsByName',

  // these ones we might want to toggle on and off
  'instance',
  'api',
  'evts',
  'hubs',
];
const inspectorGadget$1 = (thisArg, moreFilters) => {
  return function(depth, options) {
    let toInspect = Object.keys(thisArg)
    .filter(key => !filter.includes(key));

    if (Array.isArray(moreFilters))
      toInspect = toInspect.filter(key => !moreFilters.includes(key));
    // else if (typeof moreFilters === 'function')
    //   toInspect = toInspect.map(key => moreFilters(key, this[key]))
    else if (typeof moreFilters === 'object') {
      // if (moreFilters.blacklist)
      if (moreFilters.whitelist) {
        toInspect = toInspect.filter(key => moreFilters.whitelist.includes(key));
      }
      // if (moreFilters.val) {
      //   return moreFilters.val
      // }
      // if (moreFilters.filter)
      // if (moreFilters.map)
    }

    let inspected = {};
    toInspect.forEach(key => {
      // @TODO: filter out .length on function...
      // let val = thisArg[key]
      // if (typeof val === 'function')
      inspected[key] = thisArg[key];
    });
    return inspected
  }
};

var inspectorGadget_1 = inspectorGadget$1;

let custom = util.inspect.defaultOptions.customInspect;
var index$2 = {
  util,
  inspectorGadget: inspectorGadget_1,
  inspector: inspector_1,
  inspect: inspector_1,
  custom: (arg = false) => {
    if (arg !== true && arg !== false && arg !== null && arg !== undefined) {
      util.inspect.defaultOptions.customInspect = arg;
    } else if (arg) {
      util.inspect.defaultOptions.customInspect = custom;
    } else {
      util.inspect.defaultOptions.customInspect = false;
    }
    return inspector_1
  },
};



var index$4 = Object.freeze({
	default: index$2,
	__moduleExports: index$2
});

var require$$0 = ( index$4 && index$2 ) || index$4;

/**
 * @type {Chainable}
 * @property {Chainable | any} parent
 */
class ChainableNodeJS extends Chainable_all {
  /**
   * @param {Chainable | any} parent
   */
  constructor(parent) {
    super(parent);
    this.inspect = require$$0.inspectorGadget(this, [
      'parent',
      'workflow',
    ]);
  }

  /**
   * @since 0.5.0
   * @type {generator}
   * @see https://github.com/sindresorhus/quick-lru/blob/master/index.js
   */
  // * [Symbol.iterator](): void {
  //   for (const item of this.store) {
  //     yield item
  //   }
  // }
}

var Chainable_node = ChainableNodeJS;

var Chainable = createCommonjsModule(function (module) {
// 

const isNode =
  typeof process === 'object' &&
  typeof process.release === 'object' &&
  process.release.name === 'node';

if (isNode) {
  module.exports = Chainable_node;
}
else {
  module.exports = Chainable_all;
}
});

// @TODO convert forEach for faster loops
// import deepmerge from 'deepmerge'
function isMergeableObject(val) {
  var strType = Object.prototype.toString.call(val);

  return (
    // not null object
    val !== null &&
    typeof val === 'object' &&
    // object toString is not a date or regex
    strType !== '[object RegExp]' &&
    strType !== '[object Date]'
  )
}

function emptyTarget(val) {
  return Array.isArray(val) ? [] : {}
}

function cloneIfNecessary(value, optionsArgument) {
  var clone = optionsArgument && optionsArgument.clone === true;
  return clone && isMergeableObject(value) ?
    deepmerge(emptyTarget(value), value, optionsArgument) :
    value
}

function defaultArrayMerge(target, source, optionsArgument) {
  var destination = target.slice();
  source.forEach((e, i) => {
    if (typeof destination[i] === 'undefined') {
      destination[i] = cloneIfNecessary(e, optionsArgument);
    }
    else if (isMergeableObject(e)) {
      destination[i] = deepmerge(target[i], e, optionsArgument);
    }
    else if (target.indexOf(e) === -1) {
      destination.push(cloneIfNecessary(e, optionsArgument));
    }
  });
  return destination
}

function mergeObject(target, source, optionsArgument) {
  var destination = {};
  if (isMergeableObject(target)) {
    Object.keys(target).forEach(key => {
      destination[key] = cloneIfNecessary(target[key], optionsArgument);
    });
  }
  Object.keys(source).forEach(key => {
    if (!isMergeableObject(source[key]) || !target[key]) {
      destination[key] = cloneIfNecessary(source[key], optionsArgument);
    }
    else {
      destination[key] = deepmerge(target[key], source[key], optionsArgument);
    }
  });
  return destination
}

function deepmerge(target, source, optionsArgument) {
  var array = Array.isArray(source);
  var options = optionsArgument || {arrayMerge: defaultArrayMerge};
  var arrayMerge = options.arrayMerge || defaultArrayMerge;

  if (array) {
    return Array.isArray(target) ?
      arrayMerge(target, source, optionsArgument) :
      cloneIfNecessary(source, optionsArgument)
  }
  else {
    return mergeObject(target, source, optionsArgument)
  }
}

deepmerge.all = function deepmergeAll(array, optionsArgument) {
  if (!Array.isArray(array) || array.length < 2) {
    throw new Error(
      'first argument should be an array with at least two elements'
    )
  }

  // we are sure there are at least 2 values, so it is safe to have no initial value
  return array.reduce((prev, next) => {
    return deepmerge(prev, next, optionsArgument)
  })
};

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
    stringToArray: true,
    boolToArray: false,
    boolAsRight: true,
    ignoreTypes: ['null', 'undefined', 'NaN'],
    debug: true,
  }
}

// require('fliplog').fmtobj({types, options, obj1, obj2}).echo(false)
// require('fliplog')
//   .data({
//     boolbool: eq(['boolean', 'boolean']),
//     strstr: eq(['string', 'string']),
//     arrstr: eq(['array', 'string']),
//     strarr: eq(['string', 'array']),
//   })
//   .echo()

function getOpts(opts) {
  const defaults = getDefaults();
  const options = Object.assign(defaults, opts);
  return options
}

const isArr$1 = Array.isArray;
function dopemerge(obj1, obj2, opts = {}) {
  // if they are identical, fastest === check
  if (obj1 === obj2) return obj1

  // setup options
  const {ignoreTypes, stringToArray, boolToArray} = getOpts(opts);

  // setup vars
  let type1 = typeof obj1;
  let type2 = typeof obj2;
  if (isArr$1(obj1)) type1 = 'array';
  if (isArr$1(obj2)) type2 = 'array';
  const types = [type1, type2];

  // check one then check the other
  // @TODO might want to push undefined null nan into array but...
  if (ignoreTypes.includes(type1) === true) return obj2
  if (ignoreTypes.includes(type2) === true) return obj1

  const eq = eqCurry(types);

  // check types to prefer
  switch (true) {
    case eq(['boolean', 'boolean']): {
      return boolToArray ? [obj1, obj2] : obj2
    }
    case eq(['string', 'string']): {
      return stringToArray ? [obj1, obj2] : obj1 + obj2
    }
    case eq(['array', 'string']): {
      return obj1.concat([obj2])
    }
    case eq(['string', 'array']): {
      return obj2.concat([obj1])
    }
    default: {
      return deepmerge(obj1, obj2)
    }
  }
}

var dopemerge_1 = dopemerge;

class MergeChain extends Chainable {
  /**
   * @param  {Chainable} parent required, for merging
   * @return {MergeChain} @chainable
   */
  static init(parent) {
    return new MergeChain(parent)
  }

  constructor(parent) {
    super(parent);
    this.store = new Map();
    this.set = (name, val) => {
      this.store.set(name, val);
      return this
    };
    this.get = name => this.store.get(name);
  }

  /**
   * @desc can pass in a function same as .merge,
   *       but say, .set instead of merge
   *
   * @param  {Function} cb
   * @return {MergeChain} @chainable
   */
  onExisting(cb) {
    return this.set('onExisting', cb)
  }

  /**
   * @desc can pass in a function to check values, such as ignoring notReal
   * @example .onValue(val => val !== null && val !== undefined)
   * @param  {Function} cb
   * @return {MergeChain} @chainable
   */
  onValue(cb) {
    return this.set('onValue', cb)
  }

  /**
   * @desc merges object in, goes through all keys, checks cbs, dopemerges
   * @param  {Object} obj2 object to merge in
   * @return {MergeChain} @chainable
   */
  merge(obj2) {
    let onValue = this.get('onValue');
    let onExisting = this.get('onExisting');

    let obj = obj2;

    // @TODO do this
    // if (obj2 instanceof Chainable) {
    //   // is map
    //   if (obj2.entries) obj2 = obj2.entries()
    //   // set, much easier to merge
    //   // else if (obj2.values)
    // }

    // const onChildChain = this.get('onChildChain') (is just .merge)
    // const onDefault = this.get('onDefault') (is .set)

    // for (let i = 0; i < keys.length; i++) const key = keys[i]
    Object.keys(obj).forEach(key => {
      const value = obj[key];

      // use onValue when set
      if (onValue !== undefined && onValue(obj[key], key) === false) {
        return false
      }

      // when property itself is a Chainable
      if (this.parent[key] && this.parent[key] instanceof Chainable) {
        return this.parent[key].merge(value)
      }

      // check if it is shorthanded
      if (this.parent.shorthands.includes(key)) {
        // has a value already
        if (this.parent.has(key) === true) {
          // get that value
          const existing = this.parent.get(key);

          // setup vars
          let merged = existing;

          // if we have a cb, call it
          // default to dopemerge
          if (onExisting === undefined) {
            merged = dopemerge_1(existing, value);
          }
          else {
            merged = onExisting(existing, value);
          }

          return this.parent[key](merged)
        }

        return this.parent[key](value)
      }

      // when fn is a full method, not an extended shorthand
      if (this.parent[key] !== undefined) {
        return this.parent[key](value)
      }

      // default to .set on the store
      return this.parent.set(key, value)
    });

    return this.parent
  }
}

var MergeChain_1 = MergeChain;

/**
 * @tutorial https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Map
 * @inheritdoc
 * @type {Chainable}
 */
class ChainedMap extends Chainable {
  /**
   * @param {ChainedMap | Chainable | any} parent
   */
  constructor(parent) {
    super(parent);
    this.shorthands = [];
    this.store = new Map();
    this.className = this.constructor.name;

    // @TODO for wrapping methods to force return `this`
    // this.chainableMethods = []
  }

  /**
   * @since 0.7.0
   * @see this.set, this.get
   * @desc   tap a value with a function
   *         @modifies this.store.get(name)
   * @param  {string | any} name key to `.get`
   * @param  {Function} fn function to tap with
   * @return {Chain} @chainable
   */
  tap(name, fn) {
    const old = this.get(name);
    const updated = fn(old);
    return this.set(name, updated)
  }

  /**
   * @TODO needs improvements like parsing stringify
   *       since it is just .merge atm
   *
   * @desc checks each property of the object
   *       calls the chains accordingly
   *
   * @param {Object} obj
   * @return {Chainable} @chainable
   */
  from(obj) {
    Object.keys(obj).forEach(key => {
      const fn = this[key];
      const value = obj[key];

      if (this[key] && this[key] instanceof Chainable) {
        return this[key].merge(value)
      }
      else if (typeof this[key] === 'function') {
        // const fnStr = typeof fn === 'function' ? fn.toString() : ''
        // if (fnStr.includes('return this') || fnStr.includes('=> this')) {
        return this[key](value)
      }
      else {
        this.set(key, value);
      }
    });
    return this
  }

  /**
   * @description shorthand methods, from strings to functions that call .set
   * @param  {Array<string>} methods
   * @return {ChainedMap}
   */
  extend(methods) {
    this.shorthands = methods;
    methods.forEach(method => {
      this[method] = value => this.set(method, value);
    });
    return this
  }

  /**
   * @description
   *   clears the map,
   *   goes through this properties,
   *   calls .clear if they are instanceof Chainable or Map
   *
   *
   * @see https://github.com/fliphub/flipchain/issues/2
   * @return {ChainedMap}
   */
  clear() {
    this.store.clear();
    Object.keys(this).forEach(key => {
      if (key === 'inspect' || key === 'parent') return
      if (this[key] instanceof Chainable) this[key].clear();
      if (this[key] instanceof Map) this[key].clear();
    });

    return this
  }

  /**
   * @description spreads the entries from ChainedMap.store (Map)
   * @return {Object}
   */
  entries() {
    const entries = [...this.store];
    if (!entries.length) {
      return null
    }
    return entries.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc
    }, {})
  }

  /**
   * @description spreads the entries from ChainedMap.store.values
   * @return {Array<any>}
   */
  values() {
    return [...this.store.values()]
  }

  /**
   * @param  {any} key
   * @return {any}
   */
  get(key) {
    return this.store.get(key)
  }

  /**
   * @description sets the value using the key on store
   * @see ChainedMap.store
   * @param {any} key
   * @param {any} value
   * @return {ChainedMap}
   */
  set(key, value) {
    this.store.set(key, value);
    return this
  }

  /**
   * @description concats an array `value` in the store with the `key`
   * @see ChainedMap.store
   * @param {any} key
   * @param {Array<any>} value
   * @return {ChainedMap}
   */
  concat(key, value) {
    if (!Array.isArray(value)) value = [value];
    this.store.set(key, this.store.get(value).concat(value));
    return this
  }

  /**
   * @description appends the string value to the current value at the `key`
   * @see ChainedMap.concat
   * @param {any} key
   * @param {string | Array} value
   * @return {ChainedMap}
   */
  append(key, value) {
    let existing = this.store.get(value);

    if (Array.isArray(existing)) {
      existing.push(value);
    }
    else {
      existing += value;
    }

    this.store.set(key, existing);

    return this
  }

  /**
   * @TODO needs to pass in additional opts somehow...
   *       ...as second arg? on instance property?
   *
   * @description merges an object with the current store
   * @see dopemerge, MergeChain
   * @param {Object} obj
   * @return {ChainedMap} @chainable
   */
  merge(obj) {
    MergeChain_1.init(this).merge(obj);
    return this
  }

  /**
   * @description
   *  goes through the maps,
   *  and the map values,
   *  reduces them to array
   *  then to an object using the reduced values
   *
   * @param {Object} obj
   * @return {Object}
   */
  clean(obj) {
    return Object.keys(obj).reduce((acc, key) => {
      const value = obj[key];
      if (value === undefined || value === null) return acc
      if (Array.isArray(value) && !value.length) return acc
      if (
        Object.prototype.toString.call(value) === '[object Object]' &&
        Object.keys(value).length === 0
      ) {
        return acc
      }

      acc[key] = value;

      return acc
    }, {})
  }
}

var ChainedMap_1 = ChainedMap;

/**
 * @tutorial https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
 * @type {Set}
 */
class ChainedSet extends Chainable {
  /**
   * @param {ChainedSet | Chainable | any} parent
   */
  constructor(parent) {
    super(parent);
    this.store = new Set();
  }

  /**
   * @param {any} value
   * @return {ChainedSet}
   */
  add(value) {
    this.store.add(value);
    return this
  }

  /**
   * @description inserts the value at the beginning of the Set
   * @param {any} value
   * @return {ChainedSet}
   */
  prepend(value) {
    this.store = new Set([value, ...this.store]);
    return this
  }

  /**
   * @return {Array<any>}
   */
  values() {
    return [...this.store]
  }

  /**
   * @param {Array | Set} arr
   * @return {ChainedSet}
   */
  merge(arr) {
    this.store = new Set([...this.store, ...arr]);
    return this
  }
}

var ChainedSet_1 = ChainedSet;

var toArr = function toArr(data, opts = null) {
  const defaults = {includeEmpty: false, keys: false, split: ','};
  if (opts) opts = Object.assign(defaults, opts);
  else opts = defaults;
  const {includeEmpty, split, keys} = opts;

  if (!data && !includeEmpty) return []
  if (Array.isArray(data)) return data

  if (typeof data === 'string') {
    if (typeof split === 'string' && data.includes(split)) {
      return data.split(split)
    }
    else if (Array.isArray(split)) {
      let splitData = [];
      split.forEach(delimiter => {
        if (data.includes(delimiter)) {
          splitData = splitData.concat(data.split(delimiter));
        }
      });
      return splitData
    }
  }

  if (data && keys && typeof data === 'object') {
    return Object.keys(data)
  }
  else {
    return [data]
  }
};

var slice = Array.prototype.slice.call.bind(Array.prototype.slice);

toArr.slice = slice;

const firstToUpper$1 = str => str.charAt(0).toUpperCase() + str.slice(1);

const addPrefix$1 = (string, prefix) => prefix + firstToUpper$1(string);

function removePrefix$1(string, prefix) {
  if (string.indexOf(prefix) === 0) string = string.slice(prefix.length);
  return string.charAt(0).toLowerCase() + string.slice(1)
}

var prefix = {
  firstToUpper: firstToUpper$1,
  addPrefix: addPrefix$1,
  removePrefix: removePrefix$1,
};

const {firstToUpper, addPrefix, removePrefix} = prefix;

// @TODO: extendBool which would add `no` firstChar.toUpperCase() + rest()
//
// maybe was doing this to bind the prefix variable?
// this.extendWith(methods.map((method) => (0, addPrefix)(method, prefix)), !val, prefix)

/**
 * @inheritdoc
 */
class ChainedMapExtendable extends ChainedMap_1 {
  constructor(parent) {
    super(parent);

    if (parent && parent.has && parent.has('debug')) {
      this.debug(parent.get('debug'));
    }
    else {
      this.debug(false);
    }
  }

  // --- added new ChainedMapExtendable stuff ---

  // to more easily use different chains,
  // simply loop and bind methods...
  // useChains(chains) {}

  // --- helpers  ---

  /**
   * @desc return a value at the end of a chain regardless
   * @param  {any} value value to return at the end of a chain
   * @return {any}
   */
  return(value) {
    return value
  }

  // --- observe ---

  /**
   * @TODO should hash these callback properties
   * @TODO just throttle the `.set` to allow easier version of .commit
   * @TODO .unobserve
   *
   * @see https://medium.com/@benlesh/learning-observable-by-building-observable-d5da57405d87
   * @alias  on
   * @param  {string} properties
   * @param  {Function} cb
   * @return {Chain} @chainable
   */
  observe(properties, cb) {
    if (this.observers === undefined) {
      this.observers = new ChainedSet_1(this);
    }

    /* prettier-ignore */
    this.observers
      .add(changed => {
        // @TODO
        //  use `changed` to simply only update data with changed
        //  keep scoped data
        //  const {key, value} = changed

        const data = {};
        const props = toArr(properties);
        for (let i = 0; i < props.length; i++) {
          const prop = props[i];
          data[prop] = this.get(prop);
        }
        cb(data, this);
      });

    return this
  }

  /**
   * @see this.observe
   * @inheritdoc
   */
  set(key, value) {
    super.set(key, value);

    if (this.observers !== undefined) {
      this.observers.values().forEach(observer => observer({key, value}));
    }

    return this
  }

  // --- remap ---

  /**
   * @desc start remapping
   * @see this.remapKey
   * @param  {Object} obj
   * @return {Chain} @chainable
   */
  remapKeys() {
    return this.set('keymap', {})
  }

  /**
   * @TODO could also be an array of `from` and corresponds to an array of `to`
   * @param  {string} from property name
   * @param  {string} to property name to change key to
   * @return {Chain} @chainable
   */
  remapKey(from, to) {
    this.get('keymap')[from] = to;
    return this
  }

  /**
   * @inheritdoc
   * @override
   * @desc if we have a keymap, remap, otherwise, just normal .from
   * @see FlipChain.from
   * @param  {Object} obj
   * @return {Chain} @chainable
   */
  from(obj) {
    if (this.has('keymap') === false) {
      return super.from(obj)
    }

    const keymap = this.get('keymap');
    const keys = Object.keys(obj);
    const mappedKeys = keys.map(key => {
      if (keymap[key]) return keymap[key]
      return key
    });

    for (let i = 0; i < keys.length; i++) {
      const key = mappedKeys[i];
      // skip if we already have it
      if (obj[key]) continue
      // otherwise, set it, can delete the old one
      obj[key] = obj[keys[i]];
    }

    return super.from(obj)
  }

  /**
   * @desc returns a dot chain
   * @param {string | null} [name=null]
   * @return {Object}
   */
  dotter(name = null) {
    if (name !== null) {
      console.log('chain:dotter', 'used name');
      return this._dotter(name)
    }

    return {
      name: dotName => this._dotter(dotName),
    }
  }

  /**
   * @protected
   * @TODO split into a class
   * @see FlipChain.when
   * @desc take a dot-prop (or normal string) name
   *       returns an object with `.dotted` & `.otherwise`
   * @param  {string} name
   * @return {Object}
   */
  _dotter(name) {
    let accessor = name;
    let first = name;
    let hasDot = name.includes('.');
    let value;

    if (hasDot) {
      accessor = name.split('.');
      first = accessor.shift();
    }

    const dotted = {};

    dotted.dotted = cb => {
      if (hasDot === false) return dotted
      value = cb(first, accessor, name);
      return dotted
    };

    dotted.otherwise = cb => {
      if (dotted === true) return dotted
      value = cb(name);
      return dotted
    };

    // chain it
    dotted.dotted.otherwise = dotted.otherwise;

    dotted.value = () => value;

    return dotted
  }

  // --- original ChainedMapExtendable ---

  /**
   * @inheritdoc
   * @override
   * @desc same as ChainedMap.get, but checks for debug
   */
  get(name) {
    if (name === 'debug') return this._debug
    return super.get(name)
  }

  /**
   * @NOTE sets on store not this.set for easier extension
   * @param {boolean} [should=true]
   * @return {Chainable} @chainable
   */
  debug(should = true) {
    this._debug = should;
    return this
    // return this.store.set('debug', should)
  }

  /**
   * @see ChainedMapExtendable.parent
   * @param  {Array<Object>} decorations
   * @return {ChainedMapExtendable}
   */
  decorateParent(decorations) {
    if (!this.decorated) this.decorated = new ChainedMap_1(this.parent);

    decorations.forEach(decoration => {
      const method = decoration.method;
      const returnee = decoration.return || this.parent;
      const key = decoration.key || method;
      this.parent[method] = data => {
        this.set(key, data);
        return returnee
      };
    });

    return this
  }

  /**
   * @FIXME @TODO needs thought
   * @param {string} name
   * @param {Object} Chain
   * @return {ChainedMapExtendable}
   */
  addChain(name, Chain) {
    // making name available as a property on chainable
    if (typeof name !== 'string') Chain = name;
    const chained = new Chain(this);
    name = chained.name || name;
    this[name] = chained;
    this.chains.push(name);
    return this
  }

  // --- extend extend ---

  /**
   * @param  {Array<string>} methods
   * @param  {string}  name
   * @param  {Boolean} [thisArg=null]
   * @return {ChainedMap}
   */
  extendAlias(methods, name, thisArg = null) {
    methods.forEach(method => (this[method] = this[name].bind(thisArg || this)));
    return this
  }

  /**
   * @param {Array<string>} methods
   * @param {any} val
   * @param {string} [prefix='no']
   * @param {string} [inverseValue='todo']
   * @return {ChainedMapExtendable}
   */
  extendPrefixed(methods, val, prefix$$1 = 'no', inverseValue = 'todo') {
    this.extendWith(methods, val);
    this.extendWith(
      methods.map(method => addPrefix(method, prefix$$1)),
      !val,
      prefix$$1
    );
    return this
  }

  /**
   * @desc add methods for keys with default values,
   *       and inverse functions to set the value to the opposite
   * @param {Array<string>} methods
   * @param {any} val
   * @param {string} [prefix]
   * @return {ChainedMapExtendable}
   */
  extendWith(methods, val, prefix$$1) {
    const objMethods = arrToObj_1(methods, val);
    const keys = Object.keys(objMethods);
    this.shorthands = [...this.shorthands, ...keys];
    keys.forEach(method => {
      // value = objMethods[method]
      this[method] = value => {
        if (value === undefined || value === null) value = val;
        if (prefix$$1) return this.set(removePrefix(method, prefix$$1), value)
        return this.set(method, value)
      };
    });
    return this
  }

  // --- boolean & increment presets ---

  /**
   * @see ChainedMapExtendable.extendPrefixed
   * @param {Array<string>} methods
   * @param {any} val
   * @param {string} [prefix='no']
   * @return {ChainedMapExtendable}
   */
  extendBool(methods, val, prefix$$1 = 'no') {
    this.extendPrefixed(methods, !val, prefix$$1);
    return this
  }

  /**
   * @see ChainedMapExtendable.extendWith
   * @param {Array<string>} methods
   * @return {ChainedMapExtendable}
   */
  extendFalse(methods) {
    this.extendWith(methods, false);
    return this
  }

  /**
   * @see ChainedMapExtendable.extendWith
   * @param {Array<string>} methods
   * @return {ChainedMapExtendable}
   */
  extendTrue(methods) {
    this.extendWith(methods, true);
    return this
  }

  /**
   * @description when called, increments the value
   * @param  {Array<string>} methods
   * @return {ChainedMap}
   */
  extendIncrement(methods) {
    // every time it is called, just increment
    // add to this.shorthands
    methods.forEach(method => {
      this.shorthands.push(method);
      this[method] = () => {
        let value = (this.get(method) | 0) + 1;
        this.set(method, value);
        return this
      };
    });
    return this
  }

  /**
   * @description uses an object, loops through keys, adds method
   * @see ChainedMapExtendable.shorthands
   *
   * @param  {Object} methods
   * @return {ChainedMap}
   */
  extendDefault(methods) {
    this.shorthands = [...this.shorthands, ...methods];

    Object.keys(methods).forEach(method => {
      this[method] = (value = methods[method]) => this.set(method, value);
    });

    return this
  }
}

var ChainedMapExtendable_1 = ChainedMapExtendable;

class FactoryChain extends ChainedMapExtendable_1 {
  constructor(parent) {
    super(parent);

    this.data = {};
    this.factory();
    super.extend(['optional', 'required', 'chainUpDown']);
    super.extendIncrement(['chainLength']);
    this._calls = new ChainedSet_1(this);
  }

  // chain back up to parent for any of these
  // should have a debug log for this
  chainUpDowns(methods) {
    methods.forEach(method => {
      this[method] = (arg1, arg2, arg3, arg4, arg5) => {
        this.end();
        return this.parent[method](arg1, arg2, arg3, arg4, arg5)
      };
    });
    return this
  }

  _call(name) {
    this._calls.add(name);
    return this
  }

  extend(props) {
    super.extend(props);
    return this
  }

  props(names) {
    names.forEach(name => this.prop(name));
    return this
  }

  onDone(cb) {
    return this.set('onDone', cb)
  }

  magicReturn() {
    if (this._calls.length === this.get('chainLength')) {
      return this.end()
    }
    return this
  }

  prop(name, cb = null) {
    this.chainLength();

    // so if we call a property twice,
    // chain back up to parent,
    // add a new chain
    if (this[name] !== undefined && this.has('chainUpDown') === true) {
      this.end();
      return this.get('chainUpDown')()[name](cb)
    }

    // @TODO need to spread as needed
    this[name] = args => {
      if (cb !== null) cb(args);
      else this.data[name] = args;

      this._call(name);

      return this.magicReturn()
    };
    return this
  }

  getData(prop = null) {
    if (prop !== null) {
      return this.data[prop]
    }
    return this.data
  }

  factory(obj = {}) {
    this.end = arg => {
      if (obj.end !== undefined) {
        const ended = obj.end(this.data, this.parent, this, arg);
        if (ended && ended !== this) return ended
      }
      else if (this.has('onDone')) {
        const ended = this.get('onDone')(this.data, this.parent, this, arg);
        if (ended && ended !== this) return ended
      }

      return this.parent
    };

    return this
  }
}

FactoryChain.FactoryChain = FactoryChain;
var FactoryChain_1 = FactoryChain;

class TypeChainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
    else {
      this.stack = new Error(message).stack;
    }
  }
}

class TypeChain extends ChainedMapExtendable_1 {
  constructor(parent) {
    super(parent);
  }

  validators(validators) {
    if (this.has('validators')) {
      const merged = dopemerge_1(this.get('validators'), validators);
      return this.set('validators', merged)
    }
    return this.set('validators', validators)
  }

  /**
   * @desc add a validated function to do .set
   * @param  {string | null} [name=null] shorthand for .name
   * @return {FactoryChain} @chainable
   */
  typed(name = null) {
    const typed = new FactoryChain_1(this);

    const chain = typed
      .prop('type')
      .prop('name')
      .prop('onInvalid')
      .prop('onValid')
      .chainUpDown(this.typed)
      .chainUpDowns(['typed'])
      .onDone(data => {
        this.extendTyped(data.name, data.type, data.onInvalid, data.onValid);
      });

    if (name !== null && typeof name === 'string') {
      chain.name(name);
      return chain
    }
    if (name !== null && typeof name === 'object') {
      return chain.merge(name).end()
    }

    return chain
  }

  // or fn
  extendTyped(name, type, onInvalid = null, onValid = null) {
    this[name] = arg => {
      const typeError = () => {
        const errorMsg = `[typof: ${typeof name}, name: ${name}] was not of type ${type}`;
        return new TypeChainError(errorMsg)
      };
      if (onInvalid === null) {
        onInvalid = e => {
          throw typeError()
        };
      }
      const validator = typeof type === 'string' ?
        this.get('validators')[type] :
        type;

      if (typeof validator !== 'function') {
        console.error({validators: this.get('validators')}, '\n\n');
        throw new TypeChainError(`${validator} for ${type} was not a function`)
      }

      let valid = true;

      try {
        valid = validator(arg);
      }
      catch (e) {
        valid = e;
      }

      if (this.get('debug') === true) {
        // console.log('validating: ', {valid, arg, name})
      }

      // .error, .stack, === 'object'
      if (valid === null || valid === true) {
        this.set(name, arg);
        if (onValid !== null) onValid(arg, this, typeError());
      }
      else {
        onInvalid(arg, this);
      }
      return this
    };
  }
}

TypeChain.TypeChain = TypeChain;
var TypeChain_1 = TypeChain;

// try {
//   require.resolve('immutable')
//   const immutablejs = require('immutable')
// }
// catch (e) {
//   // use normal map
// }

// @TODO:
//  - set the type to use,
//  - auto extend methods of that type
//  - do not spread args
// https://facebook.github.io/immutable-js/docs/#/Collection
class ImmutableChain extends ChainedMapExtendable_1 {
  // @TODO not sure parent is best
  constructor(parent = new Map()) {
    super(parent);
    this.immutableStore = parent;
  }

  delete(key) {
    if (this.immutableStore !== undefined) {
      this.immutableStore = this.immutableStore.delete(key);
    }

    super.delete(key);
    return this
  }

  set(key, value) {
    if (this.immutableStore !== undefined) {
      this.immutableStore = this.immutableStore.set(key, value);
    }
    super.set(key, value);
    return this
  }

  merge(obj) {
    if (this.immutableStore !== undefined) {
      this.immutableStore = this.immutableStore.merge(obj);
    }
    super.merge(obj);
    return this
  }

  equals(obj) {
    return this.immutableStore.equals(obj)
  }

  // getIn(...args) {
  //   return this.immutableStore.getIn(...args)
  // }
  // setIn(...args) {
  //   this.immutableStore = this.immutableStore.setIn(...args)
  //   return this
  // }
  // toJS(computed = false): boolean {
  //   return this.immutableStore.toJS(computed)
  // }
}

ImmutableChain.ImmutableChain = ImmutableChain;
var ImmutableChain_1 = ImmutableChain;

class ChildChain extends ChainedMapExtendable_1 {
  constructor(parent) {
    super(parent);
    this.store = parent.store;
    this.set = parent.set.bind(parent);
    this.get = parent._get.bind(parent);
    this.has = parent.has.bind(parent);
    // this.childStore = new Map()
  }
}

ChildChain.ChildChain = ChildChain;
var ChildChain_1 = ChildChain;

// core





// extended





// export
const exp = TypeChain_1;
exp.Chainable = Chainable;
exp.ChainedSet = ChainedSet_1;
exp.ChainedMap = ChainedMap_1;
exp.MergeChain = MergeChain_1;
exp.ChainedMapExtendable = ChainedMapExtendable_1;
exp.Chain = TypeChain_1;
exp.ImmutableChain = ImmutableChain_1;
exp.ChildChain = ChildChain_1;
exp.dopemerge = dopemerge_1;
var index = exp;

module.exports = index;
