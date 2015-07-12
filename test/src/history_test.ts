/// <reference path="../../dts/typings/mocha/mocha.d.ts" />
/// <reference path="../../dts/typings/chai/chai.d.ts" />
/// <reference path="../../src/references.ts" />

import chai = require('chai');
import History = require('../../src/History');
var expect = chai.expect;

describe('History', () => {

    afterEach(() => { History.clear() });

    describe('size', () => {
        it('is zero after creation', () => {
            expect(History.size()).to.equals(0);
        });

        it('increases after appending', () => {
            History.append("ls");
            expect(History.size()).to.equals(1);

            History.append("cd");
            expect(History.size()).to.equals(2);
        });
    });

    describe('append', () => {
        it('appends items', () => {
            History.append("ls");
            History.append("cd");

            expect(History.size()).to.equals(2);
        });

        it('does not append the same item twice', () => {
            History.append("ls");
            History.append("cd");
            History.append("ls");

            expect(History.size()).to.equals(2);
        });
    });

    describe('getPrevious', () => {
        it('keeps track of internal position', () => {
            History.append("ls");
            History.append("cd");

            expect(History.getPrevious()).to.equals('cd');
            expect(History.getPrevious()).to.equals('ls');
        });

        it('does not overflow', () => {
            History.append("ls");

            expect(History.getPrevious()).to.equals('ls');
            expect(History.getPrevious()).to.equals('ls');
        });
    });

    describe('getNext', () => {
        it('moves the position forward', () => {
            History.append("ls");
            History.append("cd");

            History.getPrevious();
            History.getPrevious();
            expect(History.getNext()).to.equals('cd');
        });

        it('overflows', () => {
            History.append("ls");

            return expect(History.getNext()).to.be.undefined;
        });
    });
});
