import { contextHelper, onDestroy } from '../lib';
import { setupEventIdentifier, provideEventEmitter } from '../composables/use-event';
import { setupTrackingLifeCycle } from '../composables/use-tracking-life-cycle';
import { SessionReplayModule } from './session-replay';

const ctx = contextHelper(() => {
  // this function is call each time you run ctx.$mount(...)
  // you can provide/spy all services that will be used by the module you want to test

  const mockSetInterval = jest.spyOn(global, 'setInterval').mockImplementation();
  const mockClearInterval = jest.spyOn(global, 'clearInterval').mockImplementation();

  const mockEventEmitter = jest.fn();
  const lifeCycle = setupTrackingLifeCycle();
  setupEventIdentifier();
  provideEventEmitter(mockEventEmitter);

  onDestroy(() => {
    // this is called each time you call ctx.$detroy()
    mockSetInterval.mockRestore();
    mockClearInterval.mockRestore();
  });

  // here you return every thing you need for your tests
  return {
    mockEventEmitter,
    lifeCycle,
    mockSetInterval,
    mockClearInterval,
  };
});

describe('Simple test exemple' ,() => {
  beforeEach(async () => ctx.$mount(SessionReplayModule));
  afterEach(async () => ctx.$destroy());

  it('should subscribe and unsubscribe', () => {
    expect(ctx.mockEventEmitter).toHaveBeenCalledTimes(0);
    expect(ctx.mockSetInterval).toHaveBeenCalledTimes(0);

    ctx.mockSetInterval.mockReturnValue(666 as any);
    ctx.lifeCycle.start();
    expect(ctx.mockEventEmitter).toHaveBeenCalledTimes(0);
    expect(ctx.mockSetInterval).toHaveBeenCalledTimes(1);

    ctx.mockSetInterval.mock.lastCall![0](); // call interval hook
    expect(ctx.mockEventEmitter).toHaveBeenCalledTimes(1);

    ctx.lifeCycle.stop();
    expect(ctx.mockClearInterval).toHaveBeenCalledWith(666);
  });
})