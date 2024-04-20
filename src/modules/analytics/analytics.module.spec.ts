import { fakeTrackerContext } from "@/tests/utils";
import { ClickProducer, ThrottledMouseMoveProducer } from "@/producers/pointers";
import { TextVisibilityProducer } from "@/producers/dom";
import { AnalyticsModule } from "./analytics.module";

const eventDisptacher = jest.fn();

// mock the recording dispatcher
jest.mock('./use-analytics-dispatcher', () => ({
  useAnalyticsDispatcher: jest.fn().mockImplementation(() => eventDisptacher),
}));

const noFeatureCtx = fakeTrackerContext({ heatmap: false, textVisibility: false });
const heatmapCtx = fakeTrackerContext({ heatmap: true });
const textVisibilityCtx = fakeTrackerContext({ textVisibility: true });

describe('Analytics', () => {
  afterEach(() => eventDisptacher.mockClear());

  describe('Without Feature', () => {
    beforeEach(() => noFeatureCtx.$mount(AnalyticsModule));
    afterEach(() => noFeatureCtx.$destroy());

    it('should not register heatmap and textVisibility', () => {
      const clickProducer = noFeatureCtx.mockProducer(ClickProducer);
      const textVisibilityProducer = noFeatureCtx.mockProducer(TextVisibilityProducer);
      const moveProducer = noFeatureCtx.mockProducer(ThrottledMouseMoveProducer);

      noFeatureCtx.start();

      expect(clickProducer.isUsed).toBe(true);
      expect(textVisibilityProducer.isUsed).toBe(false);
      expect(moveProducer.isUsed).toBe(false);

      clickProducer.emit({ type: 'click', args: [{ timeStamp: 12 }] });
      expect(eventDisptacher).toHaveBeenCalledWith({ type: 'click', args: [{ timeStamp: 12 }] });
    });
  });

  describe('With heatmap', () => {
    beforeEach(() => heatmapCtx.$mount(AnalyticsModule));
    afterEach(() => heatmapCtx.$destroy());

    it('should register heatmap only', () => {
      const clickProducer = heatmapCtx.mockProducer(ClickProducer);
      const textVisibilityProducer = heatmapCtx.mockProducer(TextVisibilityProducer);
      const moveProducer = heatmapCtx.mockProducer(ThrottledMouseMoveProducer);

      heatmapCtx.start();

      expect(clickProducer.isUsed).toBe(true);
      expect(textVisibilityProducer.isUsed).toBe(false);
      expect(moveProducer.isUsed).toBe(true);

      moveProducer.emit({ type: 'mousemove', args: [] });
      expect(eventDisptacher).toHaveBeenCalledWith({ type: 'mousemove', args: [] });
    });
  });

  describe('With textVisibility', () => {
    beforeEach(() => textVisibilityCtx.$mount(AnalyticsModule));
    afterEach(() => textVisibilityCtx.$destroy());

    it('should register heatmap only', () => {
      const clickProducer = textVisibilityCtx.mockProducer(ClickProducer);
      const textVisibilityProducer = textVisibilityCtx.mockProducer(TextVisibilityProducer);
      const moveProducer = textVisibilityCtx.mockProducer(ThrottledMouseMoveProducer);

      textVisibilityCtx.start();

      expect(clickProducer.isUsed).toBe(true);
      expect(textVisibilityProducer.isUsed).toBe(true);
      expect(moveProducer.isUsed).toBe(false);

      textVisibilityProducer.emit({ type: 'textVisibility', args: [] });
      expect(eventDisptacher).toHaveBeenCalledWith({ type: 'textVisibility', args: [] });
    });
  });
});
