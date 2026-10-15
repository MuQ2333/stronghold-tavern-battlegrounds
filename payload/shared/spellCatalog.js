// Optional user-designed spells. Source: spell-shop-upstream/spells.draft.json. Art is downloaded separately.
export const SPELL_CATALOG = Object.freeze({
  "hs_bg33_101": {
    "id": "hs_bg33_101",
    "name": "新生幼苗", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 1,
    "price": 2,
    "desc": "发现一名1阶干员。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "发现一名1阶干员。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG33_101",
    "artUrl": "/assets/spells/BG33_101.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_966": {
    "id": "hs_bg28_966",
    "name": "意外之果", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 1,
    "price": 1,
    "desc": "使当前调度中心中的干员获得购买奖励：<购买后>，使其所属盟约层数+2。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "使当前调度中心中的干员获得购买奖励：<购买后>，使其所属盟约层数+2。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_966",
    "artUrl": "/assets/spells/BG28_966.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_503": {
    "id": "hs_bg28_503",
    "name": "强固", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 1,
    "price": 1,
    "desc": "使目标干员获得嘲讽。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "使目标干员获得嘲讽。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_503",
    "artUrl": "/assets/spells/BG28_503.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_ebg_spell_014": {
    "id": "hs_ebg_spell_014",
    "name": "尖利箭矢", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 1,
    "price": 1,
    "desc": "使目标干员所属主盟约层数+4。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "使目标干员所属主盟约层数+4。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "EBG_Spell_014",
    "artUrl": "/assets/spells/EBG_Spell_014.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_827": {
    "id": "hs_bg28_827",
    "name": "快速浏览", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 2,
    "price": 1,
    "desc": "获得2次免费刷新。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "获得2次免费刷新。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_827",
    "artUrl": "/assets/spells/BG28_827.png?v=3",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_571": {
    "id": "hs_bg28_571",
    "name": "拼命发掘", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 2,
    "price": 3,
    "desc": "获得1资金，购买本法术将消耗生命值，而非资金。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "获得1资金，购买本法术将消耗生命值，而非资金。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_571",
    "artUrl": "/assets/spells/BG28_571.png?v=2",
    "choices": null,
    "poolDisabled": false,
    "currency": "life"
  },
  "hs_bg34_330": {
    "id": "hs_bg34_330",
    "name": "搜寻时光", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 2,
    "price": 2,
    "desc": "发现一名等阶等于当前调度中心等级的干员，将其锁定在整备区，直到下回合开始。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "发现一名等阶等于当前调度中心等级的干员，将其锁定在整备区，直到下回合开始。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG34_330",
    "artUrl": "/assets/spells/BG34_330.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg36_883": {
    "id": "hs_bg36_883",
    "name": "赢家的面包", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 2,
    "price": 2,
    "desc": "使目标干员所属盟约层数+3。若下一场战斗未漏怪，下回合开始时，使这些盟约层数额外+6。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "使目标干员所属盟约层数+3。若下一场战斗未漏怪，下回合开始时，使这些盟约层数额外+6。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG36_883",
    "artUrl": "/assets/spells/BG36_883.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg35_951": {
    "id": "hs_bg35_951",
    "name": "暴风城之力", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 2,
    "price": 2,
    "desc": "随机选择最多4名场上干员，使其所属盟约层数+2。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "随机选择最多4名场上干员，使其所属盟约层数+2。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG35_951",
    "artUrl": "/assets/spells/BG35_951.png?v=2",
    "choices": null,
    "poolDisabled": true
  },
  "hs_bg28_884": {
    "id": "hs_bg28_884",
    "name": "自负", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 3,
    "price": 1,
    "desc": "若下一场战斗未漏怪，获得3资金；若本方漏怪但队友兜底成功，则获得1资金。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "若下一场战斗未漏怪，获得3资金；若本方漏怪但队友兜底成功，则获得1资金。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_884",
    "artUrl": "/assets/spells/BG28_884.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg30_804": {
    "id": "hs_bg30_804",
    "name": "稳健异变", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 3,
    "price": 1,
    "desc": "将目标干员随机变形为高一阶的干员。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "将目标干员随机变形为高一阶的干员。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG30_804",
    "artUrl": "/assets/spells/BG30_804.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_886": {
    "id": "hs_bg28_886",
    "name": "富足之杖", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 3,
    "price": 2,
    "desc": "在本局模拟中，使调度中心中的干员获得购买奖励：<购买后>，使其所属盟约层数+1。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "在本局模拟中，使调度中心中的干员获得购买奖励：<购买后>，使其所属盟约层数+1。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_886",
    "artUrl": "/assets/spells/BG28_886.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_520": {
    "id": "hs_bg28_520",
    "name": "搞怪裤", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 3,
    "price": 1,
    "desc": "若目标干员没有嘲讽，则使其获得嘲讽；若其已有嘲讽，则移除嘲讽。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "若目标干员没有嘲讽，则使其获得嘲讽；若其已有嘲讽，则移除嘲讽。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_520",
    "artUrl": "/assets/spells/BG28_520.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_168": {
    "id": "hs_bg28_168",
    "name": "闪亮的戒指", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 3,
    "price": 2,
    "desc": "对每名场上干员，使其所属盟约层数+1。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "对每名场上干员，使其所属盟约层数+1。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_168",
    "artUrl": "/assets/spells/BG28_168.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg31_881": {
    "id": "hs_bg31_881",
    "name": "时间管理", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 3,
    "price": 4,
    "desc": "抉择：对每名场上干员，使其所属盟约层数+2；或在下回合开始时执行该效果两次。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "抉择：对每名场上干员，使其所属盟约层数+2；或在下回合开始时执行该效果两次。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG31_881",
    "artUrl": "/assets/spells/BG31_881.png?v=2",
    "choices": [
      "立即使每名场上干员所属盟约层数+2（无需激活盟约）。", // i18n-ignore: user-authored game data, Chinese game-text fallback
      "下回合开始时，使每名场上干员所属盟约层数+2，执行两次（无需激活盟约）。" // i18n-ignore: user-authored game data, Chinese game-text fallback
    ],
    "poolDisabled": true
  },
  "hs_bg31_881_choice0": {
    "id": "hs_bg31_881_choice0",
    "name": "时间管理", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 3,
    "price": 4,
    "desc": "立即使每名场上干员所属盟约层数+2（无需激活盟约）。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "立即使每名场上干员所属盟约层数+2（无需激活盟约）。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": true,
    "multiplayerOnly": false,
    "iconId": "BG31_881",
    "artUrl": "/assets/spells/BG31_881.png?v=2",
    "choices": null,
    "poolDisabled": true
  },
  "hs_bg31_881_choice1": {
    "id": "hs_bg31_881_choice1",
    "name": "时间管理", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 3,
    "price": 4,
    "desc": "下回合开始时，使每名场上干员所属盟约层数+2，执行两次（无需激活盟约）。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "下回合开始时，使每名场上干员所属盟约层数+2，执行两次（无需激活盟约）。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": true,
    "multiplayerOnly": false,
    "iconId": "BG31_881",
    "artUrl": "/assets/spells/BG31_881.png?v=2",
    "choices": null,
    "poolDisabled": true
  },
  "hs_bg32_337": {
    "id": "hs_bg32_337",
    "name": "海鲜乱炖", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 3,
    "price": 2,
    "desc": "使目标干员所属盟约层数+1。每有一个已激活的盟约，额外重复一次。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "使目标干员所属盟约层数+1。每有一个已激活的盟约，额外重复一次。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG32_337",
    "artUrl": "/assets/spells/BG32_337.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_888": {
    "id": "hs_bg28_888",
    "name": "乱放的茶具", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 4,
    "price": 3,
    "desc": "使每个已激活的盟约层数+4。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "使每个已激活的盟约层数+4。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_888",
    "artUrl": "/assets/spells/BG28_888.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_825": {
    "id": "hs_bg28_825",
    "name": "防御者的仪式", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 4,
    "price": 2,
    "desc": "使目标干员所属盟约层数+3，并使其获得嘲讽。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "使目标干员所属盟约层数+3，并使其获得嘲讽。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_825",
    "artUrl": "/assets/spells/BG28_825.png?v=2",
    "choices": null,
    "poolDisabled": true
  },
  "hs_bg28_601": {
    "id": "hs_bg28_601",
    "name": "克隆螺号", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 4,
    "price": 4,
    "desc": "随机获得一名干员及其一个复制。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "随机获得一名干员及其一个复制。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_601",
    "artUrl": "/assets/spells/BG28_601.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg31_819": {
    "id": "hs_bg31_819",
    "name": "寒热骤变", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 4,
    "price": 4,
    "desc": "获得一名耶拉和一名卡涅利安。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "获得一名耶拉和一名卡涅利安。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG31_819",
    "artUrl": "/assets/spells/BG31_819.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg34_689": {
    "id": "hs_bg34_689",
    "name": "鲜血宝石弹幕", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 4,
    "price": 1,
    "desc": "在本局模拟中，使调度中心中的干员获得购买奖励：<购买后>，使其所属盟约层数+1。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "在本局模拟中，使调度中心中的干员获得购买奖励：<购买后>，使其所属盟约层数+1。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG34_689",
    "artUrl": "/assets/spells/BG34_689.png?v=2",
    "choices": null,
    "poolDisabled": true
  },
  "hs_bg31_890": {
    "id": "hs_bg31_890",
    "name": "无限潜力", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 4,
    "price": 3,
    "desc": "抉择：发现一名当前调度中心等级的干员；或发现一张当前调度中心等级的法术。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "抉择：发现一名当前调度中心等级的干员；或发现一张当前调度中心等级的法术。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG31_890",
    "artUrl": "/assets/spells/BG31_890.png?v=2",
    "choices": [
      "发现一名当前调度中心等级的干员。", // i18n-ignore: user-authored game data, Chinese game-text fallback
      "发现一张当前调度中心等级的法术。" // i18n-ignore: user-authored game data, Chinese game-text fallback
    ],
    "poolDisabled": false
  },
  "hs_bg31_890_choice0": {
    "id": "hs_bg31_890_choice0",
    "name": "无限潜力", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 4,
    "price": 3,
    "desc": "发现一名当前调度中心等级的干员。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "发现一名当前调度中心等级的干员。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": true,
    "multiplayerOnly": false,
    "iconId": "BG31_890",
    "artUrl": "/assets/spells/BG31_890.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg31_890_choice1": {
    "id": "hs_bg31_890_choice1",
    "name": "无限潜力", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 4,
    "price": 3,
    "desc": "发现一张当前调度中心等级的法术。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "发现一张当前调度中心等级的法术。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": true,
    "multiplayerOnly": false,
    "iconId": "BG31_890",
    "artUrl": "/assets/spells/BG31_890.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg34_444": {
    "id": "hs_bg34_444",
    "name": "乘借东风", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 4,
    "price": 1,
    "desc": "在本局模拟中，使调度中心最右侧的干员获得购买奖励：<购买后>，使其所属盟约层数+3。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "在本局模拟中，使调度中心最右侧的干员获得购买奖励：<购买后>，使其所属盟约层数+3。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG34_444",
    "artUrl": "/assets/spells/BG34_444.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg35_912": {
    "id": "hs_bg35_912",
    "name": "艾欧娜尔的眷顾", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 4,
    "price": 2,
    "desc": "在本局模拟中，使调度中心中与目标干员至少有一个相同盟约的干员获得购买奖励：<购买后>，使其所属盟约层数+2。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "在本局模拟中，使调度中心中与目标干员至少有一个相同盟约的干员获得购买奖励：<购买后>，使其所属盟约层数+2。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG35_912",
    "artUrl": "/assets/spells/BG35_912.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg36_884": {
    "id": "hs_bg36_884",
    "name": "武器锻造", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 4,
    "price": 2,
    "desc": "获得3张尖利箭矢。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "获得3张尖利箭矢。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG36_884",
    "artUrl": "/assets/spells/BG36_884.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "mod_support": {
    "id": "mod_support",
    "name": "支援", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 4,
    "price": 1,
    "desc": "选择一个空闲地面格放置法术标记。战斗开始时部署一名带嘲讽、携带二技能〈荆棘〉的普通星熊。每回合最多施放一张。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "选择一个空闲地面格放置法术标记。战斗开始时部署一名带嘲讽、携带二技能〈荆棘〉的普通星熊。每回合最多施放一张。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "tile",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "hoshiguma_shield",
    "artUrl": "/assets/spells/hoshiguma_shield_illustration.png?v=4",
    "choices": null,
    "poolDisabled": false,
    "oncePerRound": true
  },
  "hs_bg28_500": {
    "id": "hs_bg28_500",
    "name": "护甲储备", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 5,
    "price": 3,
    "desc": "将你的护甲值设为5。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "将你的护甲值设为5。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_500",
    "artUrl": "/assets/spells/BG28_500.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_830": {
    "id": "hs_bg28_830",
    "name": "点金之触", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 5,
    "price": 5,
    "desc": "随机将调度中心中的一名初始干员变为精锐干员。购买该干员时，获得一次晋升奖励。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "随机将调度中心中的一名初始干员变为精锐干员。购买该干员时，获得一次晋升奖励。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_830",
    "artUrl": "/assets/spells/BG28_830.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_849": {
    "id": "hs_bg28_849",
    "name": "顶尖好酒", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 5,
    "price": 2,
    "desc": "刷新调度中心，使全部商品栏位变为法术。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "刷新调度中心，使全部商品栏位变为法术。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_849",
    "artUrl": "/assets/spells/BG28_849.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_gil_836": {
    "id": "hs_bg28_gil_836",
    "name": "猎头招聘", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 5,
    "price": 3,
    "desc": "发现一名特质为<获得时>的干员。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "发现一名特质为<获得时>的干员。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_GIL_836",
    "artUrl": "/assets/spells/BG28_GIL_836.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_ebg_spell_032": {
    "id": "hs_ebg_spell_032",
    "name": "祈请吞噬者", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 5,
    "price": 4,
    "desc": "出售目标干员。若其所属主盟约未激活，清空该主盟约的层数，并使一个已激活的主盟约层数+等量数值。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "出售目标干员。若其所属主盟约未激活，清空该主盟约的层数，并使一个已激活的主盟约层数+等量数值。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "EBG_Spell_032",
    "artUrl": "/assets/spells/EBG_Spell_032.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_607": {
    "id": "hs_bg28_607",
    "name": "腐化糕点", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 5,
    "price": 4,
    "desc": "吞食调度中心中最多3名随机干员，并分别触发一次其购买时效果。使目标干员所属盟约层数+吞食干员等阶总和的一半（向下取整）。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "吞食调度中心中最多3名随机干员，并分别触发一次其购买时效果。使目标干员所属盟约层数+吞食干员等阶总和的一半（向下取整）。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_607",
    "artUrl": "/assets/spells/BG28_607.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg31_886": {
    "id": "hs_bg31_886",
    "name": "森林秘宝", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 5,
    "price": 2,
    "desc": "抉择：使目标干员所属盟约层数+8；或对每名场上干员，使其所属盟约层数+2。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "抉择：使目标干员所属盟约层数+8；或对每名场上干员，使其所属盟约层数+2。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG31_886",
    "artUrl": "/assets/spells/BG31_886.png?v=2",
    "choices": [
      "使目标干员所属盟约层数+8（无需激活盟约）。", // i18n-ignore: user-authored game data, Chinese game-text fallback
      "使每名场上干员的所属盟约层数+2（无需激活盟约）。" // i18n-ignore: user-authored game data, Chinese game-text fallback
    ],
    "poolDisabled": true
  },
  "hs_bg31_886_choice0": {
    "id": "hs_bg31_886_choice0",
    "name": "森林秘宝", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 5,
    "price": 2,
    "desc": "使目标干员所属盟约层数+8（无需激活盟约）。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "使目标干员所属盟约层数+8（无需激活盟约）。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": true,
    "multiplayerOnly": false,
    "iconId": "BG31_886",
    "artUrl": "/assets/spells/BG31_886.png?v=2",
    "choices": null,
    "poolDisabled": true
  },
  "hs_bg31_886_choice1": {
    "id": "hs_bg31_886_choice1",
    "name": "森林秘宝", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 5,
    "price": 2,
    "desc": "使每名场上干员的所属盟约层数+2（无需激活盟约）。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "使每名场上干员的所属盟约层数+2（无需激活盟约）。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": true,
    "multiplayerOnly": false,
    "iconId": "BG31_886",
    "artUrl": "/assets/spells/BG31_886.png?v=2",
    "choices": null,
    "poolDisabled": true
  },
  "hs_bg34_889": {
    "id": "hs_bg34_889",
    "name": "诺兹多姆的子嗣", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 5,
    "price": 2,
    "desc": "战斗开始时，使最靠右下的场上干员攻击力翻倍。每回合最多施放一张。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "战斗开始时，使最靠右下的场上干员攻击力翻倍。每回合最多施放一张。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG34_889",
    "artUrl": "/assets/spells/BG34_889.png?v=2",
    "choices": null,
    "poolDisabled": false,
    "oncePerRound": true
  },
  "mod_corroded_covenant_coin": {
    "id": "mod_corroded_covenant_coin",
    "name": "腐蚀的盟约之币", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 5,
    "price": 2,
    "desc": "获得2资金。若本牌在回合结束时因整备区已满而被弃掉，则在本局模拟中，从下回合开始，每回合额外获得2资金。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "获得2资金。若本牌在回合结束时因整备区已满而被弃掉，则在本局模拟中，从下回合开始，每回合额外获得2资金。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG36_303",
    "artUrl": "/assets/spells/BG36_303.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_ebg_spell_038": {
    "id": "hs_ebg_spell_038",
    "name": "哈缪尔遗失的法杖", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 6,
    "price": 2,
    "desc": "刷新全部干员栏位，使其变为与目标干员共享至少一个盟约的干员。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "刷新全部干员栏位，使其变为与目标干员共享至少一个盟约的干员。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "EBG_Spell_038",
    "artUrl": "/assets/spells/EBG_Spell_038.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_ebg_spell_017": {
    "id": "hs_ebg_spell_017",
    "name": "大地母亲之眼", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 6,
    "price": 4,
    "desc": "使目标4阶及以下的初始干员晋升为精锐干员。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "使目标4阶及以下的初始干员晋升为精锐干员。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "EBG_Spell_017",
    "artUrl": "/assets/spells/EBG_Spell_017.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_838": {
    "id": "hs_bg28_838",
    "name": "完美形象", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 6,
    "price": 2,
    "desc": "将目标干员所属盟约层数各设为30。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "将目标干员所属盟约层数各设为30。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_838",
    "artUrl": "/assets/spells/BG28_838.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_169": {
    "id": "hs_bg28_169",
    "name": "艾泽里特强化", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 6,
    "price": 4,
    "desc": "对每名场上干员，使其所属盟约层数+4。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "对每名场上干员，使其所属盟约层数+4。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_169",
    "artUrl": "/assets/spells/BG28_169.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "mod_discount_bundle": {
    "id": "mod_discount_bundle",
    "name": "折价合集", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 5,
    "price": 4,
    "desc": "发现一名干员。其余候选随机分配给队友，在下回合开始时获得。仅限多人模式。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "发现一名干员。其余候选随机分配给队友，在下回合开始时获得。仅限多人模式。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": true,
    "iconId": "BG31_242",
    "artUrl": "/assets/spells/BG31_242.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "mod_sharing_care": {
    "id": "mod_sharing_care",
    "name": "分享关爱", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 6,
    "price": 2,
    "desc": "下一场战斗开始时，使你层数最高且未达999层的盟约，临时获得一名随机队友的一个随机已激活盟约的层数。临时层数不占用永久层数上限。（接收层数的盟约无需激活）每回合最多施放一张。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "下一场战斗开始时，使你层数最高且未达999层的盟约，临时获得一名随机队友的一个随机已激活盟约的层数。临时层数不占用永久层数上限。（接收层数的盟约无需激活）每回合最多施放一张。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": true,
    "iconId": "BG31_889",
    "artUrl": "/assets/spells/BG31_889.png?v=2",
    "choices": null,
    "poolDisabled": false,
    "oncePerRound": true
  },
  "mod_identity_revealed": {
    "id": "mod_identity_revealed",
    "name": "身份揭晓", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 5,
    "price": 3,
    "desc": "发现一个新的策略，替换当前策略。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "发现一个新的策略，替换当前策略。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "EBG_Spell_037",
    "artUrl": "/assets/spells/EBG_Spell_037.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg30_802": {
    "id": "hs_bg30_802",
    "name": "智慧球", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 6,
    "price": 3,
    "desc": "你的下2次主动刷新均为有用的刷新！", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "你的下2次主动刷新均为有用的刷新！", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "global",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG30_802",
    "artUrl": "/assets/spells/BG30_802.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg35_952": {
    "id": "hs_bg35_952",
    "name": "背靠背", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 4,
    "price": 1,
    "desc": "使目标干员所属盟约层数+1。本局此前每施放一次背靠背，额外执行一次。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "使目标干员所属盟约层数+1。本局此前每施放一次背靠背，额外执行一次。（无需激活盟约）", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG35_952",
    "artUrl": "/assets/spells/BG35_952.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_814": {
    "id": "hs_bg28_814",
    "name": "回响咆哮", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 3,
    "price": 2,
    "desc": "使目标干员获得额外特质：〈休整期结束时〉使自身已激活的所属盟约层数+2。可叠加。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "使目标干员获得额外特质：〈休整期结束时〉使自身已激活的所属盟约层数+2。可叠加。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_814",
    "artUrl": "/assets/spells/BG28_814.png?v=2",
    "choices": null,
    "poolDisabled": false
  },
  "hs_bg28_883": {
    "id": "hs_bg28_883",
    "name": "沉睡者之拥", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "tier": 5,
    "price": 3,
    "desc": "触发目标干员的〈获得时〉效果。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "descRaw": "触发目标干员的〈获得时〉效果。", // i18n-ignore: user-authored game data, Chinese game-text fallback
    "itemType": "EQUIP",
    "kind": "spell",
    "mergeable": false,
    "isGolden": false,
    "spellTarget": "chess",
    "spellMod": true,
    "spellOption": false,
    "multiplayerOnly": false,
    "iconId": "BG28_883",
    "artUrl": "/assets/spells/BG28_883.png?v=2",
    "choices": null,
    "poolDisabled": false
  }
});
export const customSpell = id => typeof id === "string" && Object.hasOwn(SPELL_CATALOG, id) ? SPELL_CATALOG[id] : null;
export const ALL_SPELLS = Object.freeze(Object.values(SPELL_CATALOG).filter(c => !c.spellOption));
export const SHOP_SPELLS = Object.freeze(ALL_SPELLS.filter(c => !c.poolDisabled));
