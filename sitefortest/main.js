import { createElement as h, useState, StrictMode } from 'https://esm.sh/react@18.2.0';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';

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
