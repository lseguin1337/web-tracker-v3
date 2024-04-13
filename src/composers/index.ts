// import { Composer, Producer, Transformer } from "../composables/use-tracking-pipeline";
import { composer, EventHook } from "../composables/use-tracking-pipeline";
import { ClickProducer, DOMProducer } from "../producers";

export const RageClickProducer = composer([ClickProducer], (_, push: EventHook<{ type: 'RageClick', args: [] }>) => {
  console.log('RageClickProducer init');
  const dates: number[] = [];
  return (event) => {
    dates.push(event.args[0].timeStamp);
    if (dates.length > 3) dates.shift();
    if (dates.length === 3 && dates[2] - dates[0] < 300) {
      push({ type: 'RageClick', args: [] });
      dates.splice(0,3);
    }
  };
});

export const TextVisibilityProducer = composer([DOMProducer], (_, push: (event: { type: string, args: any[] }) => void) => {
  console.log('TextVisibilityProducer init');
  let i = 0;
  return (_) => {
    if (i++ % 2) push({ type: 'textVisibility', args: [] });
  };
});
