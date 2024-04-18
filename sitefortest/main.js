import { useState, StrictMode, createRoot, h } from './react';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  return h(StrictMode, {},
    h('h1', {}, 'Fake Website to test the WebTracker'),
    h('button', { onClick: () => setIsOpen(!isOpen) }, 'click me'),
    isOpen ? h('p', {}, 'hello world') : '',
    h('input', { type: 'text', value: text, onInput: (e) => setText(e.target.value) }),
    text ? h('button', { onClick: () => setText('') }, 'reset') : '',
    h('p', {}, text),
  );
}

createRoot(document.querySelector("fake-customer-app")).render(h(App));
