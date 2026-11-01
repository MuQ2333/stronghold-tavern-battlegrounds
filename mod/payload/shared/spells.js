import { customSpell } from './spellCatalog.js';
// Optional spell-shop rules. IDs and effects stay compatible with existing item grants.


export const spellShopEnabled = (enabled) => enabled === true;

// Explicit families: delayed Doctor Projection remains equipment, including its golden form.
const TARGETED = new Set(['chess_item_1_04_e', 'chess_item_2_06_e', 'chess_item_4_01_e', 'chess_item_5_04_e', 'chess_item_5_05_e']);
const GLOBAL = new Set(['chess_item_1_03_e', 'chess_item_2_02_e', 'chess_item_2_05_e', 'chess_item_2_07_e', 'chess_item_3_12_e', 'chess_item_6_08_e']);
export function spellTarget(rec) {
  if (customSpell(rec?.id)) return rec.spellTarget || customSpell(rec.id).spellTarget;
  const key = String(rec?.id || '').replace(/_[ab]$/, '');
  return TARGETED.has(key) ? 'chess' : GLOBAL.has(key) ? 'global' : null;
}

/** Presentation only: keep official numbers and rich-text tags, adapting equipment wording in shipped locales. */
export function rewriteSpellText(rec, text, labels) {
  if (!spellTarget(rec) || typeof text !== 'string') return text || '';
  const replacements = [
    [/装备时，目标干员和本装备销毁|裝備時，目標幹員和本裝備銷毀|Destroys itself along with the Operator when equipped|装備すると、装備者とこの装備品を破棄し|장착 즉시 목표 오퍼레이터와 장비를 파기하고/g, labels.destroyTarget],
    [/装备时销毁|裝備時銷毀|Destroyed when equipped|装備(?:時|後)に破棄され|장착 즉시 파기/g, ''],
    [/无法装备给自编干员|無法裝備給自編幹員|Cannot be equipped by Custom Operators|自由編成オペレーターは装備不可|선발 오퍼레이터는 장착 불가/g, labels.noCustom],
    [/携带者|攜帶者|equipped Operator|equipping Operator|装備者|착용자/g, labels.target],
  ];
  let out = text.replace(/商店/g, '调度中心').replace(/(?:[〈<])?购买后(?:[〉>])?/g, '<购买后>');
  if(/^chess_item_2_02_e_[ab]$/.test(rec.id)) out=out.replace(/（[^）]*）|\([^)]*\)/g, '');
  if(/^chess_item_2_05_e_[ab]$/.test(rec.id)) out=out.replace(/之后每回合开始时/g, '使用后每回合开始时').replace(/之後每回合開始時/g, '使用後每回合開始時');
  for (const [pattern, replacement] of replacements) out = out.replace(pattern, () => replacement);
  return out.replace(/^[\s，,、。.;；]*(?:并|且|and\s+)?\s*/u, '');
}

/** Live growth values only; update layer increments without altering costs, targets, repeat counts or assignments. */
export function amplifiedSpellText(rec,text,bonus) {
  if(!Number.isFinite(bonus) || !(bonus>0) || !spellTarget(rec) || typeof text!=='string')return text;
  if(!rec.spellMod && !/^chess_item_1_04_e_[ab]$/.test(rec.id))return text;
  const number=n=>`<@ba.vup>${Number(n)+bonus}</>`;
  // Catalogue and Forge's Chinese native-item patches: only the number following a layer increment.
  let out=text.replace(/((?:层数|層數)(?:额外|額外)?(?:<@[^>]+>)?[+＋])([0-9]+)(<\/>)?/g,
    (_,prefix,n,close)=>close?`${prefix}${Number(n)+bonus}${close}`:`${prefix}${number(n)}`);
  // Official translated layer coins retain their existing blue numeric markup.
  if(!rec.spellMod && out===text)out=text.replace(/(<@ba\.vup>[+＋]?)([0-9]+)(<\/>)/g,(_,open,n,close)=>`${open}${Number(n)+bonus}${close}`);
  return out;
}

/** Migrated and native Arts share a visible spell frame in an enabled match. */
export const spellFrame = (rec, enabled) => enabled === true && (!!spellTarget(rec) || rec?.itemType === 'MAGIC');
