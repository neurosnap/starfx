import "@testing-library/jest-dom";
// jsdom doesn't have the fetch API which we need for Response()
//  so polyfilling it here for every file
// see https://github.com/jsdom/jsdom/issues/1724
import "whatwg-fetch";
