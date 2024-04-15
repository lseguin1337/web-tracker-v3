import { composer } from "../composables/use-tracking-pipeline";
import { ClickProducer } from "./pointers";
import { SerializedEvent } from "./types";

export const RageClickProducer = composer<SerializedEvent<'click'>, SerializedEvent<'rageClick'>>([ClickProducer], (push) => {
  if (__DEBUG__) console.log('RageClickProducer init');
  const dates: number[] = [];
  return (event) => {
    dates.push(event.args[0].timeStamp);
    if (dates.length > 3) dates.shift();
    if (dates.length === 3 && dates[2] - dates[0] < 300) {
      push({ type: 'rageClick', args: [] });
      dates.splice(0,3);
    }
  };
});