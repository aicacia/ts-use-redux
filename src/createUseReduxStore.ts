import { Action, Store } from "redux";
import { useState, useEffect, useRef } from "react";
import { shallowEqual } from "shallow-equal-object";

export function createUseReduxStore<S, A extends Action>(
  store: Store<S, A>,
  isEqual: (a: any, b: any) => boolean = shallowEqual
) {
  return function useReduxStore<TProps>(
    mapStateToProps: (store: S) => TProps,
    useIsEqual: (a: TProps, b: TProps) => boolean = isEqual
  ) {
    const [props, setProps] = useState(() => mapStateToProps(store.getState())),
      lastProps = useRef<TProps>();

    useEffect(() =>
      store.subscribe(() => {
        const nextProps = mapStateToProps(store.getState());

        if (!lastProps.current || !useIsEqual(lastProps.current, nextProps)) {
          lastProps.current = nextProps;
          setProps(nextProps);
        }
      })
    );

    return props;
  };
}
