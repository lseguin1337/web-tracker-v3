import { NoopModule } from "../lib";
import { useTrackerConfig } from "../composables/use-tracker-config";
import { consumer, useTrackingPipeline } from "../composables/use-tracking-pipeline";
import { ClickProducer, ThrottledMouseMoveProducer, RageClickProducer, TextVisibilityProducer, SerializedEvent } from "../producers";

const AnalyticsUploader = consumer<SerializedEvent>([
  ClickProducer,
  RageClickProducer,
  TextVisibilityProducer,
  ThrottledMouseMoveProducer,
], () => {
  return (event) => {
    // TODO: batch event and submit them using http
    console.log('Analytics Event:', event);
  };
});

function HeatmapModule() {
  if (__DEV__) console.log('HeatmapModule init');
  const pipeline = useTrackingPipeline();
  pipeline.use(ThrottledMouseMoveProducer);
}

function TextVisibilityModule() {
  if (__DEV__) console.log('TextVisibilityModule init');
  const pipeline = useTrackingPipeline();
  pipeline.use(TextVisibilityProducer);
}

export function AnalyticsModule() {
  if (__DEV__) console.log('AnalyticsModule init');
  const { textVisibility, heatmap } = useTrackerConfig();
  const pipeline = useTrackingPipeline();

  pipeline.use(ClickProducer, RageClickProducer, AnalyticsUploader);

  return [
    textVisibility ? TextVisibilityModule : NoopModule,
    heatmap ? HeatmapModule : NoopModule,
  ];
}