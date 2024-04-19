import { EventHook, useTrackingPipeline } from "@/composables/use-tracking-pipeline";
import { TextVisibilityProducer } from "@/producers/dom";
import { SerializedEvent } from "@/producers/types";

export function TextVisibilityModule(emit: EventHook<SerializedEvent>) {
  if (__DEBUG__) console.log('TextVisibilityModule init');
  const pipeline = useTrackingPipeline();

  // register all producers the TextVisibilityModule is using
  pipeline.use([TextVisibilityProducer], emit);
}