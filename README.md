# WebTracker

This project is designed to demonstrate the benefits of a composition approach in building a web tracker application. This project aims to solve several issues by enhancing modularity, eliminating manual dependency injection, and decoupling pipeline configurations from features.

## Install

To set up WebTracker, you can install the dependencies using Yarn:

```shell
yarn
```

## Build

Compile the project with the following command:

```shell
yarn build
```

## Run

Start the application using:

```shell
yarn dev
```

## Run in Debug mode

Start the application using:

```shell
yarn debug
```

## Test

Run the tests for the application with:

```shell
yarn test
```

## Key Concepts

### Modules

Modules in this context are independent components that can be reused and combined in a web tracker application. They allow developers to organize code in a modular fashion, promoting reusability and maintainability.

```typescript
import { provide, inject, createContext, mount } from './lib';

const CounterContext = createContext<{ counter: number }>();

const ChildModule = () => {
  // get counter from the parent module
  const { counter } = inject(CounterContext);
  console.log(counter);
};

const AppModule = () => {
  // expose context to sub module
  provide(CounterContext, { counter: 10 });

  return [
    ChildModule,
    // return a list of child modules you want to use
  ];
};

mount(AppModule); // mount the app
```

Keep in mind you can pass some informations to a child module using arguments it's not manadatory to use the context.
The context should be used only when you want to share some information to a nested children. Or when it make sense to have a shared context.

```typescript
import { mount } from './lib';

const ChildModule = ({ counter }: { counter: number }) => {
  console.log(counter);
};

const AppModule = () => {
  const counterCtx = { counter: 10 };
  return [
    () => ChildModule(counterCtx), // pass the counter context
    // ...
  ];
};

mount(AppModule); // mount the app
```

### Module Hooks

Module hooks are functions that manage the lifecycle of modules in the application. They allow developers to define custom behavior that should happen when a module is mounted or destroyed. This facilitates better resource management and helps in maintaining application state across the lifecycle of the components.

```typescript
import { onMounted, onDestroy, mount } from './lib';

const AppModule = () => {
  onMounted(() => {
    // call when all sub module are mounted
  });

  onDestroy(() => {
    // call when the current ModuleInstance is destroy
  });

  return [
    // ...
  ];
};

const app = mount(AppModule); // mount the app
app.destroy(); // destroy app
```

### Pipeline
The Tracking Pipeline is very close to the flashpoint approach, it introduces new concepts to make the system more powerful, such as deferred registration of producers to split features by modules, and introduces roles like `Producers`, `Composers`, and `Consumers`.

_If multiple modules register the same Producer / Consumers / Composer the element will be instanciated only once. This is what allow spliting the codebase by module without having to couple unrelated feature together._

#### Pipeline Components:

- `Producer`: Generates events and may subscribe to document/window events.
- `Composer`: Creates new events based on one or more Producers/Composers.
- `Consumer`: Consumes events and does not emit new ones.

Look at this simple exemple

```typescript
import { createPipeline, producer, composer, consumer } from './pipeline';

interface ClickEvent {
  type: 'click';
  date: number;
}

interface RageClickEvent {
  type: 'rageClick';
}

type AnyEvent = ClickEvent | RageClickEvent;

const ClickProducer = producer<ClickEvent>((push) => {
  const handler = (event) => push({ type: 'click', date: event.timeStamp });
  document.addEventListener('click', handler);
  return () => document.removeEventListener('click', handler);
});

const RageClickProducer = composer<ClickEvent, RageClickEvent>([ClickProducer], (push) => {
  let dates: number[] = [];
  return (clickEvent: ClickEvent) => {
    dates.push(clickEvent.date);
    if (dates.length > 3) dates.shift();
    if (dates.length === 3 && dates[2] - dates[0] <= 500) {
      push({ type: 'rageClick' });
      dates = [];
    }
  };
});
```