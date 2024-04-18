import { NoopModule } from "../../lib";
import { useTrackerConfig } from "../../composables/use-tracker-config";
import { consumer, useTrackingPipeline } from "../../composables/use-tracking-pipeline";

import { SerializedEvent } from "../../producers/types";
import { ClickProducer } from "../../producers/pointers";
import { RageClickProducer } from "../../producers/insights";
import { HeatmapModule, heatmapProducers } from "./heatmap.module";
import { TextVisibilityModule, textVisibilityProducers } from "./text-visibility.module";

const analyticsProducers = [
  ClickProducer,
  RageClickProducer,
];

// analytics events consumer
function consume(push: (event: SerializedEvent) => void) {
  return consumer<SerializedEvent>([
    ...analyticsProducers,
    ...heatmapProducers,
    ...textVisibilityProducers,
  ], () => push);
}

export function AnalyticsModule() {
  if (__DEBUG__) console.log('AnalyticsModule init');
  const { textVisibility, heatmap } = useTrackerConfig();
  const pipeline = useTrackingPipeline();

  // register all producers used by AnalyticsModule
  pipeline.use(...analyticsProducers);

  // consume analytics events
  pipeline.use(consume((event) => {
    // TODO: batch and submit events
    if (__DEBUG__) console.log('AnalyticsEvent', event);
  }));

  return [
    textVisibility ? TextVisibilityModule : NoopModule,
    heatmap ? HeatmapModule : NoopModule,
  ];
}