/// <reference path="../dts/typings/mocha/mocha.d.ts" />
/// <reference path="../dts/typings/chai/chai.d.ts" />
import chai = require('chai');
var expect = chai.expect;

describe('User Model Unit Tests:', () => {

    describe('2 + 4', () => {
        it('should be 6', (done) => {
            expect(2+4).to.equals(6);
            done();
        });

        it('should not be 7', (done) => {
            expect(2+4).to.not.equals(7);
            done();
        });
    });
});
