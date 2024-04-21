import { fakeTrackerContext } from "@/tests/utils";
import { ClickProducer, ThrottledMouseMoveProducer } from "@/producers/pointers";
import { TextVisibilityProducer } from "@/producers/dom";
import { AnalyticsModule } from "./analytics.module";

const eventDisptacher = jest.fn();

// mock the analytics dispatcher
jest.mock('./use-analytics-dispatcher', () => ({
  useAnalyticsDispatcher: jest.fn().mockImplementation(() => eventDisptacher),
}));

describe('Analytics', () => {
  afterEach(() => eventDisptacher.mockClear());

  describe('Without Feature', () => {
    const ctx = fakeTrackerContext({ heatmap: false, textVisibility: false });

    beforeEach(() => ctx.$mount(AnalyticsModule));
    afterEach(() => ctx.$destroy());

    it('should not register heatmap and textVisibility', () => {
      const clickProducer = ctx.mockProducer(ClickProducer);
      const textVisibilityProducer = ctx.mockProducer(TextVisibilityProducer);
      const moveProducer = ctx.mockProducer(ThrottledMouseMoveProducer);

      ctx.startPipeline();

      expect(clickProducer.isUsed).toBe(true);
      expect(textVisibilityProducer.isUsed).toBe(false);
      expect(moveProducer.isUsed).toBe(false);

      clickProducer.emit({ type: 'click', args: [{ timeStamp: 12 }] });
      expect(eventDisptacher).toHaveBeenCalledWith({ type: 'click', args: [{ timeStamp: 12 }] });
    });
  });

  describe('With heatmap', () => {
    const ctx = fakeTrackerContext({ heatmap: true });

    beforeEach(() => ctx.$mount(AnalyticsModule));
    afterEach(() => ctx.$destroy());

    it('should register heatmap only', () => {
      const clickProducer = ctx.mockProducer(ClickProducer);
      const textVisibilityProducer = ctx.mockProducer(TextVisibilityProducer);
      const moveProducer = ctx.mockProducer(ThrottledMouseMoveProducer);

      ctx.startPipeline();

      expect(clickProducer.isUsed).toBe(true);
      expect(textVisibilityProducer.isUsed).toBe(false);
      expect(moveProducer.isUsed).toBe(true);

      moveProducer.emit({ type: 'mousemove', args: [] });
      expect(eventDisptacher).toHaveBeenCalledWith({ type: 'mousemove', args: [] });
    });
  });

  describe('With textVisibility', () => {
    const ctx = fakeTrackerContext({ textVisibility: true });

    beforeEach(() => ctx.$mount(AnalyticsModule));
    afterEach(() => ctx.$destroy());

    it('should register textVisibility only', () => {
      const clickProducer = ctx.mockProducer(ClickProducer);
      const textVisibilityProducer = ctx.mockProducer(TextVisibilityProducer);
      const moveProducer = ctx.mockProducer(ThrottledMouseMoveProducer);

      ctx.startPipeline();

      expect(clickProducer.isUsed).toBe(true);
      expect(textVisibilityProducer.isUsed).toBe(true);
      expect(moveProducer.isUsed).toBe(false);

      textVisibilityProducer.emit({ type: 'textVisibility', args: [] });
      expect(eventDisptacher).toHaveBeenCalledWith({ type: 'textVisibility', args: [] });
    });
  });
});
