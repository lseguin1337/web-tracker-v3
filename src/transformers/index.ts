import { Transformer } from "../composables/use-tracking-pipeline";

export const AnonymizerTransformer: Transformer = (_, push) => {
  console.log('AnonymizerTransformer init');
  return (event) => {
    // simple pass through
    push(event);
  };
}