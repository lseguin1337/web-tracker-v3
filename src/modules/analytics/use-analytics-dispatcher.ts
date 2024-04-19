import { SerializedEvent } from "@/producers/types";

export function useAnalyticsDispatcher() {
  // TODO: return the analytics dispatcher logic you want
  return (event: SerializedEvent) => {
    console.log('AnalyticsEvent', event);
  };
}