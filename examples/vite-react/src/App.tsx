import {
  TypedUseSelectorHook,
  useDispatch,
  useSelector as useSel,
} from "starfx/react";
import "./App.css";
import { AppState, fetchUsers, schema } from "./api.ts";

const useSelector: TypedUseSelectorHook<AppState> = useSel;

function App({ id }: { id: string }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => schema.users.selectById(s, { id }));
  const userList = useSelector(schema.users.selectTableAsList);
  return (
    <div>
      <div>hi there, {user.name}</div>
      <button onClick={() => dispatch(fetchUsers())}>Fetch users</button>
      {userList.map((u) => {
        return <div key={u.id}>({u.id}) {u.name}</div>;
      })}
    </div>
  );
}

export default App;
