/// <reference path="../../../dts/typings/mocha/mocha.d.ts" />
/// <reference path="../../../dts/typings/chai/chai.d.ts" />
/// <reference path="../../../src/references.ts" />

import chai = require('chai');
import File = require('../../../src/providers/File');
import ParsableString = require('../../../src/ParsableString');
var expect = chai.expect;

chai.use(require('chai-things'));

describe('History', () => {
    describe('size', () => {
        it('works correctly with "../" lexeme', (done) => {
            new File().getSuggestions(process.cwd(), new ParsableString('cd ../')).then((results) => {
                (<any>expect(results).to.contain).a.thing.with.property('value', 'black-screen/');
                done();
            })
        });
    });
});
