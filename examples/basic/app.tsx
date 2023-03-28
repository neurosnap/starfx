import React from "react";
import { createRoot } from "react-dom/client";
import { Action, configureStore } from "@reduxjs/toolkit";
import { sleep } from "effection";
import {
  Provider as ReduxProvider,
  useDispatch,
  useSelector,
} from "react-redux";

// run `make npm` in `saga/` folder first
import { ErrContext, forEach, go } from "../../npm/src/saga/mod";
import { createFxMiddleware, take } from "../../npm/src/saga/redux";
import { Provider } from "../../npm/src/saga/react";

interface User {
  id: string;
  name: string;
}

interface State {
  users: { [key: string]: User };
}

function selectUser(s: State, props: { id: string }) {
  return s.users[props.id];
}

function App({ id }: { id: string }) {
  const dispatch = useDispatch();
  const user = useSelector((s: State) => selectUser(s, { id }));
  return (
    <div>
      <div>hi there, {user.name}</div>
      <button
        onClick={() => dispatch({ type: "fetch-user", payload: { id: "1" } })}
      >
        Fetch user
      </button>
      <button onClick={() => dispatch({ type: "fetch-mailboxes" })}>
        Fetch mailboxes
      </button>
    </div>
  );
}

const initState: State = {
  users: {
    "1": { id: "1", name: "joe" },
  },
};

function main() {
  const reducer = (s: State = initState, _: Action) => s;
  const fx = createFxMiddleware();
  const store = configureStore({
    reducer,
    middleware: [fx.middleware],
  });

  function* users() {
    while (true) {
      const action = yield* take("fetch-user");
      yield* go(function* () {
        console.log(action);
      });
    }
  }
  function* mailboxes() {
    while (true) {
      const action = yield* take("fetch-mailboxes");
      yield* go(function* () {
        console.log(action);
        yield* sleep(1000);
        throw new Error("wtf");
      });
    }
  }
  function* logErrors() {
    yield* forEach(ErrContext, function* (err) {
      console.error(err);
    });
  }

  fx.run([users, mailboxes, logErrors]);

  const domNode = document.getElementById("root");
  const root = createRoot(domNode);
  root.render(
    <ReduxProvider store={store}>
      <Provider scope={fx.scope}>
        <App id="1" />
      </Provider>
    </ReduxProvider>,
  );
}

addEventListener("DOMContentLoaded", () => {
  main();
});
