import { EventHook, useTrackingPipeline } from "@/composables/use-tracking-pipeline";
import { ThrottledMouseMoveProducer } from "@/producers/pointers";
import { SerializedEvent } from "@/producers/types";

export function HeatmapModule(emit: EventHook<SerializedEvent>) {
  if (__DEBUG__) console.log('HeatmapModule init');
  const pipeline = useTrackingPipeline();

  // register all producers the HeatmapModule is using
  pipeline.use([ThrottledMouseMoveProducer], emit);
}