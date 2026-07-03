export type PanelView =
  | { mode: "player" }
  | { mode: "playlistChooser" }
  | { mode: "playlistEditor"; playlistName: string; page: number };

const panelViews = new Map<string, PanelView>();

export function getPanelView(messageId: string): PanelView {
  return panelViews.get(messageId) ?? { mode: "player" };
}

export function setPanelView(messageId: string, view: PanelView): void {
  panelViews.set(messageId, view);
}
