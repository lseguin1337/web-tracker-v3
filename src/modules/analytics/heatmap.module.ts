import { useTrackingPipeline } from "../../composables/use-tracking-pipeline";
import { ThrottledMouseMoveProducer } from "../../producers/pointers";

export const heatmapProducers = [
  ThrottledMouseMoveProducer,
];

export function HeatmapModule() {
  if (__DEBUG__) console.log('HeatmapModule init');
  const pipeline = useTrackingPipeline();

  // register all producers the HeatmapModule is using
  pipeline.use(...heatmapProducers);
}