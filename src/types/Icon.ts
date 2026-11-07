import type icons from "../icons";

export interface IconDefinition {
  iconPath: string;
}

export type IconId = keyof typeof icons;
export type FileIconId = Extract<IconId, `_f_${string}`>;
export type FolderOpenIconId = Extract<IconId, `_fd_${string}_open`>;
export type FolderIconId = Exclude<Extract<IconId, `_fd_${string}`>, FolderOpenIconId>;
