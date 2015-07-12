/// <reference path="../../../dts/typings/mocha/mocha.d.ts" />
/// <reference path="../../../dts/typings/chai/chai.d.ts" />
/// <reference path="../../../src/references.ts" />

import chai = require('chai');
import File = require('../../../src/providers/File');
import ParsableString = require('../../../src/ParsableString');
var expect = chai.expect;

describe('History', () => {
    describe('size', () => {
        it('works correctly with "../" lexeme', (callback) => {
            new File().getSuggestions('/Users/me/', new ParsableString('cd ../')).then((results) => {
                expect(results).to.eq(1);
                callback();
            })
        });
    });
});
