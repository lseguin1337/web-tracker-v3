import { createContext, inject, provide } from "@/lib";
import { createPipeline, createPipelineContext, usePipelineContext } from './pipeline';
import { PipelineOptions, TrackingPipeline } from "./types";

const TrackingPipelineContext = createContext<TrackingPipeline>();

const WindowContext = createPipelineContext<Window & typeof globalThis>();
const DocumentContext = createPipelineContext<Document>();

export function createTrackingPipeline({ window: windowContext = window }: PipelineOptions = {}) {
  const { define, suspend, use, start, stop } = createPipeline();
  define(WindowContext, windowContext);
  define(DocumentContext, windowContext.document);
  provide(TrackingPipelineContext, { define, suspend, use });
  return { start, stop };
}

export function useTrackingPipeline() {
  return inject(TrackingPipelineContext);
}

export function useDocument() {
  return usePipelineContext(DocumentContext);
}

export function useWindow() {
  return usePipelineContext(WindowContext);
}