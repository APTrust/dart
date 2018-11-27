import { Utils as utils } from './utils';
import { Each } from './each';



export class Chainable {
    protected $finalized: boolean = false;
    protected $killed: boolean = false;
    protected $manual: any;
    protected $collection: Object = {};

    /**
     * protected - break
     *
     * @param  {any} manual : Any object
     * @return {void}
     */
    protected break(manual: any): void {
        this.$finalized = true;
        this.$manual = manual;
    }

    /**
     * protected - kill
     * Kills the chain
     * @return {void}
     */
    protected kill(): void {
        this.$finalized = true;
        this.$killed = true;
    }
}

/**
 * Validates and creates extra properties for the class
 * Supports non-typescript usage
 * For typescript Chainable class if required
 */
let ChainClassContructor = (input: any) => {
    if (input instanceof Chainable) {
        return input;
    }

    let instance: Object = {};
    // if that's function'
    if (utils.isFunction(input)) {
        instance = new input();
        if( instance instanceof Chainable ){
            return instance;
        }
    } else if (utils.isObject(input)) {
        instance = input;
    } else {
        throw new Error("Chain requires a Class or an Instance")
    }
    instance['$collection'] = {};
    instance['break'] = manual => {
        utils.setHiddenProperty(instance, '$finalized', true);
        utils.setHiddenProperty(instance, '$manual', manual);
    }
    instance['kill'] = () => {
        utils.setHiddenProperty(instance, '$finalized', true);
        utils.setHiddenProperty(instance, '$killed', true);
    }
    return instance;
}

/**
 * Chain class
 * Executes methods in order
 */
export const Chain = (cls: any) => {
    let instance = ChainClassContructor(cls);
    let props = Object.getOwnPropertyNames(instance.constructor.prototype);
    let tasks = [];

    // collecting props and checking for setters
    for (var i = 1; i < props.length; i++) {
        let propertyName = props[i];
        if (!(propertyName in ["format", 'kill', 'break'])) {
            let isSetter = propertyName.match(/^set(.*)$/);
            let setterName = null;
            if (isSetter) {
                setterName = isSetter[1]
                setterName = setterName.charAt(0).toLowerCase() + setterName.slice(1);
            }
            tasks.push({
                prop: propertyName,
                setter: setterName,
            });
        }
    }

    // Store it to the property of the class'
    let store = function (prop, val): void {
        instance.$collection[prop] = val;
        instance[prop] = val;
    }

    // Evaluate
    let evaluate = function (task): any {
        var result = instance[task.prop].apply(instance);
        if (task.setter) {
            if (utils.isPromise(result)) {
                return result.then(res => { store(task.setter, res) });
            } else store(task.setter, result);
        }
        return result;
    }

    // Calling tasks in order they have been created
    return Each(tasks, (task: any) => {
        return !instance.$finalized ? evaluate(task) : false;
    }).then(() => {
        if (utils.isFunction(instance["format"])) {
            return evaluate({
                prop: "format"
            });
        }
    }).then(specialFormat => {
        if (instance.$killed) return;
        if (!instance.$manual) {
            if (specialFormat) return specialFormat;
            return instance.$collection;
        } else
            return instance.$manual;
    });
}
