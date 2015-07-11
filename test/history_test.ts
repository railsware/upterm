/// <reference path="../dts/typings/mocha/mocha.d.ts" />
/// <reference path="../dts/typings/chai/chai.d.ts" />
import chai = require('chai');
import History = require('../src/History');
var expect = chai.expect;

describe('History', () => {

    afterEach(() => { History.clear() });

    describe('size', () => {
        it('is zero after creation', (done) => {
            expect(History.size()).to.equals(0);
            done();
        });

        it('increases after appending', () => {
            History.append("ls");
            expect(History.size()).to.equals(1);

            History.append("cd");
            expect(History.size()).to.equals(2);
        });
    });
});
