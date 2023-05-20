import { describe, expect, it } from "../test.ts";
import type { ActionWithPayload } from "./types.ts";
import { createApi } from "./api.ts";
import { poll } from "./saga.ts";

const getKeyOf = (action: ActionWithPayload<{ key: string }>): string =>
  action.payload.key;

const tests = describe("create-key");

it(
  tests,
  "options object keys order for action key identity - 0: empty options",
  () => {
    const api = createApi();
    api.use(api.routes());
    // no param
    const action0 = api.get(
      "/users",
      { supervisor: poll(5 * 1000) }, // with poll middleware
      function* (ctx, next) {
        ctx.request = {
          method: "GET",
        };
        yield* next();
      },
    );
    const sendNop0 = action0();
    const sendNop1 = action0();
    expect(getKeyOf(sendNop0)).toEqual(getKeyOf(sendNop1));
  },
);

it(
  tests,
  "options object keys order for action key identity - 1: simple object",
  () => {
    const api = createApi();
    api.use(api.routes());
    // no param
    const action0 = api.get<{
      [key: string]: string | boolean | number | null | undefined;
    }>(
      "/users",
      { supervisor: poll(5 * 1000) }, // with poll middleware
      function* (ctx, next) {
        ctx.request = {
          method: "GET",
        };
        yield* next();
      },
    );
    const sendPojo0 = action0({
      a: "a",
      b: "b",
      c: 1,
      d: 2,
      e: true,
      f: false,
      "100": 100,
      101: "101",
    });
    const sendPojo1 = action0({
      a: "a",
      b: "b",
      c: 1,
      d: 2,
      e: true,
      f: false,
      100: 100,
      101: "101",
    });
    const sendPojo2 = action0({
      e: true,
      f: false,
      "100": 100,
      "101": "101",
      a: "a",
      b: "b",
      c: 1,
      d: 2,
    });
    const sendPojo3 = action0({
      e: true,
      f: false,
      "100": 100,
      "101": "101",
      a: "a",
      b: "b",
      c: 1,
      d: 2000000,
    });
    const sendPojo4 = action0({
      e: null,
      f: false,
      "100": undefined,
      "101": "101",
      a: "a",
      b: "b",
      c: 1,
      d: `Thomas O'Malley`,
    });
    const sendPojo5 = action0({
      d: `Thomas O'Malley`,
      e: null,
      f: false,
      "100": undefined,
      "101": "101",
      a: "a",
      b: "b",
      c: 1,
    });
    expect(getKeyOf(sendPojo0)).toEqual(getKeyOf(sendPojo1));
    expect(getKeyOf(sendPojo0)).toEqual(getKeyOf(sendPojo2));
    expect(getKeyOf(sendPojo0)).not.toEqual(getKeyOf(sendPojo3));
    expect(getKeyOf(sendPojo4)).toEqual(getKeyOf(sendPojo5));
  },
);

it(
  tests,
  "options object keys order for action key identity - 2: object (with array values)",
  () => {
    interface Ip0 {
      param1: string;
      param2: string[];
    }
    const api = createApi();
    api.use(api.routes());
    const action = api.get<Ip0>(
      "/users/:param1/:param2",
      function* (ctx, next) {
        ctx.request = {
          method: "GET",
        };
        yield* next();
      },
    );
    const sendFirst = action({ param1: "1", param2: ["2", "e", "f"] });
    const sendSecond = action({ param2: ["2", "f", "e"], param1: "1" });
    const sendThird = action({ param2: ["2", "e", "f"], param1: "1" });
    expect(getKeyOf(sendFirst)).not.toEqual(getKeyOf(sendSecond));
    expect(getKeyOf(sendFirst)).toEqual(getKeyOf(sendThird));
  },
);

it(
  tests,
  "options object keys order for action key identity - 3: nested object",
  () => {
    interface Ip0 {
      param1: string;
      param2: string[];
    }
    interface Ip1 {
      param1: string;
      param2: string;
      param3: number;
      param4: Ip0;
      param5: boolean;
    }
    const o1: Ip1 = {
      param1: "1",
      param2: "2",
      param3: 3,
      param4: {
        param1: "4",
        param2: ["5", "6"],
      },
      param5: true,
    };
    const o2: Ip1 = {
      param4: {
        param1: "4",
        param2: ["5", "6"],
      },
      param5: true,
      param2: "2",
      param1: "1",
      param3: 3,
    };
    const api = createApi();
    api.use(api.routes());
    //nested with array
    const action2 = api.get<Ip1>(
      "/users/:param1/:param2/:param3/:param4/:param5",
      function* (ctx, next) {
        ctx.request = {
          method: "GET",
        };
        yield* next();
      },
    );
    const sendO1 = action2(o1);
    const sendO2 = action2(o2);
    const sendO3 = action2({
      ...o1,
      param4: { ...o1.param4, param2: ["5", "6", "7"] },
    });
    expect(getKeyOf(sendO1)).toEqual(getKeyOf(sendO2));
    expect(getKeyOf(sendO1)).not.toEqual(getKeyOf(sendO3));
  },
);

