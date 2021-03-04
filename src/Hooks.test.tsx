import { combineReducers, createStore } from "redux";
import { render } from "@testing-library/react";
import { Simulate } from "react-dom/test-utils";
import { JSDOM } from "jsdom";
import * as tape from "tape";
import { createUseReduxStore } from ".";

const dom = new JSDOM();

(global as any).window = dom.window;
(global as any).document = dom.window.document;

interface IFormState {
  text: string;
}

const FORM_SET_TEXT = "FORM_SET_TEXT";

interface SetTextAction {
  type: typeof FORM_SET_TEXT;
  text: string;
}

type FormAction = SetTextAction;

function formReducer(state = { text: "" }, action: FormAction): IFormState {
  switch (action.type) {
    case FORM_SET_TEXT:
      return { text: action.text };
    default:
      return state;
  }
}

const reducer = combineReducers({
  form: formReducer,
});

export type IState = ReturnType<typeof reducer>;

const store = createStore(reducer);

const useReduxStore = createUseReduxStore(store);

const selectText = (state: IState) => state.form.text;

function setFormText(text: string) {
  store.dispatch({ type: FORM_SET_TEXT, text });
}

const Defaults = () => {
  useReduxStore(() => ({}));
  return <div>Defaults</div>;
};

interface ITextOwnProps {
  symbol: string;
}

function Text(ownProps: ITextOwnProps) {
  const stateProps = useReduxStore((state) => ({
    text: selectText(state),
    symbol: ownProps.symbol,
  }));

  return (
    <p data-testid="text">
      {stateProps.text}
      {stateProps.symbol}
    </p>
  );
}

function Form() {
  const text = useReduxStore(selectText);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormText(e.target.value);
  }

  return (
    <input data-testid="input" onChange={onChange} type="text" value={text} />
  );
}

tape("hook update", async (assert: tape.Test) => {
  const wrapper = render(
    <>
      <Text symbol="!" />
      <Form />
      <Defaults />
    </>
  );

  assert.equals(store.getState().form.text, "", "store text should be empty");
  assert.equals(
    (wrapper.getByTestId("input") as HTMLInputElement).value,
    "",
    "input value should reflect stores"
  );
  assert.equals(
    (wrapper.getByTestId("text") as HTMLParagraphElement).textContent,
    "!",
    "text value should reflect stores"
  );

  Simulate.change(wrapper.getByTestId("input"), {
    target: { value: "text" } as any,
  });

  assert.equals(
    store.getState().form.text,
    "text",
    "store's value should update"
  );
  assert.equals(
    (wrapper.getByTestId("input") as HTMLInputElement).value,
    "text",
    "input value should update to new store's value"
  );
  assert.equals(
    (wrapper.getByTestId("text") as HTMLParagraphElement).textContent,
    "text!",
    "text value should update to new store's value"
  );

  Simulate.change(wrapper.getByTestId("input"), {
    target: { value: "text" } as any,
  });

  assert.equals(
    store.getState().form.text,
    "text",
    "store's text should not have changed"
  );
  assert.equals(
    (wrapper.getByTestId("input") as HTMLInputElement).value,
    "text",
    "input value should not have changed"
  );
  assert.equals(
    (wrapper.getByTestId("text") as HTMLParagraphElement).textContent,
    "text!",
    "text value should not have changed"
  );

  wrapper.unmount();

  assert.end();
});

tape("hook render checks", async (assert: tape.Test) => {
  interface ICounter {
    count: number;
  }

  const COUNTER_INC = "COUNTER_INC";

  interface CounterInc {
    type: typeof COUNTER_INC;
  }

  function counterReducer(state = { count: 0 }, action: CounterInc): ICounter {
    switch (action.type) {
      case COUNTER_INC:
        return { count: state.count + 1 };
      default:
        return state;
    }
  }

  interface IName {
    name: string;
  }

  const NAME_SET = "NAME_SET";

  interface SetName {
    type: typeof NAME_SET;
    name: string;
  }

  function nameReducer(state = { name: "" }, action: SetName): IName {
    switch (action.type) {
      case NAME_SET:
        return { name: action.name };
      default:
        return state;
    }
  }

  const reducer = combineReducers({
    counter: counterReducer,
    name: nameReducer,
  });

  const store = createStore(reducer);

  const useReduxStore = createUseReduxStore(store);
  let rendered = 0;

  function CounterComponent() {
    const count = useReduxStore((state) => state.counter.count);
    rendered += 1;
    return <p data-testid="text">{count}</p>;
  }

  const wrapper = render(<CounterComponent />);

  assert.equals(
    (wrapper.getByTestId("text") as HTMLParagraphElement).textContent,
    store.getState().counter.count.toString(),
    "text value should reflect stores"
  );

  store.dispatch({ type: COUNTER_INC });

  assert.equals(rendered, 2, "should rerender");

  store.dispatch({ type: NAME_SET, name: "test" });

  assert.equals(rendered, 2, "should not rerender");

  assert.end();
});
