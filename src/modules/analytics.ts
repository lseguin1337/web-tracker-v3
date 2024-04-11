import { useTrackerConfig } from "../composables/use-tracker-config";
import { Composer, useTrackingPipeline } from "../composables/use-tracking-pipeline";
import { DOMProducer } from "../producers";

const TextVisibilityComposer: Composer = (ctx) => {
  // local state
  return (event: any) => {
    // simple pass through
    ctx.push(event);
  };
}

function TextVisibilityModule() {
  console.log('TextVisibilityModule used');
  const pipeline = useTrackingPipeline();
  pipeline.register([
    DOMProducer,
  ]);
  pipeline.compose([DOMProducer], TextVisibilityComposer);
}

export function AnalyticsModule() {
  console.log('AnalyticsModule used');
  const { textVisibility } = useTrackerConfig();

  return [
    ...(textVisibility ? [TextVisibilityModule] : []),
  ];
}