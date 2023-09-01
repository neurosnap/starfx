export function createAssign<V = unknown, S = unknown>(
  { name, initialState }: { name: string; initialState: V },
) {
  return {
    name,
    initialState,
    actions: {
      set: (value: V) => (state: S) => {
        (state as any)[name] = value;
      },
      reset: () => (state: S) => {
        (state as any)[name] = initialState;
      },
    },
  };
}
