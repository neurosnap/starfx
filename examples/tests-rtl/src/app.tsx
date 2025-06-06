import { useDispatch, useSelector } from "starfx/react";
import { fetchUsers, schema } from "./api";

export function App({ id }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => schema.users.selectById(s, { id }));
  const userList = useSelector(schema.users.selectTableAsList);
  return (
    <div>
      <h1>hi there, {user.name}</h1>
      <button onClick={() => dispatch(fetchUsers())}>Fetch users</button>
      {userList.map((u) => {
        return (
          <div key={u.id}>
            ({u.id}) {u.name}
          </div>
        );
      })}
    </div>
  );
}
