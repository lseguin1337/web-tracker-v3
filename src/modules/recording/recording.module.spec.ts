import { fakeTrackingTagContext } from "@/tests/utils";
import { RecordingModule } from "./recording.module";
import { ClickProducer, MouseMoveProducer } from "@/producers/pointers";
import { RecordingDOMProducer } from "@/producers/dom";

const eventDisptacher = jest.fn();

// mock the recording dispatcher
jest.mock('./use-recording-dispatcher', () => ({
  useRecordingDispatcher: jest.fn().mockImplementation(() => eventDisptacher),
}));

const ctx = fakeTrackingTagContext({ anonymization: true });

describe('RecordingModule', () => {
  beforeEach(() => ctx.$mount(RecordingModule));
  afterEach(() => ctx.$destroy());

  it('should register MouseMoveProducer and forward event to the dispatcher', () => {
    expect(ctx.hasProducerRegistered(MouseMoveProducer)).toBe(true);
    ctx.fakeDispatcher(MouseMoveProducer)({ type: 'mousemove', args: [] });
    expect(eventDisptacher).toHaveBeenCalledWith({ type: 'mousemove', args: [] });
  });

  it('should register RecordingDOMProducer and forward event to the dispatcher', () => {
    expect(ctx.hasProducerRegistered(RecordingDOMProducer)).toBe(true);
    ctx.fakeDispatcher(RecordingDOMProducer)({ type: 'initialDom', args: [{ blbal: '' }] });
    expect(eventDisptacher).toHaveBeenCalledWith({ type: 'initialDom', args: [{ blbal: '' }] });
  });

  it('should register ClickProducer and forward event to the dispatcher', () => {
    expect(ctx.hasProducerRegistered(ClickProducer)).toBe(true);
    ctx.fakeDispatcher(ClickProducer)({ type: 'click', args: [] });
    expect(eventDisptacher).toHaveBeenCalledWith({ type: 'click', args: [] });
  });
});