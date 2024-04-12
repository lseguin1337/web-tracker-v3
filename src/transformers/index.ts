import { transformer } from "../composables/use-tracking-pipeline";
import { DOMProducer } from "../producers";

export const DOMAnonymizer = transformer(DOMProducer, (_, push) => {
  console.log('DOMAnonymizer init');
  return (event) => {
    // simple pass through
    push(event);
  };
});