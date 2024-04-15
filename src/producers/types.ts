export interface SerializedEvent<T extends string = string> {
  type: T;
  args: any[];
}