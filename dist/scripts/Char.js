/// <reference path="References.ts" />
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var React = require('react');
var e = require('./Enums');
var _ = require('lodash');
var Decorators_1 = require("./Decorators");
var Char = (function () {
    function Char(char, attributes) {
        this.char = char;
        this.attributes = attributes;
        if (char.length !== 1) {
            throw ("Char can be created only from a single character; passed " + char.length + ": " + char);
        }
    }
    Char.flyweight = function (char, attributes) {
        return new Char(char, attributes);
    };
    Char.prototype.getCharCode = function () {
        return e.CharCode[e.CharCode[this.char.charCodeAt(0)]];
    };
    Char.prototype.getAttributes = function () {
        return _.clone(this.attributes);
    };
    Char.prototype.toString = function () {
        return this.char;
    };
    Char.prototype.isSpecial = function () {
        var charCode = this.char.charCodeAt(0);
        return charCode < 32 && charCode !== 9;
    };
    Object.defineProperty(Char, "flyweight",
        __decorate([
            Decorators_1.memoize()
        ], Char, "flyweight", Object.getOwnPropertyDescriptor(Char, "flyweight")));
    return Char;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Char;
