import { useTrackerConfig } from "@/composables/use-tracker-config";
import { EventHook, useTrackingPipeline } from "@/composables/use-tracking-pipeline";

import { RecordingDOMConfig, RecordingDOMProducer } from "@/producers/dom";
import { InputChangeProducer } from "@/producers/inputs";
import { ClickProducer, MouseMoveProducer } from "@/producers/pointers";
import { SerializedEvent } from "@/producers/types";
import { useRecordingDispatcher } from "./use-recording-dispatcher";

function BaseRecordingModule({ anonymized, emit }: { anonymized?: boolean, emit: EventHook<SerializedEvent> }) {
  const pipeline = useTrackingPipeline();
  
  // declare a context pipeline (this will be use inside the RecordedDOMProducer)
  pipeline.define(RecordingDOMConfig, { anonymized });

  // register all producers/composers used by the recording module
  pipeline.use<SerializedEvent>([
    ClickProducer,
    InputChangeProducer,
    MouseMoveProducer,
    RecordingDOMProducer,
  ], emit);
}

export function RecordingModule() {
  if (__DEBUG__) console.log('RecordingModule init');
  const config = useTrackerConfig();
  const emit = useRecordingDispatcher();

  return [
    () => BaseRecordingModule({ anonymized: !!config.anonymization, emit }),
  ];
}
