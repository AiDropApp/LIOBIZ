import type { ImgHTMLAttributes, MouseEvent, VideoHTMLAttributes } from "react";

export const MEDIA_PROTECT_CLASS = "media-protect";

export function blockMediaContextMenu(e: MouseEvent) {
  e.preventDefault();
}

export const protectedVideoProps: Pick<
  VideoHTMLAttributes<HTMLVideoElement>,
  "controlsList" | "disablePictureInPicture" | "onContextMenu" | "draggable"
> = {
  controlsList: "nodownload noremoteplayback",
  disablePictureInPicture: true,
  onContextMenu: blockMediaContextMenu,
  draggable: false,
};

export const protectedImageProps: Pick<
  ImgHTMLAttributes<HTMLImageElement>,
  "draggable" | "onContextMenu"
> = {
  draggable: false,
  onContextMenu: blockMediaContextMenu,
};
