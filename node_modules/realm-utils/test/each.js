var should = require('should');
var realm = require('../dist/commonjs/index.js');
var each = realm.each;

describe('Testing promise each', function() {

    it('Should iterate just promises', function(done) {
        var promise1 = new Promise(function(resolve, reject) {
            return resolve("1");
        });
        var promise2 = new Promise(function(resolve, reject) {
            return resolve("2");
        });

        realm.each([promise1, promise2]).then(function(values) {
            values[0].should.be.equal("1");
            values[1].should.be.equal("2");
            done();
        });
    });
    it('Should iterate each with promises', function(done) {
        var data = ["pukka", "sukka", "kukka"];

        realm.each(data, function(value) {
            return new Promise(function(resolve, reject) {
                resolve(value);
            });
        }).then(function(response) {
            should.deepEqual(data, response);
            done();
        }).catch(function(e) {
            console.log(e);
        });
    });

    it('Should iterate objects', function(done) {

        var data = { foo: 1, bar: 2 }

        realm.each(data, function(value, key) {

            return [key, value]
        }).then(function(response) {

            should.deepEqual([
                ['foo', 1],
                ['bar', 2]
            ], response);
            done();
        }).catch(function(e) {
            console.log(e);
        });
    });


    it('Should ignore undefines', function(done) {

        realm.each(undefined, function(value, key) {

            return [key, value]
        }).then(function(response) {

            done();
        }).catch(function(e) {
            console.log(e);
        });
    });


    it('Should work with Maps', function(done) {
        let map = new Map();
        map.set("hello", "world")
        map.set("foo", "bar")
        realm.each(map, function(value, key) {
            return new Promise((resolve, reject) => {
                return resolve(key)
            });
        }).then(function(response) {
            response.should.deepEqual(['hello', 'foo'])
            done();
        }).catch(done);
    });

    it('Should work with Maps and promises', function(done) {
        let map = new Map();
        map.set("hello", "world")
        map.set("foo", "bar")
        realm.each(map, function(value, key) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    return resolve(key)
                }, 20)

            });
        }).then(function(response) {
            response.should.deepEqual(['hello', 'foo'])
            done();
        }).catch(done);
    });


    it('Should work with Sets', function(done) {
        let set = new Set();
        set.add("foo")
        set.add("bar")

        realm.each(set, function(value) {
            return new Promise((resolve, reject) => {
                return resolve(value)
            });
        }).then(function(response) {

            response.should.deepEqual(['foo', 'bar'])
            done();
        }).catch(done);
    });

    it('Should work with Sets and promises', function(done) {
        let set = new Set();
        set.add("foo")
        set.add("bar")

        realm.each(set, function(value) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    return resolve(value + ".")
                }, 20)
            });
        }).then(function(response) {
            response.should.deepEqual(['foo.', 'bar.'])
            done();
        }).catch(done);
    });

    it('Should work with Sets and promises within', function(done) {
        let set = new Set();
        set.add(new Promise((resolve, reject) => {
            return resolve("a")
        }))
        set.add(new Promise((resolve, reject) => {
            return resolve("b")
        }))


        realm.each(set, function(value) {
            return value;
        }).then(function(response) {
            response.should.deepEqual(['a', 'b'])
            done();
        }).catch(done);
    });

    it('Should respect undefines within', function(done) {
        let set = new Set();
        set.add("foo")
        set.add("bar")
        set.add(undefined)

        realm.each(set, function(value) {
            return new Promise((resolve, reject) => {
                return resolve(value)
            });
        }).then(function(response) {

            response.should.deepEqual(['foo', 'bar', undefined])
            done();
        }).catch(done);
    });
});