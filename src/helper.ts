export const make = (itemList: string[], scope: string) => {
  let obj = {};
  itemList.forEach((item) => (obj = { [item]: scope, ...obj }));
  return obj;
};
