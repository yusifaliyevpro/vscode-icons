import fs from "fs";
import generator from "./generator";
import icons from "./icons";

fs.writeFile(
  "icons.json",
  JSON.stringify({
    hidesExplorerArrows: true,
    iconDefinitions: icons,
    ...generator,
  }),
  (err) => {
    if (err) {
      console.log("error", err);
    }
  },
);
