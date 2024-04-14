import { createContext, inject, provide } from "../../lib";
import { createPipeline } from './pipeline';
import { PipelineOptions, TrackingPipeline } from "./types";

const TrackingPipelineContext = createContext<TrackingPipeline>();

export function createTrackingPipeline(options: PipelineOptions = {}) {
  const { define, suspend, use, start, stop } = createPipeline(options);
  provide(TrackingPipelineContext, { define, suspend, use });
  return { start, stop };
}

export function useTrackingPipeline() {
  return inject(TrackingPipelineContext);
}