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
      expect(noFeatureCtx.isRegistered(ThrottledMouseMoveProducer)).toBe(false);
      expect(noFeatureCtx.isRegistered(TextVisibilityProducer)).toBe(false);
      noFeatureCtx.fakeDispatcher(ClickProducer)({ type: 'click', args: [] });
      expect(eventDisptacher).toHaveBeenCalledWith({ type: 'click', args: [] });
    });
  });

  describe('With heatmap', () => {
    beforeEach(() => heatmapCtx.$mount(AnalyticsModule));
    afterEach(() => heatmapCtx.$destroy());

    it('should register heatmap only', () => {
      expect(heatmapCtx.isRegistered(ThrottledMouseMoveProducer)).toBe(true);
      expect(heatmapCtx.isRegistered(TextVisibilityProducer)).toBe(false);
      heatmapCtx.fakeDispatcher(ThrottledMouseMoveProducer)({ type: 'mousemove', args: [] });
      expect(eventDisptacher).toHaveBeenCalledWith({ type: 'mousemove', args: [] });
    });
  });

  describe('With textVisibility', () => {
    beforeEach(() => textVisibilityCtx.$mount(AnalyticsModule));
    afterEach(() => textVisibilityCtx.$destroy());

    it('should register textVisibility only', () => {
      expect(textVisibilityCtx.isRegistered(ThrottledMouseMoveProducer)).toBe(false);
      expect(textVisibilityCtx.isRegistered(TextVisibilityProducer)).toBe(true);
      textVisibilityCtx.fakeDispatcher(TextVisibilityProducer)({ type: 'textVisibility', args: [] });
      expect(eventDisptacher).toHaveBeenCalledWith({ type: 'textVisibility', args: [] });
    });
  });
});