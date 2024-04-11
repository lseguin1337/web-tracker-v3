import { mount, onDestroy, onMounted } from "./lib";

function AnalyticsModule() {
  const pipeline = useTrackingPipeline();

  // I can conditionally register a producer or not
  pipeline.register([
    ClickProducer,
    InputProducer,
  ]);
}

// sub module
function RecordingModule() {
  const pipeline = useTrackingPipeline();

  // I can conditionally register a producer or not
  pipeline.register([
    ClickProducer,
    DOMProducer,
    InputProducer,
  ]);

  // I can conditionally register a transformer or not
  if (config.isAnonymized)
    pipeline.transform(DOMProducer, Anonymizer);
}

function WebTracker(trackingConfig: any) {
  setupTrackingConfig(trackingConfig);
  const pipeline = createTrackingPipeline();
  const subModules = [
    AnalyticsModule,
  ];

  if (config.isRecording)
    subModules.push(RecordingModule);

  // register other submodule

  onMounted(() => {
    // all sub modules are initialized
    // we can start the tracking pipeline
    pipeline.start();
  });

  onDestroy(() => {
    pipeline.stop();
  });

  return subModules;
}

async function bootstrap() {
  const tracker = await mount(() => WebTracker((window as any).CS_CONFIG));
  setTimeout(() => tracker.destroy(), 5000);
}

bootstrap();













////// 
function useTrackingPipeline() {
  return {
    register(producers: any) {
      
    },
    transform(producer: any, transformer: any) {}
  }
}

function ClickProducer() {}
function DOMProducer() {}
function InputProducer() {}
function Anonymizer() {}

function createTrackingPipeline() {
  return {
    start: () => {},
    stop: () => {},
  };
}
function setupTrackingConfig(t: any) {

}
const config: any = {}
