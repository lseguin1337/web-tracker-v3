import { Transformer } from "../composables/use-tracking-pipeline";

export const AnonymizerTransformer: Transformer = ({ push }) => {
  return (event) => {
    // simple pass through
    push(event);
  };
}