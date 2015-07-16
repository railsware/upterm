/// <reference path="../../../dts/typings/mocha/mocha.d.ts" />
/// <reference path="../../../dts/typings/chai/chai.d.ts" />
/// <reference path="../../../src/references.ts" />

import chai = require('chai');
import Invocation = require('../../../src/Invocation');
var expect = chai.expect;

chai.use(require('chai-things'));

describe('Invocation', () => {
    describe('execute', () => {
        it('can execute a command with a trailing space', (done) => {
            var invocation = new Invocation(process.cwd(), { columns: 40, rows: 40});
            invocation.setPromptText('pwd ');

            invocation.on('end', () => {
                expect(invocation.getBuffer().toString()).to.eq(process.cwd());
                done();
            });

            invocation.execute();
        });
    });
});
