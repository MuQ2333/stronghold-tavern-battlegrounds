// Add native-style emphasis to new growth prose without changing any visible words.
// Existing style/term tags and literal trigger labels are preserved; no HTML is evaluated.
// i18n-ignore-file: presentation of maintainer-authored game-data text.
const token = /<[@$][A-Za-z0-9_.-]{1,48}>|<\/>|<[^<>]*>|[＋+－-]?\d+(?:\.\d+)?[%％]?|[IVX]+(?=阶)|攻击速度|攻击力|生命上限|生命值|防御力|法术抗性|技力|重新部署|弱点伤害|真实伤害|法术伤害|物理伤害|隐匿|恐惧|寒冷|冻结|眩晕|束缚|停顿/g;

export function growthRichText(text) {
  let depth = 0;
  return String(text || '').replace(token,part=>{
    if (/^<[@$]/.test(part)) { depth++; return part; }
    if (part === '</>') { depth = Math.max(0,depth-1); return part; }
    if (part.startsWith('<') || depth) return part;
    return `<@ba.vup>${part}</>`;
  });
}
