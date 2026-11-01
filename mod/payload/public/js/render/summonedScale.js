// Display only: battle-created operator copies keep their actual combat footprint and stats.
export const summonedScale = info => info?.side==='ally'&&info?.kind==='op'&&info?.summoned===true?0.8:1;
