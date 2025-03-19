declare global {
  interface HTMLElementTagNameMap {
    "cursed-player": any;
  }
}

export function registerCursedPlayer() {
  if (typeof window === "undefined") return;

  class CursedPlayer extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
      if (!this.shadowRoot) return;

      this.shadowRoot.innerHTML = `
            <style>
              :host {
                display: block;
                font-family: Arial, sans-serif;
                background-color: #f0f0f0;
                padding: 10px;
                border-radius: 5px;
              }
              h1 {
                color: #333;
                margin: 0;
              }
            </style>
            <h1>Hello, World!</h1>
          `;
    }
  }

  if (!customElements.get("cursed-player")) {
    customElements.define("cursed-player", CursedPlayer);
  }
}
