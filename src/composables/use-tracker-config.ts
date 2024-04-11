import { createContext, inject, provide } from "../lib";

export interface TagConfig {
  tagVersion: string;
  anonymization: boolean;
  sessionRecordingEnabled: boolean;
  textVisibility?: boolean;
  // any other stuff here
}

const ConfigContext = createContext<TagConfig>();
const DocumentContext = createContext<Document>();

export function useTrackerConfig() {
  return inject(ConfigContext);
}

export function provideTrackerConfig(config: TagConfig) {
  provide(ConfigContext, config);
}

export function useDocument() {
  return inject(DocumentContext);
}

export function provideDocument(document: Document) {
  return provide(DocumentContext, document);
}
