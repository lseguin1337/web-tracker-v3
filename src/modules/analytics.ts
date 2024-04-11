import { useTrackerConfig } from "../composables/use-tracker-config";
import { Composer, useTrackingPipeline } from "../composables/use-tracking-pipeline";
import { ClickProducer, DOMProducer } from "../producers";

const TextVisibilityComposer: Composer = (ctx) => {
  // local state
  return (event: any) => {
    // simple pass through
    ctx.push(event);
  };
}

function TextVisibilityModule() {
  console.log('TextVisibilityModule init');
  const pipeline = useTrackingPipeline();
  pipeline.register([DOMProducer]);
  pipeline.compose([DOMProducer], TextVisibilityComposer);
}

export function AnalyticsModule() {
  console.log('AnalyticsModule init');
  const { textVisibility } = useTrackerConfig();
  const pipeline = useTrackingPipeline();
  pipeline.register([ClickProducer]);

  return [
    ...(textVisibility ? [TextVisibilityModule] : []),
  ];
}