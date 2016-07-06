/// <reference path="../../typings/index.d.ts" />

import * as sinon from "sinon";

export type ExpectationFunction = (e: sinon.SinonExpectation) => void;
export type MockMethods = {[method: string]: ExpectationFunction};

/**
 * Convenience wrapper for generating stubs and mocks, based on the Sinon
 * library.
 * 
 * Arguments:
 *      methods     A mapping of function names to expectation functions
 *                  (which also implement the Sinon stub interface).
 *                  If the function is null, the method is stubbed only.
 * 
 * Returns: [object, mock]
 *                  An object (partially) implementing the stubbed interface,
 *                  and its corresponding mock.
 */
export function Mock<Interface>(methods: MockMethods): [Interface, sinon.SinonMock] {
    // Create stub functions for every listed method.
    // The stub object will probably not conform to Interface, but we cast it
    // so that it is useable as such.
    let stub = <Interface>{};
    const voidFunction = (): void => void 0;
    for (let method in methods) {
        if (methods.hasOwnProperty(method)) {
            (<any>stub)[method] = voidFunction;
        }
    }

    let mock = sinon.mock(stub);

    // Call the expectation functions for all listed methods, where defined.
    for (let method in methods) {
        if (methods.hasOwnProperty(method) && methods[method]) {
            let expectation = mock.expects(method);
            methods[method](expectation);
        }
    }

    return [stub, mock];
}