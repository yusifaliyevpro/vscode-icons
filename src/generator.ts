import fileExtensions from "./icons/fileExtensions";
import fileNames from "./icons/fileNames";
import folderNames from "./icons/folderNames";
import folderNamesExpanded from "./icons/folderNamesExpanded";
export default {
  file: "_file",
  folder: "_folder",
  folderExpanded: "_folder_open",
  // Undefined on purpose: root folders show no icon, and removing these falls back to the folder icon.
  rootFolder: "_root_folder",
  rootFolderExpanded: "_root_folder_open",
  fileExtensions,
  fileNames,
  folderNames,
  folderNamesExpanded,
};
