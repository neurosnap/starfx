import { useDispatch, useSelector } from "starfx/react";
import { fetchUsers, schema } from "./api.js";

export function App({ id }) {
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
