/// <reference path="../../../dts/typings/mocha/mocha.d.ts" />
/// <reference path="../../../dts/typings/chai/chai.d.ts" />
/// <reference path="../../../src/references.ts" />

import chai = require('chai');
import File = require('../../../src/providers/File');
import ParsableString = require('../../../src/ParsableString');
import {Suggestion} from "../../../src/Interfaces";
import Invocation = require("../../../src/Invocation");
var expect = chai.expect;

chai.use(require('chai-things'));

describe('History', () => {
    describe('size', () => {
        it('works correctly with "../" lexeme', (done) => {
            var invocation = new Invocation(process.cwd(), { columns: 40, rows: 40});
            invocation.setPromptText('cd ../');

            new File().getSuggestions(invocation.getPrompt()).then((results) => {
                (<any>expect(results).to.contain).a.thing.with.property('value', 'black-screen/');
                done();
            })
        });

        it('does not display files for cd', (done) => {
            var invocation = new Invocation(process.cwd(), { columns: 40, rows: 40});
            invocation.setPromptText('cd ');

            new File().getSuggestions(invocation.getPrompt()).then((results: Suggestion[]) => {
                results.forEach((result) => {
                    return expect(result.value.endsWith("/")).to.be.true;
                });
                done();
            })
        });
    });
});
