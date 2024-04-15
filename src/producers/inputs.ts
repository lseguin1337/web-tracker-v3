import { producer, useDocument } from "../composables/use-tracking-pipeline";
import { listen } from "./listen";
import { SerializedEvent } from "./types";

export const InputChangeProducer = producer<SerializedEvent<'change'>>((push) => {
  if (__DEBUG__)  console.log('InputProducer init');
  return listen(useDocument(), 'change', push);
});