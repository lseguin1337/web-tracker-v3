import { NoopModule } from "@/lib";
import { useTrackerConfig } from "@/composables/use-tracker-config";
import { EventHook, useTrackingPipeline } from "@/composables/use-tracking-pipeline";

import { SerializedEvent } from "@/producers/types";
import { ClickProducer } from "@/producers/pointers";
import { RageClickProducer } from "@/producers/insights";

import { HeatmapModule } from "./heatmap.module";
import { TextVisibilityModule } from "./text-visibility.module";

// reusable analytics module not couple to the tracking tag state
function BaseAnalyticsModule({ textVisibility, heatmap, emit }: { textVisibility?: boolean, heatmap?: boolean, emit: EventHook<SerializedEvent> }) {
  const pipeline = useTrackingPipeline();

  // register analytics consumer
  pipeline.use([
    ClickProducer,
    RageClickProducer,
  ], emit);

  return [
    textVisibility ? () => TextVisibilityModule(emit) : NoopModule,
    heatmap ? () => HeatmapModule(emit) : NoopModule,
  ];
}

// connector between the config and the module
export function AnalyticsModule() {
  if (__DEBUG__) console.log('AnalyticsModule init');
  const { textVisibility, heatmap } = useTrackerConfig();

  const emit = (event: SerializedEvent) => {
    // TODO: batch event and emit them through the http
    console.log('AnalyticsEvent:', event);
  };

  return [
    () => BaseAnalyticsModule({ textVisibility, heatmap, emit }),
  ];
}
