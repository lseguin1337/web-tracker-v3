import { NoopModule } from "../lib";
import { useTrackerConfig } from "../composables/use-tracker-config";
import { consumer, useTrackingPipeline } from "../composables/use-tracking-pipeline";
import { RageClickProducer, TextVisibilityProducer } from "../composers";
import { ClickProducer } from "../producers";

const AnalyticsUploader = consumer([
  ClickProducer,
  RageClickProducer,
  TextVisibilityProducer,
], () => {
  return (event) => {
    // TODO: batch event and submit them using http
    console.log('Analytics Event:', event);
  };
});

function TextVisibilityModule() {
  console.log('TextVisibilityModule init');
  const pipeline = useTrackingPipeline();

  pipeline.use(TextVisibilityProducer);
}

export function AnalyticsModule() {
  console.log('AnalyticsModule init');
  const { textVisibility } = useTrackerConfig();
  const pipeline = useTrackingPipeline();

  pipeline.use(ClickProducer, RageClickProducer, AnalyticsUploader);

  return [
    textVisibility ? TextVisibilityModule : NoopModule,
  ];
}