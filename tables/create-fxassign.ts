export const fxCreateAssign = ({
  name,
  initialState,
}: {
  name: string;
  initialState: any;
}) => {
  return {
    name,
    initialState,
    actions: {
      set: (value: unknown) => {
        return { type: `@@starfx/${name}/set`, payload: value };
      },
      reset: () => {
        return { type: `@@starfx/${name}/set`, payload: initialState };
      },
    },
  };
};
