import { fakeTrackerContext } from "@/tests/utils";
import { RecordingModule } from "./recording.module";
import { ClickProducer, MouseMoveProducer } from "@/producers/pointers";
import { RecordingDOMProducer } from "@/producers/dom";
import { InputChangeProducer } from "@/producers/inputs";

const eventDisptacher = jest.fn();

// mock the recording dispatcher
jest.mock('./use-recording-dispatcher', () => ({
  useRecordingDispatcher: jest.fn().mockImplementation(() => eventDisptacher),
}));

const ctx = fakeTrackerContext({ anonymization: true });

describe('RecordingModule', () => {
  beforeEach(() => ctx.$mount(RecordingModule));
  afterEach(() => {
    ctx.$destroy();
    eventDisptacher.mockClear();
  });

  it('should register MouseMoveProducer and forward event to the dispatcher', () => {
    ctx.fakeDispatcher(MouseMoveProducer)({ type: 'mousemove', args: [] });
    expect(eventDisptacher).toHaveBeenCalledWith({ type: 'mousemove', args: [] });
  });

  it('should register RecordingDOMProducer and forward event to the dispatcher', () => {
    ctx.fakeDispatcher(RecordingDOMProducer)({ type: 'initialDom', args: [{ blbal: '' }] });
    expect(eventDisptacher).toHaveBeenCalledWith({ type: 'initialDom', args: [{ blbal: '' }] });
  });

  it('should register ClickProducer and forward event to the dispatcher', () => {
    ctx.fakeDispatcher(ClickProducer)({ type: 'click', args: [] });
    expect(eventDisptacher).toHaveBeenCalledWith({ type: 'click', args: [] });
  });

  it('should register InputChangeProducer and forward event to the dispatcher', () => {
    ctx.fakeDispatcher(InputChangeProducer)({ type: 'change', args: [] });
    expect(eventDisptacher).toHaveBeenCalledWith({ type: 'change', args: [] });
  });
});