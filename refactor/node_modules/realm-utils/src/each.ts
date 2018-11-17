import { Utils as utils } from './utils';


/**
 * Each function
 * Iterates any objects including Promises
 */
export var Each = (argv: any, cb: { (...args): any }): Promise<any> => {
    return new Promise((resolve, reject) => {
        const results = [];
        const isObject = utils.isPlainObject(argv);
        const isMap = utils.isMap(argv);
        const isSet = utils.isSet(argv);

        if (!argv) {
            return resolve(results)
        }
        // Handle map and set differently
        if (isMap || isSet) {

            let iterator;
            if (isMap) {
                let map: Map<any, any> = argv;
                iterator = map.entries();
            }
            if (isSet) {
                let set: Set<any> = argv;
                iterator = set.values()
            }
            let index = -1;
            let iterateMap = (data: any) => {
                index++;
                if (data.done) {
                    return resolve(results);
                }
                let k, v, res;
                if (isMap) {
                    [k, v] = data.value;
                    res = cb(...[v, k]);
                }
                if (isSet) {
                    v = data.value;
                    res = cb(v);
                }
                if (utils.isPromise(res)) {
                    res.then(a => {
                        results.push(a);
                        iterateMap(iterator.next());
                    }).catch(reject);
                } else {
                    results.push(res);
                    iterateMap(iterator.next());
                }
            }
            iterateMap(iterator.next());
            return;
        }
        const dataLength = isObject ? Object.keys(argv).length : argv.length

        let index: number = -1;
        let iterate = () => {
            index++;
            if (index < dataLength) {
                let key = isObject ? Object.keys(argv)[index] : index;
                let value = isObject ? argv[key] : argv[index];
                // Promises need to be resolved
                if (utils.isPromise(value)) {
                    value.then(data => { results.push(data); iterate(); }).catch(reject);
                } else {
                    let res = cb(...[value, key]);
                    if (utils.isPromise(res)) {
                        res.then((a) => {
                            results.push(a);
                            iterate();
                        }).catch(reject);
                    } else {
                        results.push(res);
                        iterate();
                    }
                }
            } else return resolve(results);
        };
        return iterate();
    });
}
