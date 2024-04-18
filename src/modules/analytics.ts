import { NoopModule } from "../lib";
import { useTrackerConfig } from "../composables/use-tracker-config";
import { consumer, useTrackingPipeline } from "../composables/use-tracking-pipeline";
import { ClickProducer, ThrottledMouseMoveProducer, RageClickProducer, TextVisibilityProducer, SerializedEvent } from "../producers";

function consumeAnalyticsEvents(push: (event: SerializedEvent) => void) {
  return consumer<SerializedEvent>([
    ClickProducer,
    RageClickProducer,
    TextVisibilityProducer,
    ThrottledMouseMoveProducer,
  ], () => {
    if (__DEBUG__) console.log('AnalyticsUploader init');
    return push;
  });
}

function HeatmapModule() {
  if (__DEBUG__) console.log('HeatmapModule init');
  const pipeline = useTrackingPipeline();

  // register all producers the HeatmapModule is using
  pipeline.use(ThrottledMouseMoveProducer);
}

function TextVisibilityModule() {
  if (__DEBUG__) console.log('TextVisibilityModule init');
  const pipeline = useTrackingPipeline();

  // register all producers the TextVisibilityModule is using
  pipeline.use(TextVisibilityProducer);
}

export function AnalyticsModule() {
  if (__DEBUG__) console.log('AnalyticsModule init');
  const { textVisibility, heatmap } = useTrackerConfig();
  const pipeline = useTrackingPipeline();

  // register all producers/consumer the AnalyticsModule is using
  pipeline.use(ClickProducer, RageClickProducer, consumeAnalyticsEvents((event) => {
    // 
  }));

  return [
    textVisibility ? TextVisibilityModule : NoopModule,
    heatmap ? HeatmapModule : NoopModule,
  ];
}