it(
  tests,
  "options object keys order for action key identity - 4: deepNested object",
  () => {
    interface Ip0 {
      param1: string;
      param2: string[];
    }
    interface Ip1 {
      param1: string;
      param2: string;
      param3: number;
      param4: Ip0;
      param5: boolean;
    }
    interface Ip3 {
      param1: string;
      param2: {
        param3: Ip1;
        param4: Ip0;
      };
    }
    const o1: Ip1 = {
      param1: "1",
      param2: "2",
      param3: 3,
      param4: {
        param1: "4",
        param2: ["5", "6"],
      },
      param5: true,
    };
    const oo1: Ip3 = {
      param1: "1",
      param2: {
        param3: o1,
        param4: {
          param1: "4",
          param2: ["5", "6"],
        },
      },
    };
    const oo2: Ip3 = {
      param1: "1",
      param2: {
        param4: {
          param1: "4",
          param2: ["5", "6"],
        },
        param3: o1,
      },
    };
    const api = createApi();
    api.use(api.routes());
    // deepNested
    const action4 = api.get<Ip3>(
      "/users/:param1/:param2/:param3/:param4/:param5",
      function* (ctx, next) {
        ctx.request = {
          method: "GET",
        };
        yield* next();
      },
    );
    const send_oo1 = action4(oo1);
    const send_oo1_shuff = action4({ param2: oo1.param2, param1: oo1.param1 });
    const send_oo1_value_changed = action4({ ...oo1, param1: "x" });
    const send_oo2 = action4(oo2);
    expect(send_oo1.payload.options).toEqual(send_oo2.payload.options);
    expect(getKeyOf(send_oo1)).toEqual(getKeyOf(send_oo1_shuff));
    expect(getKeyOf(send_oo1)).not.toEqual(getKeyOf(send_oo1_value_changed));
    expect(getKeyOf(send_oo1)).toEqual(getKeyOf(send_oo2));
  },
);

it(
  tests,
  "options object keys order for action key identity - 5: other",
  () => {
    const api = createApi();
    api.use(api.routes());
    //array options
    const action5 = api.post<
      | number
      | boolean
      | string
      | undefined
      | null
      | { param1: string; param2: (string | number)[] }[]
      | string[]
    >("/users/:allRecords", function* (ctx, next) {
      ctx.request = {
        method: "POST",
        body: JSON.stringify(ctx.action.payload),
      };
      yield* next();
    });
    const falsy0 = action5(0);
    const falsy1 = action5(false);
    const falsy2 = action5("");
    const falsy3 = action5(undefined);
    const falsy4 = action5(null);
    const primNo0 = action5(NaN);
    const primNo1 = action5(1);
    const primNo1bis = action5(1);
    const primNo2 = action5(2);
    const str1 = action5("1234");
    const str1bis = action5("1234");
    const str2 = action5("2345");
    const aStrings1 = action5(["1", "2", "3"]);
    const aStrings2 = action5(["1", "2", "3"]);
    const aStrings3 = action5(["1", "2", "1"]);
    const aObjects1 = action5([
      { param1: "1", param2: ["2", "3"] },
      { param1: "2", param2: ["2", "3"] },
    ]);
    const aObjects2 = action5([
      { param1: "1", param2: ["2", "3"] },
      { param1: "2", param2: ["2", "3"] },
    ]);
    // the objects are not identical.
    const aObjects3 = action5([
      { param1: "1", param2: ["2", "3"] },
      { param1: "2", param2: ["2", 3] },
    ]);
    //object inside the array is shuffled
    const aObjects4 = action5([
      { param2: ["2", "3"], param1: "1" },
      { param2: ["2", "3"], param1: "2" },
    ]);
    // cont the order of array elements is changed will get different keys.
    const aObjects5 = action5([
      { param1: "2", param2: ["2", "3"] },
      { param1: "1", param2: ["2", "3"] },
    ]);
    expect(getKeyOf(falsy0)).not.toEqual(getKeyOf(falsy1));
    expect(getKeyOf(falsy1)).not.toEqual(getKeyOf(falsy2));
    expect(getKeyOf(falsy1)).not.toEqual(getKeyOf(falsy3));
    expect(getKeyOf(falsy3)).not.toEqual(getKeyOf(falsy4));
    expect(getKeyOf(primNo0)).not.toEqual(getKeyOf(falsy0));
    expect(getKeyOf(primNo0)).not.toEqual(getKeyOf(primNo1));
    expect(getKeyOf(primNo1)).not.toEqual(getKeyOf(primNo2));
    expect(getKeyOf(primNo1)).toEqual(getKeyOf(primNo1bis));
    expect(getKeyOf(str1)).not.toEqual(getKeyOf(str2));
    expect(getKeyOf(str1)).toEqual(getKeyOf(str1bis));
    expect(getKeyOf(aStrings1)).toEqual(getKeyOf(aStrings2));
    expect(getKeyOf(aStrings1)).not.toEqual(getKeyOf(aStrings3));
    expect(getKeyOf(aObjects1)).toEqual(getKeyOf(aObjects2));
    expect(getKeyOf(aObjects1)).not.toEqual(getKeyOf(aObjects3));
    expect(getKeyOf(aObjects1)).toEqual(getKeyOf(aObjects4));
    expect(getKeyOf(aObjects1)).not.toEqual(getKeyOf(aObjects5));
  },
);
