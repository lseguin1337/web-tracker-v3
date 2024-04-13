import { useTrackerConfig } from "../composables/use-tracker-config";
import { useTrackingPipeline } from "../composables/use-tracking-pipeline";
import { RageClickProducer, TextVisibilityProducer } from "../composers";
import { ClickProducer } from "../producers";

function TextVisibilityModule() {
  console.log('TextVisibilityModule init');
  const pipeline = useTrackingPipeline();

  pipeline.use([
    TextVisibilityProducer,
  ]);
}

function NoopModule() {}

export function AnalyticsModule() {
  console.log('AnalyticsModule init');
  const { textVisibility } = useTrackerConfig();
  const pipeline = useTrackingPipeline();

  pipeline.use([
    ClickProducer,
    RageClickProducer,
  ]);

  return [
    textVisibility ? TextVisibilityModule : NoopModule,
  ];
}