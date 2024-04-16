export type { SerializedEvent } from './types';

export { DOMProducer, TextVisibilityProducer, DOMAnonymizerTransformer } from './dom';
export { InputChangeProducer } from './inputs';
export { RageClickProducer } from './insights';
export { ClickProducer, MouseMoveProducer, ThrottledMouseMoveProducer } from './pointers';