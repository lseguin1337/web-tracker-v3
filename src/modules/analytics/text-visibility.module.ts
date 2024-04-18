import { useTrackingPipeline } from "../../composables/use-tracking-pipeline";
import { TextVisibilityProducer } from "../../producers/dom";

export const textVisibilityProducers = [
  TextVisibilityProducer,
];

export function TextVisibilityModule() {
  if (__DEBUG__) console.log('TextVisibilityModule init');
  const pipeline = useTrackingPipeline();

  // register all producers the TextVisibilityModule is using
  pipeline.use(...textVisibilityProducers);
}