import { snapHud } from './gameLogic/format.js';

/** Carry a sampled layer map across intervening snapshots, only within the same field and timeline. */
export function liveLayerHud(previous, snap) {
  const hud = snapHud(snap);
  if (!hud) return null;
  const same = previous?.fieldId === snap.fieldId && previous?.gt <= snap.gt;
  return { ...hud, fieldId: snap.fieldId, gt: snap.gt,
    bondLayers: snap.bondLayers || (same ? previous.bondLayers : null) };
}
