// Presentation only: native garrisonIds include implementation records already described by the main trait.
// Keep every record on the actual chess; filtering here must never change battle registration.
export function visibleGarrisonDescriptions(records) {
  const first = records[0];
  return records.filter((g,i) => {
    if (!i || !first || g.operatorTrait) return true;
    if (/^garrison_01_[ab]$/.test(g.garrisonId)) {
      const body = (g.desc || '').replace(/^<战斗中>/,'');
      return !body || !(first.desc || '').includes(body);
    }
    if (/^garrison_141_[ab]$/.test(first.garrisonId) && /^garrison_142_[ab]$/.test(g.garrisonId)
      && first.desc?.includes(g.desc)) return false;
    if (/^garrison_145_[ab]$/.test(first.garrisonId) && /^garrison_(144|159|160)_[ab]$/.test(g.garrisonId)) return false;
    return true;
  });
}
