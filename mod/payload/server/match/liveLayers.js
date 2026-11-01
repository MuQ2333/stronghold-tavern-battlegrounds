/** Absolute layers, sampled by the match streamer. No changes to simulation or settlement. */
export function liveBondLayers(battle) {
  const out = {};
  for (const ps of Array.isArray(battle?.players) ? battle.players : []) {
    if (typeof ps?.playerId !== 'string') continue;
    const layers = {};
    for (const [id, bond] of Object.entries(ps.bonds || {})) {
      const n = Number(bond?.layers);
      if (Number.isFinite(n) && n >= 0) layers[id] = n;
    }
    out[ps.playerId] = layers;
  }
  return out;
}

/** Layer tuples are display-only. Merge each player's same-bond gains inside one streamed frame. */
export function compactLayerEvents(events) {
  const out = [], positions = new Map();
  for (const event of events) {
    if (!Array.isArray(event) || event.length !== 4 || event[0] !== 'layer' || !Number.isFinite(event[3]) || event[3] <= 0) { out.push(event); continue; }
    const key = JSON.stringify([event[1], event[2]]);
    if (positions.has(key)) out[positions.get(key)][3] += event[3];
    else { positions.set(key, out.length); out.push([...event]); }
  }
  return out;
}
