/** Estado dos botões virtuais, escrito pela HUD e lido pela raposa. */
export const touch = {
  left: false,
  right: false,
  jump: false,
  reset() {
    this.left = this.right = this.jump = false;
  },
};
