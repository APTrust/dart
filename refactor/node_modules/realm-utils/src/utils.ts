const funcProto = Function.prototype;
const objectProto = Object.prototype;
const funcToString = funcProto.toString;
const hasOwnProperty = objectProto.hasOwnProperty;
const objectCtorString = funcToString.call(Object);
const objectToString = objectProto.toString;
const objectTag = '[object Object]';
const funcTag = '[object Function]';
const AsyncfuncTag = '[object AsyncFunction]';
const funcTag2 = '[Function]';
const AsyncfuncTag2 = '[AsyncFunction]';
const genTag = '[object GeneratorFunction]';


export class Utils {

  // isPromise()
  static isPromise(item: any): item is Promise<any> {
    return item
      && typeof item.then === 'function' &&
      typeof item.catch === 'function';
  }

  // isNotSet (undefined and null will return true)
  static isNotSet(input: any) {
    return input === undefined || input === null;
  }

  static isMap(input: any): input is Map<any,any> {
    if (typeof Map === "undefined") {
      return false;
    }
    return input instanceof Map;
  }

  static isSet(input: any): input is Set<any> {
    if (typeof Set === "undefined") {
      return false;
    }
    return input instanceof Set;
  }

  static isFunction(value: any): value is Function {
    var tag = this.isObject(value) ? objectToString.call(value) : '';
    return (tag === funcTag2 || tag === AsyncfuncTag2 ) || (tag == funcTag || tag === AsyncfuncTag) || tag == genTag;
  }

  //isObject
  static isObject(input: any): input is Object {
    var type = typeof input;
    return !!input && (type == 'object' || type == 'function');
  }

  //isHostObject
  static isHostObject(value) {
    // Many host objects are `Object` objects that can coerce to strings
    // despite having improperly defined `toString` methods.
    var result = false;
    if (value != null && typeof value.toString != 'function') {
      try {
        result = !!(value + '');
      } catch (e) { }
    }
    return result;
  }

  //overArg
  static overArg(func, transform) {
    return function (arg) {
      return func(transform(arg));
    };
  }

  // isObjectLike
  static isObjectLike(value) {
    return !!value && typeof value == 'object';
  }

  // Flatten argumetns
  // flatten('a', 'b', ['c']) -> ['a', 'b', 'c']
  static flatten(data: any) {
    return [].concat.apply([], data);
  }

  // sets hidden property
  static setHiddenProperty(obj: Object, key: string, value: Object): any {
    Object.defineProperty(obj, key, {
      enumerable: false,
      value: value
    });
    return value;
  }

  static isString(value: any): value is string {
    return typeof value === 'string';
  }

  // isArray
  static isArray(input: any): input is Array<any> {
    return Array.isArray(input);
  }

  // isPlainObject
  static isPlainObject(value) {
    if (!this.isObjectLike(value) ||
      objectToString.call(value) != objectTag || this.isHostObject(value)) {
      return false;
    }
    var proto = this.overArg(Object.getPrototypeOf, Object)(value);
    if (proto === null) {
      return true;
    }
    var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
    return (typeof Ctor == 'function' &&
      Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString);
  }

  // gets parameter names
  static getParameterNamesFromFunction(func: any) {
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    var ARGUMENT_NAMES = /([^\s,]+)/g;
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null)
      result = [];
    return result;
  }

}
