/// <reference path="../../typings/index.d.ts" />

require("chai").should();

class Calculator {
    public add(x: number, y: number): number {
        return x + y;
    }
    public sub(x: number, y: number): number {
        return x - y;
    }
}

describe("calculator test", () => {
    let calc: Calculator = null;

    beforeEach(() => {
        calc = new Calculator();
    });

    afterEach(() => {
        calc = null;
    });

    it("calculates addition", () => {
        calc.add(2, 3).should.equal(5);
    });

    it("calculates subtraction", () => {
        calc.sub(5, 3).should.equal(2);
    });
});