// Optional spell effects travel in BattleSpec; a stock battle has no matching player effect.
import { addShieldLayer } from './items/battle.js';
export function install(battle) {
  battle.on('battleStart', () => {
    for (const ps of battle.players) {
      const data = ps.playerEffects.find(e => e.id === 'spell_shop_battle')?.data;
      if (!data) continue;
      const units = battle.allies(ps.playerId).filter(u => u.kind === 'op');
      for (const u of units) {
        const taunt = data.taunts?.[u.uid];
        if (taunt != null) battle.addBuff(u, { key: 'spell:taunt', mods: { taunt: taunt ? 1 : -(u.s.taunt || 0) }, persist: true });
        if (data.shields?.[u.uid]) addShieldLayer(battle, u, 'spell:wisdom:shield', 1);
      }
      const target = units.find(u => u.uid === data.attackUid);
      if (target && data.attack > 0) {
        // User rule: double this battle's base white ATK, before flat / percent / final modifiers.
        // Unit owns a copy of its base; neither the data definition nor the match piece is changed.
        target.base.atk *= 2;
        target.markDirty();
      }
    }
  });
}
