import { useTrackerConfig } from "../composables/use-tracker-config";
import { useTrackingPipeline } from "../composables/use-tracking-pipeline";
import { RageClickProducer, TextVisibilityProducer } from "../composers";
import { ClickProducer, DOMProducer } from "../producers";

function TextVisibilityModule() {
  console.log('TextVisibilityModule init');
  const pipeline = useTrackingPipeline();

  pipeline.register([
    DOMProducer,
    TextVisibilityProducer,
  ]);
}

function NoopModule() {}

export function AnalyticsModule() {
  console.log('AnalyticsModule init');
  const { textVisibility } = useTrackerConfig();
  const pipeline = useTrackingPipeline();

  pipeline.register([
    ClickProducer,
    RageClickProducer,
  ]);

  return [
    textVisibility ? TextVisibilityModule : NoopModule,
  ];
}