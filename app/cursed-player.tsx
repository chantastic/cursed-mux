// https://www.npmjs.com/package/custom-media-element

declare global {
  interface HTMLElementTagNameMap {
    "cursed-player": any;
  }
}

import { CustomVideoElement } from "custom-media-element";

class CursedPlayer extends CustomVideoElement {
  // constructor() {
  //   super();
  // }

  // // Override the play method.
  // play() {
  //   return super.play();
  // }

  // // Override the src getter & setter.
  // get src() {
  //   return super.src;
  // }

  // set src(src) {
  //   super.src = src;
  // }
}

export function registerCursedPlayer() {
  if (typeof window === "undefined") return;

  if (!customElements.get("cursed-player")) {
    customElements.define("cursed-player", CursedPlayer);
  }
}
