export interface ActionWPayload<P> {
  type: string;
  payload: P;
}

export interface AnyAction {
  type: string;
  [key: string]: any;
}

export interface StoreLike<S = unknown> {
  getState: () => S;
  dispatch: (action: AnyAction) => void;
}
