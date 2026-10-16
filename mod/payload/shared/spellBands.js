// Mid-match strategy replacement eligibility for the optional spell shop.
// Only effects whose future hooks work from bandId are allowed. Starting HP and map setup are not replayed.
import { replacementHeroEligible } from './heroPowerPools.js';
const RECURRING = new Set([
  'prep_finish_char_bond_add_layer', 'band_first_self_refresh_present_char',
  'band_shop_refresh_copy_max_lv_char', 'band_coin_cost_gain_random_char_by_shop_level',
  'gain_bond_char_per_round', 'first_buy_in_round_char_price_change',
  'band_cost_coin_reach_cnt_gain_chess_from_pool', 'preparation_start_gain_chess_every_n_round',
  'coin_carry_over', 'round_start_all_player_change_enemy_2',
  'round_start_activate_char_chess_effect_in_board', 'first_sell_char_chess_exchange_char_chess_in_shop',
  'round_start_gain_char_chess_in_shop_every_n_round', 'round_start_gain_coin_by_bond_char_chess_buy',
  'refresh_shop_count_gain_coin_bond_char_chess', 'preparation_start_add_special_goods_every_n_round',
]);
const DATED = new Set(['preparation_start_gain_chess_from_round', 'give_coin_in_round',
  'prep_start_gain_chess_from_pool_in_round', 'round_start_bond_check_gain_layer']);
// Native strategy inclusion is a maintainer decision. Future imported heroes use their source game's pool policy.
export const SPELL_NATIVE_BANDS = Object.freeze([
  "band_bldsk",
  "band_amiya",
  "band_duyaoy",
  "band_orchid",
  "band_justin",
  "band_ermengard",
  "band_kirara",
  "band_pepe",
  "band_harold",
  "band_sciurus",
  "band_clementia",
  "band_emperor",
  "band_mberry",
  "band_humus",
  "band_doberm",
  "band_cathy",
  "band_malkie",
  "band_qalaisa",
  "band_chen",
  "band_damaztic",
  "band_dusk",
  "band_cannot",
  "band_ducklord",
  "band_lisa",
  "band_vodfox",
  "band_ioleta",
  "band_jesica",
  "band_mlyss",
  "band_makiri",
  "band_fang",
  "band_mlynar",
  "band_chiave",
  "band_narant"
]);

export function spellBandPool(gd, { round, level, current = null, taken = [], temporary = false, heroes = false }, { approvedNative = SPELL_NATIVE_BANDS } = {}) {
  return gd.bandIds().filter(id => {
    if (id === 'band_pith' || id === current || taken.includes(id)) return false;
    if (heroes && replacementHeroEligible(gd.band(id), { temporary, round, level })) return true;
    if (!approvedNative.includes(id)) return false;
    const buffs = gd.band(id)?.buffs || [];
    if (buffs.some(b => b.key === 'auto_chess_change_map')) return false;
    return buffs.some(b => b.key === 'env_gbuff_new_with_verify' || RECURRING.has(b.key)
      || (b.key === 'preparation_start_gain_chess_from_round' && Number(b.bb?.round) === 1 && (!temporary || round === 1))
      || (DATED.has(b.key) && (temporary ? Number(b.bb?.round) === round : Number(b.bb?.round) > round))
      || (['up_shop_next_refresh_must_present_bond_char', 'up_shop_add_special_goods'].includes(b.key) && level < gd.maxShopLevel));
  });
}
