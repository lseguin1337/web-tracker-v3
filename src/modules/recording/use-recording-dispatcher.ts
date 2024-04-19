import { SerializedEvent } from "@/producers/types";

export function useRecordingDispatcher() {
  // TODO: choose the dispatching logic here
  return (event: SerializedEvent) => {
    console.log('RecordingEvent:', event);
  };
}