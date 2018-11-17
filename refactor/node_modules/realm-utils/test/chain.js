var should = require('should');
var realm = require('../dist/commonjs/index.js');


describe('Testing chain', function() {

    it('Should initiate chain', function(done) {

        class MyChain {
            setFoo() {
                return "foo";
            }
            setBar() {
                return "bar";
            }
        }

        realm.chain(MyChain).then(function(result) {
            result.should.deepEqual({
                foo: "foo",
                bar: "bar"
            })
            done();
        }).catch(done);

    });

    it('Should initiate chain, but without storing non-setter', function(done) {

        class MyChain {
            setFoo() {
                return "foo";
            }
            setBar() {
                return "bar";
            }
            justPassing() {
                return {
                    "a": 1
                }
            }
        }

        realm.chain(MyChain).then(function(result) {
            result.should.deepEqual({
                foo: "foo",
                bar: "bar"
            })
            done();
        }).catch(done);

    });

    it('Formatter should be executed', function(done) {

        class MyChain {
            setFoo() {
                return "foo";
            }
            setBar() {
                return "bar";
            }
            format() {
                return {
                    coo: this.foo
                }
            }
        }

        realm.chain(MyChain).then(function(result) {
            result.should.deepEqual({
                coo: "foo"
            })
            done();
        }).catch(done);
    });

    it('Regular methods should be executed', function(done) {

        class MyChain {
            setFoo() {
                return "foo";
            }
            setBar() {
                return "bar";
            }
            justHello() {
                this.iWasThere = 1;
            }
            format() {
                return {
                    there: this.iWasThere,
                    coo: this.foo
                }
            }
        }

        realm.chain(MyChain).then(function(result) {
            result.should.deepEqual({
                coo: "foo",
                there: 1
            })
            done();
        }).catch(done);
    });

    it('Should understand created classes', function(done) {

        class MyChain {
            setFoo() {
                return "foo";
            }
            setBar() {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        return resolve("bar1")
                    }, 1)
                })
            }
        }

        realm.chain(new MyChain()).then(function(result) {
            result.should.deepEqual({
                foo: "foo",
                bar: "bar1"
            })
            done();
        }).catch(done);
    });
    it('Should understand breaking ', function(done) {

        class MyChain {
            setFoo() {
                return "foo";
            }
            stopMeHere() {
                this.break();
            }

            setPoo() {
                return "poo"
            }
        }

        realm.chain(MyChain).then(function(result) {
            result.should.deepEqual({
                foo: "foo"
            })
            done();
        }).catch(done);
    });

    it('Should understand breaking with manual output ', function(done) {

        class MyChain {
            setFoo() {
                return "foo";
            }
            stopMeHere() {
                this.break(1);
            }

            setPoo() {
                return "poo"
            }
        }

        realm.chain(MyChain).then(function(result) {

            result.should.deepEqual(1)
            done();
        }).catch(done);
    });

    it('Should kill the chain and resolve undefined ', function(done) {

        class MyChain {
            setFoo() {
                return "foo";
            }
            stopMeHere() {
                this.kill();
            }

            setPoo() {
                return "poo"
            }
        }

        realm.chain(MyChain).then(function(result) {
            should.equal(result, undefined);
            done();
        }).catch(done);
    });

});