import { createContext, inject, provide } from "@/lib";

export interface TagConfig {
  tagVersion: string;
  anonymization?: boolean;
  recording?: boolean;
  textVisibility?: boolean;
  heatmap?: boolean;
  // any other stuff here
}

const ConfigContext = createContext<TagConfig>();

export function useTrackerConfig() {
  return inject(ConfigContext);
}

export function provideTrackerConfig(config: TagConfig) {
  provide(ConfigContext, config);
}
