import type { FileIconId } from "./types/Icon";

export const make = (itemList: string[], scope: FileIconId) => {
  let obj: Record<string, FileIconId> = {};
  itemList.forEach((item) => (obj = { [item]: scope, ...obj }));
  return obj;
};
