// i18n-ignore-file: imported game-data snapshot, not interface msgids; see docs/I18N.md.
// Mode-only snapshot from Forge-Mods/demo/fanpack-kazdel-rhodes; never official generated data.
// Source file SHA256: {"chess":"8dfdd86cf074905b60a54058aa4b4474c83661150e0c2d4f3bd38f59821b5e08","tokens":"f32d4a0b101fa98fe1fc2f3df61f90bc7bb682ba5b42662e0717ed7ad4260dca","items":"a58f02b2998827d0fd71b9e5f3aec4a65ee27bfab2ead0d8e4eaef51a60fb55c","bonds":"ab41d0ba6b239bdf61487dd59ba532ca54e511934882cd90bcb3eea2e351c742"}
// Character bodies/skills/modules are the source pack records; new traits and affiliations are applied separately.
export const GROWTH_KAZDEL = {
  "chess": {
    "chess_char_9_01_a": {
      "chessId": "chess_char_9_01_a",
      "baseId": "chess_char_9_01_a",
      "goldenId": "chess_char_9_01_b",
      "isGolden": false,
      "tier": 1,
      "identifier": 900,
      "isHidden": false,
      "isDiy": false,
      "visible": true,
      "chessType": "PRESET",
      "backup": {
        "charId": "char_290_vigna",
        "tmplId": null,
        "skillIndex": 1,
        "uniEquipId": "uniequip_002_vigna",
        "potRank": 0
      },
      "shopSortId": 900,
      "charId": "char_290_vigna",
      "name": "红豆",
      "appellation": "Vigna",
      "rarity": 4,
      "profession": "PIONEER",
      "subProfessionId": "charger",
      "subProfessionName": "冲锋手",
      "position": "MELEE",
      "nationId": "columbia",
      "bonds": [
        "kazdelShip",
        "indomShip"
      ],
      "garrisonIds": [
        "garrison_04_a"
      ],
      "price": 2,
      "sellPrice": 1,
      "upgradeNum": 3,
      "upgradeChessId": "chess_char_9_01_b",
      "status": {
        "phase": 1,
        "level": 55,
        "skillLevel": 4,
        "equipLevel": 0
      },
      "stats": {
        "maxHp": 1267,
        "atk": 482,
        "def": 281,
        "res": 0,
        "cost": 9,
        "blockCnt": 1,
        "bat": 1,
        "aspd": 100,
        "respawnTime": 66,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "immunities": {
        "stun": false,
        "silence": false,
        "sleep": false,
        "frozen": false,
        "levitate": false
      },
      "rangeId": "1-1",
      "rangeGrid": [
        [
          0,
          0
        ],
        [
          0,
          1
        ]
      ],
      "dmgType": "phys",
      "attackKind": "melee",
      "projectile": "none",
      "canHitFly": false,
      "targetPriority": null,
      "trait": {
        "desc": "击杀敌人后获得1点部署费用，撤退时返还初始部署费用",
        "descRaw": "击杀敌人后获得1点部署费用，撤退时返还初始部署费用",
        "bb": {
          "cost": 1
        },
        "bbStr": {},
        "rangeGrid": null
      },
      "skill": {
        "skillId": "skchr_vigna_2",
        "iconId": "skchr_vigna_2",
        "name": "槌音",
        "level": 4,
        "desc": "攻击间隔略微增大，攻击力+120%",
        "descRaw": "攻击间隔<@ba.vdown>略微增大</>，攻击力<@ba.vup>+120%</>",
        "skillType": "MANUAL",
        "durationType": "NONE",
        "duration": 22,
        "spType": "INCREASE_WITH_TIME",
        "spCost": 32,
        "initSp": 0,
        "maxChargeTime": 1,
        "increment": 1,
        "bb": {
          "atk": 1.2,
          "base_attack_time": 0.5
        },
        "bbStr": {},
        "rangeId": null,
        "rangeGrid": null,
        "prefabId": "skchr_vigna_2",
        "trigger": {
          "rule": "DEFAULT",
          "rawRule": "DEFAULT",
          "customRangeGrid": null
        },
        "index": 1,
        "overrideTokenKey": null
      },
      "talents": [
        {
          "index": 0,
          "name": "蛮力穿刺",
          "desc": "攻击时，10%几率当次攻击的攻击力+60%（+10%）。技能中这个几率提高到30%",
          "descRaw": "攻击时，10%几率当次攻击的攻击力+60%<@ba.talpu>（+10%）</>。技能中这个几率提高到30%",
          "bb": {
            "atk": 0.6,
            "prob1": 0.1,
            "prob2": 0.3
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        }
      ],
      "tokens": [],
      "module": {
        "id": "uniequip_002_vigna",
        "name": "伟大的摇滚",
        "type": "CHG-Y",
        "level": 0,
        "active": false
      },
      "assets": {
        "avatar": "char_290_vigna",
        "portrait": "char_290_vigna_1",
        "spine": "char_290_vigna",
        "skillIcon": "skchr_vigna_2",
        "subProfIcon": "sub_charger_icon"
      },
      "skills": [
        {
          "skillId": "skchr_vigna_1",
          "iconId": "skcom_atk_up[2]",
          "name": "攻击力强化·β型",
          "level": 4,
          "desc": "攻击力+35%",
          "descRaw": "攻击力<@ba.vup>+35%</>",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 25,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 37,
          "initSp": 0,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 0.35
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_vigna_1",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 0,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_vigna_2",
          "iconId": "skchr_vigna_2",
          "name": "槌音",
          "level": 4,
          "desc": "攻击间隔略微增大，攻击力+120%",
          "descRaw": "攻击间隔<@ba.vdown>略微增大</>，攻击力<@ba.vup>+120%</>",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 22,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 32,
          "initSp": 0,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 1.2,
            "base_attack_time": 0.5
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_vigna_2",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 1,
          "overrideTokenKey": null,
          "isDefault": true
        }
      ],
      "growthKazdel": true
    },
    "chess_char_9_01_b": {
      "chessId": "chess_char_9_01_b",
      "baseId": "chess_char_9_01_a",
      "goldenId": "chess_char_9_01_b",
      "isGolden": true,
      "tier": 1,
      "identifier": 900,
      "isHidden": false,
      "isDiy": false,
      "visible": true,
      "chessType": "PRESET",
      "backup": {
        "charId": "char_290_vigna",
        "tmplId": null,
        "skillIndex": 1,
        "uniEquipId": "uniequip_002_vigna",
        "potRank": 0
      },
      "shopSortId": 900,
      "charId": "char_290_vigna",
      "name": "红豆",
      "appellation": "Vigna",
      "rarity": 4,
      "profession": "PIONEER",
      "subProfessionId": "charger",
      "subProfessionName": "冲锋手",
      "position": "MELEE",
      "nationId": "columbia",
      "bonds": [
        "kazdelShip",
        "indomShip"
      ],
      "garrisonIds": [
        "garrison_04_b"
      ],
      "price": 2,
      "sellPrice": 1,
      "upgradeNum": 0,
      "upgradeChessId": null,
      "status": {
        "phase": 2,
        "level": 50,
        "skillLevel": 7,
        "equipLevel": 1
      },
      "stats": {
        "maxHp": 1764,
        "atk": 596,
        "def": 332,
        "res": 0,
        "cost": 9,
        "blockCnt": 1,
        "bat": 1,
        "aspd": 100,
        "respawnTime": 66,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "immunities": {
        "stun": false,
        "silence": false,
        "sleep": false,
        "frozen": false,
        "levitate": false
      },
      "rangeId": "1-1",
      "rangeGrid": [
        [
          0,
          0
        ],
        [
          0,
          1
        ]
      ],
      "dmgType": "phys",
      "attackKind": "melee",
      "projectile": "none",
      "canHitFly": false,
      "targetPriority": null,
      "trait": {
        "desc": "击杀敌人后获得1点部署费用，撤退时返还初始部署费用",
        "descRaw": "击杀敌人后获得1点部署费用，撤退时返还初始部署费用",
        "bb": {
          "cost": 1,
          "hp_ratio": 0.4,
          "atk_scale": 1.15
        },
        "bbStr": {},
        "rangeGrid": null,
        "moduleDesc": "攻击生命值低于40%的敌人时攻击力提升至115%",
        "moduleDescRaw": "攻击生命值低于<@ba.vup>40%</>的敌人时攻击力提升至<@ba.vup>115%</>"
      },
      "skill": {
        "skillId": "skchr_vigna_2",
        "iconId": "skchr_vigna_2",
        "name": "槌音",
        "level": 7,
        "desc": "攻击间隔略微增大，攻击力+150%",
        "descRaw": "攻击间隔<@ba.vdown>略微增大</>，攻击力<@ba.vup>+150%</>",
        "skillType": "MANUAL",
        "durationType": "NONE",
        "duration": 25,
        "spType": "INCREASE_WITH_TIME",
        "spCost": 28,
        "initSp": 5,
        "maxChargeTime": 1,
        "increment": 1,
        "bb": {
          "atk": 1.5,
          "base_attack_time": 0.5
        },
        "bbStr": {},
        "rangeId": null,
        "rangeGrid": null,
        "prefabId": "skchr_vigna_2",
        "trigger": {
          "rule": "DEFAULT",
          "rawRule": "DEFAULT",
          "customRangeGrid": null
        },
        "index": 1,
        "overrideTokenKey": null
      },
      "talents": [
        {
          "index": 0,
          "name": "蛮力穿刺",
          "desc": "攻击时，10%几率当次攻击的攻击力+110%（+10%）。技能中这个几率提高到30%",
          "descRaw": "攻击时，10%几率当次攻击的攻击力+110%<@ba.talpu>（+10%）</>。技能中这个几率提高到30%",
          "bb": {
            "atk": 1.1,
            "prob1": 0.1,
            "prob2": 0.3
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": -1,
          "name": null,
          "desc": null,
          "descRaw": null,
          "bb": {
            "hp_ratio": 0.4,
            "atk_scale": 1.15
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": true,
          "fromModule": true
        }
      ],
      "tokens": [],
      "module": {
        "id": "uniequip_002_vigna",
        "name": "伟大的摇滚",
        "type": "CHG-Y",
        "level": 1,
        "active": true
      },
      "assets": {
        "avatar": "char_290_vigna_2",
        "portrait": "char_290_vigna_2",
        "spine": "char_290_vigna",
        "skillIcon": "skchr_vigna_2",
        "subProfIcon": "sub_charger_icon"
      },
      "skills": [
        {
          "skillId": "skchr_vigna_1",
          "iconId": "skcom_atk_up[2]",
          "name": "攻击力强化·β型",
          "level": 7,
          "desc": "攻击力+50%",
          "descRaw": "攻击力<@ba.vup>+50%</>",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 25,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 37,
          "initSp": 5,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 0.5
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_vigna_1",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 0,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_vigna_2",
          "iconId": "skchr_vigna_2",
          "name": "槌音",
          "level": 7,
          "desc": "攻击间隔略微增大，攻击力+150%",
          "descRaw": "攻击间隔<@ba.vdown>略微增大</>，攻击力<@ba.vup>+150%</>",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 25,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 28,
          "initSp": 5,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 1.5,
            "base_attack_time": 0.5
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_vigna_2",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 1,
          "overrideTokenKey": null,
          "isDefault": true
        }
      ],
      "statsBase": {
        "maxHp": 1684,
        "atk": 556,
        "def": 332,
        "res": 0,
        "cost": 9,
        "blockCnt": 1,
        "bat": 1,
        "aspd": 100,
        "respawnTime": 66,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "traitBase": {
        "desc": "击杀敌人后获得1点部署费用，撤退时返还初始部署费用",
        "descRaw": "击杀敌人后获得1点部署费用，撤退时返还初始部署费用",
        "bb": {
          "cost": 1
        },
        "bbStr": {},
        "rangeGrid": null
      },
      "talentsBase": [
        {
          "index": 0,
          "name": "蛮力穿刺",
          "desc": "攻击时，10%几率当次攻击的攻击力+110%（+10%）。技能中这个几率提高到30%",
          "descRaw": "攻击时，10%几率当次攻击的攻击力+110%<@ba.talpu>（+10%）</>。技能中这个几率提高到30%",
          "bb": {
            "atk": 1.1,
            "prob1": 0.1,
            "prob2": 0.3
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        }
      ],
      "modules": [
        {
          "uniEquipId": "uniequip_002_vigna",
          "name": "伟大的摇滚",
          "typeName": "CHG-Y",
          "typeIcon": "chg-y",
          "icon": "uniequip_002_vigna",
          "isDefault": true,
          "level": 1,
          "attr": {
            "maxHp": 80,
            "atk": 40
          },
          "traitOverride": {
            "desc": "击杀敌人后获得1点部署费用，撤退时返还初始部署费用",
            "descRaw": "击杀敌人后获得1点部署费用，撤退时返还初始部署费用",
            "bb": {
              "cost": 1,
              "hp_ratio": 0.4,
              "atk_scale": 1.15
            },
            "bbStr": {},
            "rangeGrid": null,
            "moduleDesc": "攻击生命值低于40%的敌人时攻击力提升至115%",
            "moduleDescRaw": "攻击生命值低于<@ba.vup>40%</>的敌人时攻击力提升至<@ba.vup>115%</>"
          },
          "talentChanges": [
            {
              "talentIndex": -1,
              "name": null,
              "desc": null,
              "descRaw": null,
              "bb": {
                "hp_ratio": 0.4,
                "atk_scale": 1.15
              },
              "bbStr": {},
              "rangeGrid": null,
              "tokenKey": null,
              "hidden": true
            }
          ]
        }
      ],
      "growthKazdel": true
    },
    "chess_char_9_02_a": {
      "chessId": "chess_char_9_02_a",
      "baseId": "chess_char_9_02_a",
      "goldenId": "chess_char_9_02_b",
      "isGolden": false,
      "tier": 2,
      "identifier": 901,
      "isHidden": false,
      "isDiy": false,
      "visible": true,
      "chessType": "PRESET",
      "backup": {
        "charId": "char_219_meteo",
        "tmplId": null,
        "skillIndex": 1,
        "uniEquipId": "uniequip_002_meteo",
        "potRank": 0
      },
      "shopSortId": 901,
      "charId": "char_219_meteo",
      "name": "陨星",
      "appellation": "Meteorite",
      "rarity": 5,
      "profession": "SNIPER",
      "subProfessionId": "aoesniper",
      "subProfessionName": "炮手",
      "position": "RANGED",
      "nationId": "rhodes",
      "bonds": [
        "kazdelShip",
        "preciShip"
      ],
      "garrisonIds": [
        "garrison_c_meteo_a"
      ],
      "price": 3,
      "sellPrice": 1,
      "upgradeNum": 3,
      "upgradeChessId": "chess_char_9_02_b",
      "status": {
        "phase": 1,
        "level": 60,
        "skillLevel": 4,
        "equipLevel": 0
      },
      "stats": {
        "maxHp": 1169,
        "atk": 689,
        "def": 95,
        "res": 0,
        "cost": 24,
        "blockCnt": 1,
        "bat": 2.8,
        "aspd": 100,
        "respawnTime": 60,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "immunities": {
        "stun": false,
        "silence": false,
        "sleep": false,
        "frozen": false,
        "levitate": false
      },
      "rangeId": "3-8",
      "rangeGrid": [
        [
          1,
          0
        ],
        [
          1,
          1
        ],
        [
          1,
          2
        ],
        [
          1,
          3
        ],
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          0,
          2
        ],
        [
          0,
          3
        ],
        [
          0,
          4
        ],
        [
          -1,
          0
        ],
        [
          -1,
          1
        ],
        [
          -1,
          2
        ],
        [
          -1,
          3
        ]
      ],
      "dmgType": "phys",
      "attackKind": "ranged",
      "projectile": "arrow",
      "canHitFly": true,
      "targetPriority": null,
      "trait": {
        "desc": "攻击造成群体物理伤害",
        "descRaw": "攻击造成<@ba.kw>群体物理伤害</>",
        "bb": {},
        "bbStr": {},
        "rangeGrid": null
      },
      "skill": {
        "skillId": "skchr_meteo_2",
        "iconId": "skchr_meteo_2",
        "name": "高爆弹头",
        "level": 4,
        "desc": "立即发射一枚火焰弹，对目标范围内所有敌人造成相当于攻击力210%的物理伤害，所有命中目标在10秒内防御力-170",
        "descRaw": "立即发射一枚火焰弹，对目标范围内所有敌人造成相当于攻击力<@ba.vup>210%</>的物理伤害，所有命中目标在<@ba.vup>10</>秒内防御力<@ba.vup>-170</>",
        "skillType": "MANUAL",
        "durationType": "NONE",
        "duration": -1,
        "spType": "INCREASE_WITH_TIME",
        "spCost": 24,
        "initSp": 0,
        "maxChargeTime": 1,
        "increment": 1,
        "bb": {
          "atk_scale": 2.1,
          "def": -170,
          "duration": 10
        },
        "bbStr": {},
        "rangeId": null,
        "rangeGrid": null,
        "prefabId": "skchr_meteo_2",
        "trigger": {
          "rule": "DEFAULT",
          "rawRule": "DEFAULT",
          "customRangeGrid": null
        },
        "index": 1,
        "overrideTokenKey": null
      },
      "talents": [
        {
          "index": 0,
          "name": "爆破附着改装",
          "desc": "普通攻击和技能释放时，15%几率当次攻击的攻击力+60%",
          "descRaw": "普通攻击和技能释放时，15%几率当次攻击的攻击力+60%",
          "bb": {
            "atk": 0.6,
            "prob": 0.15
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        }
      ],
      "tokens": [],
      "module": {
        "id": "uniequip_002_meteo",
        "name": "无名的身份牌",
        "type": "ART-Y",
        "level": 0,
        "active": false
      },
      "assets": {
        "avatar": "char_219_meteo",
        "portrait": "char_219_meteo_1",
        "spine": "char_219_meteo",
        "skillIcon": "skchr_meteo_2",
        "subProfIcon": "sub_aoesniper_icon"
      },
      "skills": [
        {
          "skillId": "skchr_meteo_1",
          "iconId": "skchr_meteo_1",
          "name": "霰射弹头",
          "level": 4,
          "desc": "下次攻击的爆炸范围扩大，造成相当于攻击力150%的物理伤害",
          "descRaw": "下次攻击的爆炸范围<@ba.vup>扩大</>，造成相当于攻击力<@ba.vup>150%</>的物理伤害",
          "skillType": "AUTO",
          "durationType": "NONE",
          "duration": 0,
          "spType": "INCREASE_WHEN_ATTACK",
          "spCost": 4,
          "initSp": 0,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk_scale": 1.5
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_meteo_1",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 0,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_meteo_2",
          "iconId": "skchr_meteo_2",
          "name": "高爆弹头",
          "level": 4,
          "desc": "立即发射一枚火焰弹，对目标范围内所有敌人造成相当于攻击力210%的物理伤害，所有命中目标在10秒内防御力-170",
          "descRaw": "立即发射一枚火焰弹，对目标范围内所有敌人造成相当于攻击力<@ba.vup>210%</>的物理伤害，所有命中目标在<@ba.vup>10</>秒内防御力<@ba.vup>-170</>",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": -1,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 24,
          "initSp": 0,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk_scale": 2.1,
            "def": -170,
            "duration": 10
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_meteo_2",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 1,
          "overrideTokenKey": null,
          "isDefault": true
        }
      ],
      "growthKazdel": true
    },
    "chess_char_9_02_b": {
      "chessId": "chess_char_9_02_b",
      "baseId": "chess_char_9_02_a",
      "goldenId": "chess_char_9_02_b",
      "isGolden": true,
      "tier": 2,
      "identifier": 901,
      "isHidden": false,
      "isDiy": false,
      "visible": true,
      "chessType": "PRESET",
      "backup": {
        "charId": "char_219_meteo",
        "tmplId": null,
        "skillIndex": 1,
        "uniEquipId": "uniequip_002_meteo",
        "potRank": 0
      },
      "shopSortId": 901,
      "charId": "char_219_meteo",
      "name": "陨星",
      "appellation": "Meteorite",
      "rarity": 5,
      "profession": "SNIPER",
      "subProfessionId": "aoesniper",
      "subProfessionName": "炮手",
      "position": "RANGED",
      "nationId": "rhodes",
      "bonds": [
        "kazdelShip",
        "preciShip"
      ],
      "garrisonIds": [
        "garrison_c_meteo_b"
      ],
      "price": 3,
      "sellPrice": 1,
      "upgradeNum": 0,
      "upgradeChessId": null,
      "status": {
        "phase": 2,
        "level": 55,
        "skillLevel": 7,
        "equipLevel": 1
      },
      "stats": {
        "maxHp": 1510,
        "atk": 877,
        "def": 110,
        "res": 0,
        "cost": 26,
        "blockCnt": 1,
        "bat": 2.8,
        "aspd": 100,
        "respawnTime": 60,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "immunities": {
        "stun": false,
        "silence": false,
        "sleep": false,
        "frozen": false,
        "levitate": false
      },
      "rangeId": "3-10",
      "rangeGrid": [
        [
          1,
          0
        ],
        [
          1,
          1
        ],
        [
          1,
          2
        ],
        [
          1,
          3
        ],
        [
          1,
          4
        ],
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          0,
          2
        ],
        [
          0,
          3
        ],
        [
          0,
          4
        ],
        [
          -1,
          0
        ],
        [
          -1,
          1
        ],
        [
          -1,
          2
        ],
        [
          -1,
          3
        ],
        [
          -1,
          4
        ]
      ],
      "dmgType": "phys",
      "attackKind": "ranged",
      "projectile": "arrow",
      "canHitFly": true,
      "targetPriority": null,
      "trait": {
        "desc": "攻击造成群体物理伤害",
        "descRaw": "攻击造成<@ba.kw>群体物理伤害</>",
        "bb": {
          "def_penetrate_fixed": 100
        },
        "bbStr": {},
        "rangeGrid": null,
        "moduleDesc": "攻击时无视敌人100点的防御力",
        "moduleDescRaw": "攻击时无视敌人<@ba.vup>100</>点的防御力"
      },
      "skill": {
        "skillId": "skchr_meteo_2",
        "iconId": "skchr_meteo_2",
        "name": "高爆弹头",
        "level": 7,
        "desc": "立即发射一枚火焰弹，对目标范围内所有敌人造成相当于攻击力240%的物理伤害，所有命中目标在10秒内防御力-210",
        "descRaw": "立即发射一枚火焰弹，对目标范围内所有敌人造成相当于攻击力<@ba.vup>240%</>的物理伤害，所有命中目标在<@ba.vup>10</>秒内防御力<@ba.vup>-210</>",
        "skillType": "MANUAL",
        "durationType": "NONE",
        "duration": -1,
        "spType": "INCREASE_WITH_TIME",
        "spCost": 23,
        "initSp": 0,
        "maxChargeTime": 1,
        "increment": 1,
        "bb": {
          "atk_scale": 2.4,
          "def": -210,
          "duration": 10
        },
        "bbStr": {},
        "rangeId": null,
        "rangeGrid": null,
        "prefabId": "skchr_meteo_2",
        "trigger": {
          "rule": "DEFAULT",
          "rawRule": "DEFAULT",
          "customRangeGrid": null
        },
        "index": 1,
        "overrideTokenKey": null
      },
      "talents": [
        {
          "index": 0,
          "name": "爆破附着改装",
          "desc": "普通攻击和技能释放时，30%几率当次攻击的攻击力+60%",
          "descRaw": "普通攻击和技能释放时，30%几率当次攻击的攻击力+60%",
          "bb": {
            "atk": 0.6,
            "prob": 0.3
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        }
      ],
      "tokens": [],
      "module": {
        "id": "uniequip_002_meteo",
        "name": "无名的身份牌",
        "type": "ART-Y",
        "level": 1,
        "active": true
      },
      "assets": {
        "avatar": "char_219_meteo_2",
        "portrait": "char_219_meteo_2",
        "spine": "char_219_meteo",
        "skillIcon": "skchr_meteo_2",
        "subProfIcon": "sub_aoesniper_icon"
      },
      "skills": [
        {
          "skillId": "skchr_meteo_1",
          "iconId": "skchr_meteo_1",
          "name": "霰射弹头",
          "level": 7,
          "desc": "下次攻击的爆炸范围扩大，造成相当于攻击力170%的物理伤害",
          "descRaw": "下次攻击的爆炸范围<@ba.vup>扩大</>，造成相当于攻击力<@ba.vup>170%</>的物理伤害",
          "skillType": "AUTO",
          "durationType": "NONE",
          "duration": 0,
          "spType": "INCREASE_WHEN_ATTACK",
          "spCost": 4,
          "initSp": 0,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk_scale": 1.7
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_meteo_1",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 0,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_meteo_2",
          "iconId": "skchr_meteo_2",
          "name": "高爆弹头",
          "level": 7,
          "desc": "立即发射一枚火焰弹，对目标范围内所有敌人造成相当于攻击力240%的物理伤害，所有命中目标在10秒内防御力-210",
          "descRaw": "立即发射一枚火焰弹，对目标范围内所有敌人造成相当于攻击力<@ba.vup>240%</>的物理伤害，所有命中目标在<@ba.vup>10</>秒内防御力<@ba.vup>-210</>",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": -1,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 23,
          "initSp": 0,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk_scale": 2.4,
            "def": -210,
            "duration": 10
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_meteo_2",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 1,
          "overrideTokenKey": null,
          "isDefault": true
        }
      ],
      "statsBase": {
        "maxHp": 1410,
        "atk": 840,
        "def": 110,
        "res": 0,
        "cost": 26,
        "blockCnt": 1,
        "bat": 2.8,
        "aspd": 100,
        "respawnTime": 60,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "traitBase": {
        "desc": "攻击造成群体物理伤害",
        "descRaw": "攻击造成<@ba.kw>群体物理伤害</>",
        "bb": {},
        "bbStr": {},
        "rangeGrid": null
      },
      "talentsBase": [
        {
          "index": 0,
          "name": "爆破附着改装",
          "desc": "普通攻击和技能释放时，30%几率当次攻击的攻击力+60%",
          "descRaw": "普通攻击和技能释放时，30%几率当次攻击的攻击力+60%",
          "bb": {
            "atk": 0.6,
            "prob": 0.3
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        }
      ],
      "modules": [
        {
          "uniEquipId": "uniequip_002_meteo",
          "name": "无名的身份牌",
          "typeName": "ART-Y",
          "typeIcon": "art-y",
          "icon": "uniequip_002_meteo",
          "isDefault": true,
          "level": 1,
          "attr": {
            "maxHp": 100,
            "atk": 37
          },
          "traitOverride": {
            "desc": "攻击造成群体物理伤害",
            "descRaw": "攻击造成<@ba.kw>群体物理伤害</>",
            "bb": {
              "def_penetrate_fixed": 100
            },
            "bbStr": {},
            "rangeGrid": null,
            "moduleDesc": "攻击时无视敌人100点的防御力",
            "moduleDescRaw": "攻击时无视敌人<@ba.vup>100</>点的防御力"
          },
          "talentChanges": []
        }
      ],
      "growthKazdel": true
    },
    "chess_char_9_04_a": {
      "chessId": "chess_char_9_04_a",
      "baseId": "chess_char_9_04_a",
      "goldenId": "chess_char_9_04_b",
      "isGolden": false,
      "tier": 3,
      "identifier": 903,
      "isHidden": false,
      "isDiy": false,
      "visible": true,
      "chessType": "NORMAL",
      "backup": {
        "charId": "char_605_cmedic",
        "tmplId": null,
        "skillIndex": 2,
        "uniEquipId": null,
        "potRank": 0
      },
      "shopSortId": 903,
      "charId": "char_147_shining",
      "name": "闪灵",
      "appellation": "Shining",
      "rarity": 6,
      "profession": "MEDIC",
      "subProfessionId": "physician",
      "subProfessionName": "医师",
      "position": "RANGED",
      "nationId": null,
      "bonds": [
        "kazdelShip",
        "deputShip"
      ],
      "garrisonIds": [
        "garrison_c_shining_a"
      ],
      "price": 3,
      "sellPrice": 1,
      "upgradeNum": 3,
      "upgradeChessId": "chess_char_9_04_b",
      "status": {
        "phase": 2,
        "level": 1,
        "skillLevel": 4,
        "equipLevel": 0
      },
      "stats": {
        "maxHp": 1451,
        "atk": 424,
        "def": 135,
        "res": 0,
        "cost": 18,
        "blockCnt": 1,
        "bat": 2.85,
        "aspd": 100,
        "respawnTime": 70,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "immunities": {
        "stun": false,
        "silence": false,
        "sleep": false,
        "frozen": false,
        "levitate": false
      },
      "rangeId": "3-3",
      "rangeGrid": [
        [
          1,
          0
        ],
        [
          1,
          1
        ],
        [
          1,
          2
        ],
        [
          1,
          3
        ],
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          0,
          2
        ],
        [
          0,
          3
        ],
        [
          -1,
          0
        ],
        [
          -1,
          1
        ],
        [
          -1,
          2
        ],
        [
          -1,
          3
        ]
      ],
      "dmgType": "heal",
      "attackKind": "heal",
      "projectile": "orb",
      "canHitFly": false,
      "targetPriority": null,
      "trait": {
        "desc": "恢复友方单位生命",
        "descRaw": "恢复友方单位生命",
        "bb": {},
        "bbStr": {},
        "rangeGrid": null
      },
      "skill": {
        "skillId": "skchr_shining_3",
        "iconId": "skchr_shining_3",
        "name": "教条力场",
        "level": 4,
        "desc": "攻击力+30%\n攻击范围内的所有友方单位防御力+45%",
        "descRaw": "攻击力<@ba.vup>+30%</>\n攻击范围内的所有友方单位防御力<@ba.vup>+45%</>",
        "skillType": "MANUAL",
        "durationType": "NONE",
        "duration": 60,
        "spType": "INCREASE_WITH_TIME",
        "spCost": 120,
        "initSp": 100,
        "maxChargeTime": 1,
        "increment": 1,
        "bb": {
          "def": 0.45,
          "atk": 0.3
        },
        "bbStr": {},
        "rangeId": null,
        "rangeGrid": null,
        "prefabId": "skchr_shining_3",
        "trigger": {
          "rule": "DEFAULT",
          "rawRule": "DEFAULT",
          "customRangeGrid": null
        },
        "index": 2,
        "overrideTokenKey": null
      },
      "talents": [
        {
          "index": 0,
          "name": "黑恶魔的庇护",
          "desc": "攻击范围内的友方单位防御力+65（+5）",
          "descRaw": "攻击范围内的友方单位防御力+65<@ba.talpu>（+5）</>",
          "bb": {
            "def": 65
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": 1,
          "name": "法典",
          "desc": "攻击速度+13（+3）",
          "descRaw": "攻击速度+13<@ba.talpu>（+3）</>",
          "bb": {
            "attack_speed": 13
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        }
      ],
      "tokens": [],
      "module": {
        "id": "uniequip_002_shining",
        "name": "干枯剑鞘",
        "type": "PHY-Y",
        "level": 0,
        "active": false
      },
      "assets": {
        "avatar": "char_147_shining",
        "portrait": "char_147_shining_1",
        "spine": "char_147_shining",
        "skillIcon": "skchr_shining_3",
        "subProfIcon": "sub_physician_icon"
      },
      "skills": [
        {
          "skillId": "skchr_shining_1",
          "iconId": "skchr_shining_1",
          "name": "信条",
          "level": 4,
          "desc": "攻击力+58%，攻击速度+10",
          "descRaw": "攻击力<@ba.vup>+58%</>，攻击速度<@ba.vup>+10</>",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 20,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 47,
          "initSp": 10,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 0.58,
            "attack_speed": 10
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_shining_1",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 0,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_shining_2",
          "iconId": "skchr_shining_2",
          "name": "自动掩护",
          "level": 4,
          "desc": "下次治疗使目标获得一个持续2秒的屏障\n屏障可以吸收相当于闪灵攻击力28%的伤害，同时使目标防御力+25%；可充能1次",
          "descRaw": "下次治疗使目标获得一个持续<@ba.vup>2</>秒的<$ba.barrier>屏障</>\n屏障可以吸收相当于闪灵攻击力<@ba.vup>28%</>的伤害，同时使目标防御力<@ba.vup>+25%</>；<@ba.rem>可充能1次</>",
          "skillType": "AUTO",
          "durationType": "NONE",
          "duration": -1,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 7,
          "initSp": 0,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "def": 0.25,
            "atk_scale": 0.28,
            "duration": 2,
            "ct": 1
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_shining_2",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 1,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_shining_3",
          "iconId": "skchr_shining_3",
          "name": "教条力场",
          "level": 4,
          "desc": "攻击力+30%\n攻击范围内的所有友方单位防御力+45%",
          "descRaw": "攻击力<@ba.vup>+30%</>\n攻击范围内的所有友方单位防御力<@ba.vup>+45%</>",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 60,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 120,
          "initSp": 100,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "def": 0.45,
            "atk": 0.3
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_shining_3",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 2,
          "overrideTokenKey": null,
          "isDefault": true
        }
      ],
      "growthKazdel": true
    },
    "chess_char_9_04_b": {
      "chessId": "chess_char_9_04_b",
      "baseId": "chess_char_9_04_a",
      "goldenId": "chess_char_9_04_b",
      "isGolden": true,
      "tier": 3,
      "identifier": 903,
      "isHidden": false,
      "isDiy": false,
      "visible": true,
      "chessType": "NORMAL",
      "backup": {
        "charId": "char_605_cmedic",
        "tmplId": null,
        "skillIndex": 2,
        "uniEquipId": null,
        "potRank": 0
      },
      "shopSortId": 903,
      "charId": "char_147_shining",
      "name": "闪灵",
      "appellation": "Shining",
      "rarity": 6,
      "profession": "MEDIC",
      "subProfessionId": "physician",
      "subProfessionName": "医师",
      "position": "RANGED",
      "nationId": null,
      "bonds": [
        "kazdelShip",
        "deputShip"
      ],
      "garrisonIds": [
        "garrison_c_shining_b"
      ],
      "price": 3,
      "sellPrice": 1,
      "upgradeNum": 0,
      "upgradeChessId": null,
      "status": {
        "phase": 2,
        "level": 60,
        "skillLevel": 7,
        "equipLevel": 1
      },
      "stats": {
        "maxHp": 1558,
        "atk": 529,
        "def": 154,
        "res": 0,
        "cost": 18,
        "blockCnt": 1,
        "bat": 2.85,
        "aspd": 105,
        "respawnTime": 70,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "immunities": {
        "stun": false,
        "silence": false,
        "sleep": false,
        "frozen": false,
        "levitate": false
      },
      "rangeId": "3-3",
      "rangeGrid": [
        [
          1,
          0
        ],
        [
          1,
          1
        ],
        [
          1,
          2
        ],
        [
          1,
          3
        ],
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          0,
          2
        ],
        [
          0,
          3
        ],
        [
          -1,
          0
        ],
        [
          -1,
          1
        ],
        [
          -1,
          2
        ],
        [
          -1,
          3
        ]
      ],
      "dmgType": "heal",
      "attackKind": "heal",
      "projectile": "orb",
      "canHitFly": false,
      "targetPriority": null,
      "trait": {
        "desc": "恢复友方单位生命",
        "descRaw": "恢复友方单位生命",
        "bb": {
          "heal_scale": 1.15
        },
        "bbStr": {},
        "rangeGrid": null,
        "moduleDesc": "治疗地面单位时治疗量提升15%",
        "moduleDescRaw": "治疗地面单位时治疗量提升<@ba.kw>15%</>"
      },
      "skill": {
        "skillId": "skchr_shining_3",
        "iconId": "skchr_shining_3",
        "name": "教条力场",
        "level": 7,
        "desc": "攻击力+40%\n攻击范围内的所有友方单位防御力+60%",
        "descRaw": "攻击力<@ba.vup>+40%</>\n攻击范围内的所有友方单位防御力<@ba.vup>+60%</>",
        "skillType": "MANUAL",
        "durationType": "NONE",
        "duration": 60,
        "spType": "INCREASE_WITH_TIME",
        "spCost": 120,
        "initSp": 100,
        "maxChargeTime": 1,
        "increment": 1,
        "bb": {
          "def": 0.6,
          "atk": 0.4
        },
        "bbStr": {},
        "rangeId": null,
        "rangeGrid": null,
        "prefabId": "skchr_shining_3",
        "trigger": {
          "rule": "DEFAULT",
          "rawRule": "DEFAULT",
          "customRangeGrid": null
        },
        "index": 2,
        "overrideTokenKey": null
      },
      "talents": [
        {
          "index": 0,
          "name": "黑恶魔的庇护",
          "desc": "攻击范围内的友方单位防御力+65（+5）",
          "descRaw": "攻击范围内的友方单位防御力+65<@ba.talpu>（+5）</>",
          "bb": {
            "def": 65
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": 1,
          "name": "法典",
          "desc": "攻击速度+13（+3）",
          "descRaw": "攻击速度+13<@ba.talpu>（+3）</>",
          "bb": {
            "attack_speed": 13
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        }
      ],
      "tokens": [],
      "module": {
        "id": "uniequip_002_shining",
        "name": "干枯剑鞘",
        "type": "PHY-Y",
        "level": 1,
        "active": true
      },
      "assets": {
        "avatar": "char_147_shining_2",
        "portrait": "char_147_shining_2",
        "spine": "char_147_shining",
        "skillIcon": "skchr_shining_3",
        "subProfIcon": "sub_physician_icon"
      },
      "skills": [
        {
          "skillId": "skchr_shining_1",
          "iconId": "skchr_shining_1",
          "name": "信条",
          "level": 7,
          "desc": "攻击力+67%，攻击速度+20",
          "descRaw": "攻击力<@ba.vup>+67%</>，攻击速度<@ba.vup>+20</>",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 20,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 44,
          "initSp": 14,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 0.67,
            "attack_speed": 20
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_shining_1",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 0,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_shining_2",
          "iconId": "skchr_shining_2",
          "name": "自动掩护",
          "level": 7,
          "desc": "下次治疗使目标获得一个持续3秒的屏障\n屏障可以吸收相当于闪灵攻击力35%的伤害，同时使目标防御力+35%；可充能2次",
          "descRaw": "下次治疗使目标获得一个持续<@ba.vup>3</>秒的<$ba.barrier>屏障</>\n屏障可以吸收相当于闪灵攻击力<@ba.vup>35%</>的伤害，同时使目标防御力<@ba.vup>+35%</>；<@ba.rem>可充能2次</>",
          "skillType": "AUTO",
          "durationType": "NONE",
          "duration": -1,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 7,
          "initSp": 0,
          "maxChargeTime": 2,
          "increment": 1,
          "bb": {
            "def": 0.35,
            "atk_scale": 0.35,
            "duration": 3,
            "ct": 2
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_shining_2",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 1,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_shining_3",
          "iconId": "skchr_shining_3",
          "name": "教条力场",
          "level": 7,
          "desc": "攻击力+40%\n攻击范围内的所有友方单位防御力+60%",
          "descRaw": "攻击力<@ba.vup>+40%</>\n攻击范围内的所有友方单位防御力<@ba.vup>+60%</>",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 60,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 120,
          "initSp": 100,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "def": 0.6,
            "atk": 0.4
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_shining_3",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 2,
          "overrideTokenKey": null,
          "isDefault": true
        }
      ],
      "statsBase": {
        "maxHp": 1558,
        "atk": 494,
        "def": 154,
        "res": 0,
        "cost": 18,
        "blockCnt": 1,
        "bat": 2.85,
        "aspd": 100,
        "respawnTime": 70,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "traitBase": {
        "desc": "恢复友方单位生命",
        "descRaw": "恢复友方单位生命",
        "bb": {},
        "bbStr": {},
        "rangeGrid": null
      },
      "talentsBase": [
        {
          "index": 0,
          "name": "黑恶魔的庇护",
          "desc": "攻击范围内的友方单位防御力+65（+5）",
          "descRaw": "攻击范围内的友方单位防御力+65<@ba.talpu>（+5）</>",
          "bb": {
            "def": 65
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": 1,
          "name": "法典",
          "desc": "攻击速度+13（+3）",
          "descRaw": "攻击速度+13<@ba.talpu>（+3）</>",
          "bb": {
            "attack_speed": 13
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        }
      ],
      "modules": [
        {
          "uniEquipId": "uniequip_002_shining",
          "name": "干枯剑鞘",
          "typeName": "PHY-Y",
          "typeIcon": "phy-y",
          "icon": "uniequip_002_shining",
          "isDefault": true,
          "level": 1,
          "attr": {
            "atk": 35,
            "aspd": 5
          },
          "traitOverride": {
            "desc": "恢复友方单位生命",
            "descRaw": "恢复友方单位生命",
            "bb": {
              "heal_scale": 1.15
            },
            "bbStr": {},
            "rangeGrid": null,
            "moduleDesc": "治疗地面单位时治疗量提升15%",
            "moduleDescRaw": "治疗地面单位时治疗量提升<@ba.kw>15%</>"
          },
          "talentChanges": []
        },
        {
          "uniEquipId": "uniequip_003_shining",
          "name": "“使徒”",
          "typeName": "PHY-X",
          "typeIcon": "phy-x",
          "icon": "uniequip_003_shining",
          "isDefault": false,
          "level": 1,
          "attr": {
            "atk": 45,
            "def": 13
          },
          "traitOverride": {
            "desc": "恢复友方单位生命",
            "descRaw": "恢复友方单位生命",
            "bb": {
              "heal_scale": 1.15,
              "hp_ratio": 0.5
            },
            "bbStr": {},
            "rangeGrid": null,
            "moduleDesc": "治疗生命值低于50%的友方单位时治疗量提升15%",
            "moduleDescRaw": "治疗生命值低于50%的友方单位时治疗量提升<@ba.kw>15%</>"
          },
          "talentChanges": []
        }
      ],
      "growthKazdel": true
    },
    "chess_char_9_06_a": {
      "chessId": "chess_char_9_06_a",
      "baseId": "chess_char_9_06_a",
      "goldenId": "chess_char_9_06_b",
      "isGolden": false,
      "tier": 4,
      "identifier": 905,
      "isHidden": false,
      "isDiy": false,
      "visible": true,
      "chessType": "NORMAL",
      "backup": {
        "charId": "char_601_cguard",
        "tmplId": null,
        "skillIndex": 2,
        "uniEquipId": null,
        "potRank": 0
      },
      "shopSortId": 905,
      "charId": "char_4088_hodrer",
      "name": "赫德雷",
      "appellation": "Hoederer",
      "rarity": 6,
      "profession": "WARRIOR",
      "subProfessionId": "crusher",
      "subProfessionName": "重剑手",
      "position": "MELEE",
      "nationId": null,
      "bonds": [
        "kazdelShip",
        "indomShip"
      ],
      "garrisonIds": [
        "garrison_c_hodrer_a"
      ],
      "price": 3,
      "sellPrice": 1,
      "upgradeNum": 3,
      "upgradeChessId": "chess_char_9_06_b",
      "status": {
        "phase": 2,
        "level": 1,
        "skillLevel": 4,
        "equipLevel": 0
      },
      "stats": {
        "maxHp": 4920,
        "atk": 1368,
        "def": 0,
        "res": 0,
        "cost": 22,
        "blockCnt": 2,
        "bat": 2.5,
        "aspd": 100,
        "respawnTime": 70,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "immunities": {
        "stun": false,
        "silence": false,
        "sleep": false,
        "frozen": false,
        "levitate": false
      },
      "rangeId": "1-1",
      "rangeGrid": [
        [
          0,
          0
        ],
        [
          0,
          1
        ]
      ],
      "dmgType": "phys",
      "attackKind": "melee",
      "projectile": "none",
      "canHitFly": false,
      "targetPriority": null,
      "trait": {
        "desc": "同时攻击阻挡的所有敌人",
        "descRaw": "同时攻击阻挡的<@ba.kw>所有敌人</>",
        "bb": {},
        "bbStr": {},
        "rangeGrid": null
      },
      "skill": {
        "skillId": "skchr_hodrer_3",
        "iconId": "skchr_hodrer_3",
        "name": "死境硝烟",
        "level": 4,
        "desc": "每秒流失100点生命，并使自身攻击过和攻击过自身的敌人每秒受到200点真实伤害；攻击距离+1，生命上限+30%，攻击力+60%，每次攻击回复自身5%的生命且有25%概率使目标晕眩3秒",
        "descRaw": "每秒流失<@ba.vdown>100</>点生命，并使自身攻击过和攻击过自身的敌人每秒受到<@ba.vup>200</>点真实伤害；攻击距离<@ba.vup>+1</>，生命上限<@ba.vup>+30%</>，攻击力<@ba.vup>+60%</>，每次攻击回复自身<@ba.vup>5%</>的生命且有<@ba.vup>25%</>概率使目标<$ba.stun>晕眩</><@ba.vup>3</>秒",
        "skillType": "MANUAL",
        "durationType": "NONE",
        "duration": 70,
        "spType": "INCREASE_WITH_TIME",
        "spCost": 70,
        "initSp": 40,
        "maxChargeTime": 1,
        "increment": 1,
        "bb": {
          "max_hp": 0.3,
          "atk": 0.6,
          "attack@hp_ratio": 0.05,
          "attack@buff_prob": 0.25,
          "attack@stun": 3,
          "ability_range_forward_extend": 1,
          "attack@value": 100,
          "attack@damage": 200
        },
        "bbStr": {},
        "rangeId": null,
        "rangeGrid": null,
        "prefabId": "skchr_hodrer_3",
        "trigger": {
          "rule": "ACTIVE_RANGE",
          "rawRule": "DEFAULT",
          "customRangeGrid": [
            [
              0,
              0
            ],
            [
              0,
              1
            ],
            [
              0,
              2
            ]
          ]
        },
        "index": 2,
        "overrideTokenKey": null
      },
      "talents": [
        {
          "index": 0,
          "name": "及锋而试",
          "desc": "攻击敌人时攻击力提升至110%，若目标处于晕眩、束缚则改为提升至140%",
          "descRaw": "攻击敌人时攻击力提升至110%，若目标处于<$ba.stun>晕眩</>、<$ba.root>束缚</>则改为提升至140%",
          "bb": {
            "atk_scale": 1.4,
            "atk_scale_2": 1.1
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": 1,
          "name": "余火之氅",
          "desc": "使自身与身后一格的友军获得21%（+3%）的庇护",
          "descRaw": "使自身与身后一格的友军获得21%<@ba.talpu>（+3%）</>的<$ba.protect>庇护</>",
          "bb": {
            "damage_resistance": 0.21
          },
          "bbStr": {},
          "rangeGrid": [
            [
              0,
              -1
            ],
            [
              0,
              0
            ]
          ],
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        }
      ],
      "tokens": [],
      "module": {
        "id": "uniequip_002_hodrer",
        "name": "新的生活",
        "type": "CRU-X",
        "level": 0,
        "active": false
      },
      "assets": {
        "avatar": "char_4088_hodrer",
        "portrait": "char_4088_hodrer_1",
        "spine": "char_4088_hodrer",
        "skillIcon": "skchr_hodrer_3",
        "subProfIcon": "sub_crusher_icon"
      },
      "skills": [
        {
          "skillId": "skchr_hodrer_1",
          "iconId": "skchr_hodrer_1",
          "name": "重锋不熄",
          "level": 4,
          "desc": "下次攻击造成相当于攻击力180%的物理伤害，并回复自身15%的生命",
          "descRaw": "下次攻击造成相当于攻击力<@ba.vup>180%</>的物理伤害，并回复自身<@ba.vup>15%</>的生命",
          "skillType": "AUTO",
          "durationType": "NONE",
          "duration": -1,
          "spType": "INCREASE_WHEN_ATTACK",
          "spCost": 3,
          "initSp": 0,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk_scale": 1.8,
            "hp_ratio": 0.15
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_hodrer_1",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 0,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_hodrer_2",
          "iconId": "skchr_hodrer_2",
          "name": "余烬重荷",
          "level": 4,
          "desc": "被动效果：攻击力+16%\n主动触发可以在下列状态和初始状态间切换：\n攻击间隔略微增大，阻挡数+1，攻击使目标晕眩1秒",
          "descRaw": "被动效果：攻击力<@ba.vup>+16%</>\n<@ba.rem>主动触发可以在下列状态和初始状态间切换：</>\n攻击间隔<@ba.vdown>略微增大</>，阻挡数<@ba.vup>+1</>，攻击使目标<$ba.stun>晕眩</><@ba.vup>1</>秒",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": -1,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 9,
          "initSp": 0,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 0.16,
            "base_attack_time": 0.5,
            "block_cnt": 1,
            "attack@stun": 1
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_hodrer_2",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 1,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_hodrer_3",
          "iconId": "skchr_hodrer_3",
          "name": "死境硝烟",
          "level": 4,
          "desc": "每秒流失100点生命，并使自身攻击过和攻击过自身的敌人每秒受到200点真实伤害；攻击距离+1，生命上限+30%，攻击力+60%，每次攻击回复自身5%的生命且有25%概率使目标晕眩3秒",
          "descRaw": "每秒流失<@ba.vdown>100</>点生命，并使自身攻击过和攻击过自身的敌人每秒受到<@ba.vup>200</>点真实伤害；攻击距离<@ba.vup>+1</>，生命上限<@ba.vup>+30%</>，攻击力<@ba.vup>+60%</>，每次攻击回复自身<@ba.vup>5%</>的生命且有<@ba.vup>25%</>概率使目标<$ba.stun>晕眩</><@ba.vup>3</>秒",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 70,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 70,
          "initSp": 40,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "max_hp": 0.3,
            "atk": 0.6,
            "attack@hp_ratio": 0.05,
            "attack@buff_prob": 0.25,
            "attack@stun": 3,
            "ability_range_forward_extend": 1,
            "attack@value": 100,
            "attack@damage": 200
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_hodrer_3",
          "trigger": {
            "rule": "ACTIVE_RANGE",
            "rawRule": "DEFAULT",
            "customRangeGrid": [
              [
                0,
                0
              ],
              [
                0,
                1
              ],
              [
                0,
                2
              ]
            ]
          },
          "index": 2,
          "overrideTokenKey": null,
          "isDefault": true
        }
      ],
      "growthKazdel": true
    },
    "chess_char_9_06_b": {
      "chessId": "chess_char_9_06_b",
      "baseId": "chess_char_9_06_a",
      "goldenId": "chess_char_9_06_b",
      "isGolden": true,
      "tier": 4,
      "identifier": 905,
      "isHidden": false,
      "isDiy": false,
      "visible": true,
      "chessType": "NORMAL",
      "backup": {
        "charId": "char_601_cguard",
        "tmplId": null,
        "skillIndex": 2,
        "uniEquipId": null,
        "potRank": 0
      },
      "shopSortId": 905,
      "charId": "char_4088_hodrer",
      "name": "赫德雷",
      "appellation": "Hoederer",
      "rarity": 6,
      "profession": "WARRIOR",
      "subProfessionId": "crusher",
      "subProfessionName": "重剑手",
      "position": "MELEE",
      "nationId": null,
      "bonds": [
        "kazdelShip",
        "indomShip"
      ],
      "garrisonIds": [
        "garrison_c_hodrer_b"
      ],
      "price": 3,
      "sellPrice": 1,
      "upgradeNum": 0,
      "upgradeChessId": null,
      "status": {
        "phase": 2,
        "level": 60,
        "skillLevel": 7,
        "equipLevel": 1
      },
      "stats": {
        "maxHp": 6084,
        "atk": 1628,
        "def": 0,
        "res": 0,
        "cost": 22,
        "blockCnt": 2,
        "bat": 2.5,
        "aspd": 100,
        "respawnTime": 70,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "immunities": {
        "stun": false,
        "silence": false,
        "sleep": false,
        "frozen": false,
        "levitate": false
      },
      "rangeId": "1-1",
      "rangeGrid": [
        [
          0,
          0
        ],
        [
          0,
          1
        ]
      ],
      "dmgType": "phys",
      "attackKind": "melee",
      "projectile": "none",
      "canHitFly": false,
      "targetPriority": null,
      "trait": {
        "desc": "同时攻击阻挡的所有敌人",
        "descRaw": "同时攻击阻挡的<@ba.kw>所有敌人</>",
        "bb": {
          "heal_scale": 1.2
        },
        "bbStr": {},
        "rangeGrid": null,
        "moduleDesc": "受到的治疗效果提升20%",
        "moduleDescRaw": "受到的治疗效果提升<@ba.kw>20%</>"
      },
      "skill": {
        "skillId": "skchr_hodrer_3",
        "iconId": "skchr_hodrer_3",
        "name": "死境硝烟",
        "level": 7,
        "desc": "每秒流失100点生命，并使自身攻击过和攻击过自身的敌人每秒受到200点真实伤害；攻击距离+1，生命上限+45%，攻击力+90%，每次攻击回复自身5%的生命且有25%概率使目标晕眩4秒",
        "descRaw": "每秒流失<@ba.vdown>100</>点生命，并使自身攻击过和攻击过自身的敌人每秒受到<@ba.vup>200</>点真实伤害；攻击距离<@ba.vup>+1</>，生命上限<@ba.vup>+45%</>，攻击力<@ba.vup>+90%</>，每次攻击回复自身<@ba.vup>5%</>的生命且有<@ba.vup>25%</>概率使目标<$ba.stun>晕眩</><@ba.vup>4</>秒",
        "skillType": "MANUAL",
        "durationType": "NONE",
        "duration": 70,
        "spType": "INCREASE_WITH_TIME",
        "spCost": 60,
        "initSp": 40,
        "maxChargeTime": 1,
        "increment": 1,
        "bb": {
          "max_hp": 0.45,
          "atk": 0.9,
          "attack@hp_ratio": 0.05,
          "attack@buff_prob": 0.25,
          "attack@stun": 4,
          "ability_range_forward_extend": 1,
          "attack@value": 100,
          "attack@damage": 200
        },
        "bbStr": {},
        "rangeId": null,
        "rangeGrid": null,
        "prefabId": "skchr_hodrer_3",
        "trigger": {
          "rule": "ACTIVE_RANGE",
          "rawRule": "DEFAULT",
          "customRangeGrid": [
            [
              0,
              0
            ],
            [
              0,
              1
            ],
            [
              0,
              2
            ]
          ]
        },
        "index": 2,
        "overrideTokenKey": null
      },
      "talents": [
        {
          "index": 0,
          "name": "及锋而试",
          "desc": "攻击敌人时攻击力提升至110%，若目标处于晕眩、束缚则改为提升至140%",
          "descRaw": "攻击敌人时攻击力提升至110%，若目标处于<$ba.stun>晕眩</>、<$ba.root>束缚</>则改为提升至140%",
          "bb": {
            "atk_scale": 1.4,
            "atk_scale_2": 1.1
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": 1,
          "name": "余火之氅",
          "desc": "使自身与身后一格的友军获得21%（+3%）的庇护",
          "descRaw": "使自身与身后一格的友军获得21%<@ba.talpu>（+3%）</>的<$ba.protect>庇护</>",
          "bb": {
            "damage_resistance": 0.21
          },
          "bbStr": {},
          "rangeGrid": [
            [
              0,
              -1
            ],
            [
              0,
              0
            ]
          ],
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        }
      ],
      "tokens": [],
      "module": {
        "id": "uniequip_002_hodrer",
        "name": "新的生活",
        "type": "CRU-X",
        "level": 1,
        "active": true
      },
      "assets": {
        "avatar": "char_4088_hodrer_2",
        "portrait": "char_4088_hodrer_2",
        "spine": "char_4088_hodrer",
        "skillIcon": "skchr_hodrer_3",
        "subProfIcon": "sub_crusher_icon"
      },
      "skills": [
        {
          "skillId": "skchr_hodrer_1",
          "iconId": "skchr_hodrer_1",
          "name": "重锋不熄",
          "level": 7,
          "desc": "下次攻击造成相当于攻击力200%的物理伤害，并回复自身20%的生命",
          "descRaw": "下次攻击造成相当于攻击力<@ba.vup>200%</>的物理伤害，并回复自身<@ba.vup>20%</>的生命",
          "skillType": "AUTO",
          "durationType": "NONE",
          "duration": -1,
          "spType": "INCREASE_WHEN_ATTACK",
          "spCost": 3,
          "initSp": 0,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk_scale": 2,
            "hp_ratio": 0.2
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_hodrer_1",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 0,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_hodrer_2",
          "iconId": "skchr_hodrer_2",
          "name": "余烬重荷",
          "level": 7,
          "desc": "被动效果：攻击力+28%\n主动触发可以在下列状态和初始状态间切换：\n攻击间隔略微增大，阻挡数+1，攻击使目标晕眩1秒",
          "descRaw": "被动效果：攻击力<@ba.vup>+28%</>\n<@ba.rem>主动触发可以在下列状态和初始状态间切换：</>\n攻击间隔<@ba.vdown>略微增大</>，阻挡数<@ba.vup>+1</>，攻击使目标<$ba.stun>晕眩</><@ba.vup>1</>秒",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": -1,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 8,
          "initSp": 0,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 0.28,
            "base_attack_time": 0.5,
            "block_cnt": 1,
            "attack@stun": 1
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_hodrer_2",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 1,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_hodrer_3",
          "iconId": "skchr_hodrer_3",
          "name": "死境硝烟",
          "level": 7,
          "desc": "每秒流失100点生命，并使自身攻击过和攻击过自身的敌人每秒受到200点真实伤害；攻击距离+1，生命上限+45%，攻击力+90%，每次攻击回复自身5%的生命且有25%概率使目标晕眩4秒",
          "descRaw": "每秒流失<@ba.vdown>100</>点生命，并使自身攻击过和攻击过自身的敌人每秒受到<@ba.vup>200</>点真实伤害；攻击距离<@ba.vup>+1</>，生命上限<@ba.vup>+45%</>，攻击力<@ba.vup>+90%</>，每次攻击回复自身<@ba.vup>5%</>的生命且有<@ba.vup>25%</>概率使目标<$ba.stun>晕眩</><@ba.vup>4</>秒",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 70,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 60,
          "initSp": 40,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "max_hp": 0.45,
            "atk": 0.9,
            "attack@hp_ratio": 0.05,
            "attack@buff_prob": 0.25,
            "attack@stun": 4,
            "ability_range_forward_extend": 1,
            "attack@value": 100,
            "attack@damage": 200
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_hodrer_3",
          "trigger": {
            "rule": "ACTIVE_RANGE",
            "rawRule": "DEFAULT",
            "customRangeGrid": [
              [
                0,
                0
              ],
              [
                0,
                1
              ],
              [
                0,
                2
              ]
            ]
          },
          "index": 2,
          "overrideTokenKey": null,
          "isDefault": true
        }
      ],
      "statsBase": {
        "maxHp": 5794,
        "atk": 1536,
        "def": 0,
        "res": 0,
        "cost": 22,
        "blockCnt": 2,
        "bat": 2.5,
        "aspd": 100,
        "respawnTime": 70,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "traitBase": {
        "desc": "同时攻击阻挡的所有敌人",
        "descRaw": "同时攻击阻挡的<@ba.kw>所有敌人</>",
        "bb": {},
        "bbStr": {},
        "rangeGrid": null
      },
      "talentsBase": [
        {
          "index": 0,
          "name": "及锋而试",
          "desc": "攻击敌人时攻击力提升至110%，若目标处于晕眩、束缚则改为提升至140%",
          "descRaw": "攻击敌人时攻击力提升至110%，若目标处于<$ba.stun>晕眩</>、<$ba.root>束缚</>则改为提升至140%",
          "bb": {
            "atk_scale": 1.4,
            "atk_scale_2": 1.1
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": 1,
          "name": "余火之氅",
          "desc": "使自身与身后一格的友军获得21%（+3%）的庇护",
          "descRaw": "使自身与身后一格的友军获得21%<@ba.talpu>（+3%）</>的<$ba.protect>庇护</>",
          "bb": {
            "damage_resistance": 0.21
          },
          "bbStr": {},
          "rangeGrid": [
            [
              0,
              -1
            ],
            [
              0,
              0
            ]
          ],
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        }
      ],
      "modules": [
        {
          "uniEquipId": "uniequip_002_hodrer",
          "name": "新的生活",
          "typeName": "CRU-X",
          "typeIcon": "cru-x",
          "icon": "uniequip_002_hodrer",
          "isDefault": true,
          "level": 1,
          "attr": {
            "maxHp": 290,
            "atk": 92
          },
          "traitOverride": {
            "desc": "同时攻击阻挡的所有敌人",
            "descRaw": "同时攻击阻挡的<@ba.kw>所有敌人</>",
            "bb": {
              "heal_scale": 1.2
            },
            "bbStr": {},
            "rangeGrid": null,
            "moduleDesc": "受到的治疗效果提升20%",
            "moduleDescRaw": "受到的治疗效果提升<@ba.kw>20%</>"
          },
          "talentChanges": []
        },
        {
          "uniEquipId": "uniequip_003_hodrer",
          "name": "笔迹",
          "typeName": "CRU-Y",
          "typeIcon": "cru-y",
          "icon": "uniequip_003_hodrer",
          "isDefault": false,
          "level": 1,
          "attr": {
            "maxHp": 300,
            "atk": 110
          },
          "traitOverride": {
            "desc": "同时攻击阻挡的所有敌人",
            "descRaw": "同时攻击阻挡的<@ba.kw>所有敌人</>",
            "bb": {
              "damage_scale": 1.1
            },
            "bbStr": {},
            "rangeGrid": null,
            "moduleDesc": "对被阻挡的敌人伤害提升至110%",
            "moduleDescRaw": "对被阻挡的敌人伤害提升至<@ba.kw>110%</>"
          },
          "talentChanges": []
        }
      ],
      "growthKazdel": true
    },
    "chess_char_9_09_a": {
      "chessId": "chess_char_9_09_a",
      "baseId": "chess_char_9_09_a",
      "goldenId": "chess_char_9_09_b",
      "isGolden": false,
      "tier": 5,
      "identifier": 908,
      "isHidden": false,
      "isDiy": false,
      "visible": true,
      "chessType": "NORMAL",
      "backup": {
        "charId": "char_615_acspec",
        "tmplId": null,
        "skillIndex": 2,
        "uniEquipId": null,
        "potRank": 0
      },
      "shopSortId": 908,
      "charId": "char_4132_ascln",
      "name": "阿斯卡纶",
      "appellation": "Ascalon",
      "rarity": 6,
      "profession": "SPECIAL",
      "subProfessionId": "stalker",
      "subProfessionName": "伏击客",
      "position": "MELEE",
      "nationId": "rhodes",
      "bonds": [
        "rhodesShip",
        "kazdelShip",
        "skillfulShip"
      ],
      "garrisonIds": [
        "garrison_c_ascln_k_a"
      ],
      "price": 4,
      "sellPrice": 1,
      "upgradeNum": 3,
      "upgradeChessId": "chess_char_9_09_b",
      "status": {
        "phase": 2,
        "level": 1,
        "skillLevel": 4,
        "equipLevel": 0
      },
      "stats": {
        "maxHp": 1393,
        "atk": 763,
        "def": 283,
        "res": 30,
        "cost": 19,
        "blockCnt": 0,
        "bat": 3.5,
        "aspd": 100,
        "respawnTime": 66,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": -1,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "immunities": {
        "stun": false,
        "silence": false,
        "sleep": false,
        "frozen": false,
        "levitate": false
      },
      "rangeId": "y-1",
      "rangeGrid": [
        [
          1,
          -1
        ],
        [
          1,
          0
        ],
        [
          1,
          1
        ],
        [
          0,
          -1
        ],
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          0,
          2
        ],
        [
          -1,
          -1
        ],
        [
          -1,
          0
        ],
        [
          -1,
          1
        ]
      ],
      "dmgType": "phys",
      "attackKind": "melee",
      "projectile": "none",
      "canHitFly": false,
      "targetPriority": null,
      "trait": {
        "desc": "对攻击范围内所有敌人造成伤害\n拥有50%的物理和法术闪避且不容易成为敌人的攻击目标",
        "descRaw": "对攻击范围内<@ba.kw>所有敌人</>造成伤害\n拥有50%的物理和法术闪避且不容易成为敌人的<@ba.kw>攻击目标</>",
        "bb": {
          "prob": 0.5
        },
        "bbStr": {},
        "rangeGrid": null
      },
      "skill": {
        "skillId": "skchr_ascln_3",
        "iconId": "skchr_ascln_3",
        "name": "降临",
        "level": 4,
        "desc": "攻击范围扩大，攻击力+20%，攻击间隔缩短，使攻击范围内的地面敌人物理与法术命中率-15%。自身更易受到敌人攻击，敌人未命中自身或自身闪避时回复4%最大生命值",
        "descRaw": "攻击范围<@ba.vup>扩大</>，攻击力<@ba.vup>+20%</>，攻击间隔<@ba.vup>缩短</>，使攻击范围内的地面敌人物理与法术命中率<@ba.vup>-15%</>。自身更易受到敌人攻击，敌人未命中自身或自身闪避时回复<@ba.vup>4%</>最大生命值",
        "skillType": "MANUAL",
        "durationType": "NONE",
        "duration": 45,
        "spType": "INCREASE_WITH_TIME",
        "spCost": 53,
        "initSp": 25,
        "maxChargeTime": 1,
        "increment": 1,
        "bb": {
          "base_attack_time": -1.2,
          "atk": 0.2,
          "taunt_level": 2,
          "attack@hp_ratio": 0.04,
          "attack@damage_hitrate_physical": -0.15,
          "attack@damage_hitrate_magical": -0.15
        },
        "bbStr": {},
        "rangeId": "y-10",
        "rangeGrid": [
          [
            2,
            -1
          ],
          [
            2,
            0
          ],
          [
            2,
            1
          ],
          [
            1,
            -1
          ],
          [
            1,
            0
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ],
          [
            0,
            -1
          ],
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            -1,
            -1
          ],
          [
            -1,
            0
          ],
          [
            -1,
            1
          ],
          [
            -1,
            2
          ],
          [
            -2,
            -1
          ],
          [
            -2,
            0
          ],
          [
            -2,
            1
          ]
        ],
        "prefabId": "skchr_ascln_3",
        "trigger": {
          "rule": "ACTIVE_RANGE",
          "rawRule": "DEFAULT",
          "customRangeGrid": [
            [
              2,
              -1
            ],
            [
              2,
              0
            ],
            [
              2,
              1
            ],
            [
              1,
              -1
            ],
            [
              1,
              0
            ],
            [
              1,
              1
            ],
            [
              1,
              2
            ],
            [
              0,
              -1
            ],
            [
              0,
              0
            ],
            [
              0,
              1
            ],
            [
              0,
              2
            ],
            [
              -1,
              -1
            ],
            [
              -1,
              0
            ],
            [
              -1,
              1
            ],
            [
              -1,
              2
            ],
            [
              -2,
              -1
            ],
            [
              -2,
              0
            ],
            [
              -2,
              1
            ]
          ]
        },
        "index": 2,
        "overrideTokenKey": null
      },
      "talents": [
        {
          "index": 0,
          "name": "死亡拘审",
          "desc": "攻击对敌人施加效果：移动速度降低18％，每秒受到10％阿斯卡纶当前攻击力的法术伤害，持续25秒，效果最多叠加三层",
          "descRaw": "攻击对敌人施加效果：移动速度降低18％，每秒受到10％阿斯卡纶当前攻击力的法术伤害，持续25秒，效果最多叠加三层",
          "bb": {
            "move_speed": -0.18,
            "atk_ratio": 0.1,
            "max_stack_cnt": 3,
            "debuff_duration": 25,
            "interval": 1
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": 1,
          "name": "噬光残影",
          "desc": "攻击速度+10（+2），自身周围四格有高台时，攻击速度额外+6",
          "descRaw": "攻击速度+10<@ba.talpu>（+2）</>，自身周围四格有高台时，攻击速度额外+6",
          "bb": {
            "attack_speed": 10,
            "attack_speed_add": 6,
            "cnt": 1
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        }
      ],
      "tokens": [],
      "module": {
        "id": "uniequip_002_ascln",
        "name": "“无形，无情”",
        "type": "AMB-X",
        "level": 0,
        "active": false
      },
      "assets": {
        "avatar": "char_4132_ascln",
        "portrait": "char_4132_ascln_1",
        "spine": "char_4132_ascln",
        "skillIcon": "skchr_ascln_3",
        "subProfIcon": "sub_stalker_icon"
      },
      "skills": [
        {
          "skillId": "skchr_ascln_1",
          "iconId": "skchr_ascln_1",
          "name": "追袭",
          "level": 4,
          "desc": "下次攻击的攻击力提升至130%，并连续攻击两次\n可充能2次",
          "descRaw": "下次攻击的攻击力提升至<@ba.vup>130%</>，并连续攻击两次\n<@ba.rem>可充能2次</>",
          "skillType": "AUTO",
          "durationType": "NONE",
          "duration": -1,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 10,
          "initSp": 2,
          "maxChargeTime": 2,
          "increment": 1,
          "bb": {
            "atk_scale": 1.3,
            "cnt": 2
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_ascln_1",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 0,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_ascln_2",
          "iconId": "skchr_ascln_2",
          "name": "恩赐",
          "level": 4,
          "desc": "攻击力+50%，使攻击范围内地面敌人移动速度-30%，并在其被击倒时对周围敌人施加一层第一天赋效果",
          "descRaw": "攻击力<@ba.vup>+50%</>，使攻击范围内地面敌人移动速度<@ba.vup>-30%</>，并在其被击倒时对周围敌人施加一层第一天赋效果",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 35,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 27,
          "initSp": 5,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 0.5,
            "move_speed": -0.3,
            "range_radius": 1.3
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_ascln_2",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 1,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_ascln_3",
          "iconId": "skchr_ascln_3",
          "name": "降临",
          "level": 4,
          "desc": "攻击范围扩大，攻击力+20%，攻击间隔缩短，使攻击范围内的地面敌人物理与法术命中率-15%。自身更易受到敌人攻击，敌人未命中自身或自身闪避时回复4%最大生命值",
          "descRaw": "攻击范围<@ba.vup>扩大</>，攻击力<@ba.vup>+20%</>，攻击间隔<@ba.vup>缩短</>，使攻击范围内的地面敌人物理与法术命中率<@ba.vup>-15%</>。自身更易受到敌人攻击，敌人未命中自身或自身闪避时回复<@ba.vup>4%</>最大生命值",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 45,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 53,
          "initSp": 25,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "base_attack_time": -1.2,
            "atk": 0.2,
            "taunt_level": 2,
            "attack@hp_ratio": 0.04,
            "attack@damage_hitrate_physical": -0.15,
            "attack@damage_hitrate_magical": -0.15
          },
          "bbStr": {},
          "rangeId": "y-10",
          "rangeGrid": [
            [
              2,
              -1
            ],
            [
              2,
              0
            ],
            [
              2,
              1
            ],
            [
              1,
              -1
            ],
            [
              1,
              0
            ],
            [
              1,
              1
            ],
            [
              1,
              2
            ],
            [
              0,
              -1
            ],
            [
              0,
              0
            ],
            [
              0,
              1
            ],
            [
              0,
              2
            ],
            [
              -1,
              -1
            ],
            [
              -1,
              0
            ],
            [
              -1,
              1
            ],
            [
              -1,
              2
            ],
            [
              -2,
              -1
            ],
            [
              -2,
              0
            ],
            [
              -2,
              1
            ]
          ],
          "prefabId": "skchr_ascln_3",
          "trigger": {
            "rule": "ACTIVE_RANGE",
            "rawRule": "DEFAULT",
            "customRangeGrid": [
              [
                2,
                -1
              ],
              [
                2,
                0
              ],
              [
                2,
                1
              ],
              [
                1,
                -1
              ],
              [
                1,
                0
              ],
              [
                1,
                1
              ],
              [
                1,
                2
              ],
              [
                0,
                -1
              ],
              [
                0,
                0
              ],
              [
                0,
                1
              ],
              [
                0,
                2
              ],
              [
                -1,
                -1
              ],
              [
                -1,
                0
              ],
              [
                -1,
                1
              ],
              [
                -1,
                2
              ],
              [
                -2,
                -1
              ],
              [
                -2,
                0
              ],
              [
                -2,
                1
              ]
            ]
          },
          "index": 2,
          "overrideTokenKey": null,
          "isDefault": true
        }
      ],
      "growthKazdel": true
    },
    "chess_char_9_09_b": {
      "chessId": "chess_char_9_09_b",
      "baseId": "chess_char_9_09_a",
      "goldenId": "chess_char_9_09_b",
      "isGolden": true,
      "tier": 5,
      "identifier": 908,
      "isHidden": false,
      "isDiy": false,
      "visible": true,
      "chessType": "NORMAL",
      "backup": {
        "charId": "char_615_acspec",
        "tmplId": null,
        "skillIndex": 2,
        "uniEquipId": null,
        "potRank": 0
      },
      "shopSortId": 908,
      "charId": "char_4132_ascln",
      "name": "阿斯卡纶",
      "appellation": "Ascalon",
      "rarity": 6,
      "profession": "SPECIAL",
      "subProfessionId": "stalker",
      "subProfessionName": "伏击客",
      "position": "MELEE",
      "nationId": "rhodes",
      "bonds": [
        "rhodesShip",
        "kazdelShip",
        "skillfulShip"
      ],
      "garrisonIds": [
        "garrison_c_ascln_k_b"
      ],
      "price": 4,
      "sellPrice": 1,
      "upgradeNum": 0,
      "upgradeChessId": null,
      "status": {
        "phase": 2,
        "level": 60,
        "skillLevel": 7,
        "equipLevel": 1
      },
      "stats": {
        "maxHp": 1832,
        "atk": 905,
        "def": 316,
        "res": 30,
        "cost": 19,
        "blockCnt": 0,
        "bat": 3.5,
        "aspd": 100,
        "respawnTime": 66,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": -1,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "immunities": {
        "stun": false,
        "silence": false,
        "sleep": false,
        "frozen": false,
        "levitate": false
      },
      "rangeId": "y-1",
      "rangeGrid": [
        [
          1,
          -1
        ],
        [
          1,
          0
        ],
        [
          1,
          1
        ],
        [
          0,
          -1
        ],
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          0,
          2
        ],
        [
          -1,
          -1
        ],
        [
          -1,
          0
        ],
        [
          -1,
          1
        ]
      ],
      "dmgType": "phys",
      "attackKind": "melee",
      "projectile": "none",
      "canHitFly": false,
      "targetPriority": null,
      "trait": {
        "desc": "对攻击范围内所有敌人造成伤害\n拥有50%的物理和法术闪避且不容易成为敌人的攻击目标",
        "descRaw": "对攻击范围内<@ba.kw>所有敌人</>造成伤害\n拥有50%的物理和法术闪避且不容易成为敌人的<@ba.kw>攻击目标</>",
        "bb": {
          "prob": 0.5
        },
        "bbStr": {},
        "rangeGrid": null,
        "moduleDesc": "攻击范围内所有敌人移动速度-20%",
        "moduleDescRaw": "攻击范围内所有敌人移动速度<@ba.kw>-20%</>"
      },
      "skill": {
        "skillId": "skchr_ascln_3",
        "iconId": "skchr_ascln_3",
        "name": "降临",
        "level": 7,
        "desc": "攻击范围扩大，攻击力+20%，攻击间隔较大幅度缩短，使攻击范围内的地面敌人物理与法术命中率-30%。自身更易受到敌人攻击，敌人未命中自身或自身闪避时回复5%最大生命值",
        "descRaw": "攻击范围<@ba.vup>扩大</>，攻击力<@ba.vup>+20%</>，攻击间隔<@ba.vup>较大幅度缩短</>，使攻击范围内的地面敌人物理与法术命中率<@ba.vup>-30%</>。自身更易受到敌人攻击，敌人未命中自身或自身闪避时回复<@ba.vup>5%</>最大生命值",
        "skillType": "MANUAL",
        "durationType": "NONE",
        "duration": 45,
        "spType": "INCREASE_WITH_TIME",
        "spCost": 49,
        "initSp": 30,
        "maxChargeTime": 1,
        "increment": 1,
        "bb": {
          "base_attack_time": -1.5,
          "atk": 0.2,
          "taunt_level": 2,
          "attack@hp_ratio": 0.05,
          "attack@damage_hitrate_physical": -0.3,
          "attack@damage_hitrate_magical": -0.3
        },
        "bbStr": {},
        "rangeId": "y-10",
        "rangeGrid": [
          [
            2,
            -1
          ],
          [
            2,
            0
          ],
          [
            2,
            1
          ],
          [
            1,
            -1
          ],
          [
            1,
            0
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ],
          [
            0,
            -1
          ],
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            -1,
            -1
          ],
          [
            -1,
            0
          ],
          [
            -1,
            1
          ],
          [
            -1,
            2
          ],
          [
            -2,
            -1
          ],
          [
            -2,
            0
          ],
          [
            -2,
            1
          ]
        ],
        "prefabId": "skchr_ascln_3",
        "trigger": {
          "rule": "ACTIVE_RANGE",
          "rawRule": "DEFAULT",
          "customRangeGrid": [
            [
              2,
              -1
            ],
            [
              2,
              0
            ],
            [
              2,
              1
            ],
            [
              1,
              -1
            ],
            [
              1,
              0
            ],
            [
              1,
              1
            ],
            [
              1,
              2
            ],
            [
              0,
              -1
            ],
            [
              0,
              0
            ],
            [
              0,
              1
            ],
            [
              0,
              2
            ],
            [
              -1,
              -1
            ],
            [
              -1,
              0
            ],
            [
              -1,
              1
            ],
            [
              -1,
              2
            ],
            [
              -2,
              -1
            ],
            [
              -2,
              0
            ],
            [
              -2,
              1
            ]
          ]
        },
        "index": 2,
        "overrideTokenKey": null
      },
      "talents": [
        {
          "index": 0,
          "name": "死亡拘审",
          "desc": "攻击对敌人施加效果：移动速度降低18％，每秒受到10％阿斯卡纶当前攻击力的法术伤害，持续25秒，效果最多叠加三层",
          "descRaw": "攻击对敌人施加效果：移动速度降低18％，每秒受到10％阿斯卡纶当前攻击力的法术伤害，持续25秒，效果最多叠加三层",
          "bb": {
            "move_speed": -0.18,
            "atk_ratio": 0.1,
            "max_stack_cnt": 3,
            "debuff_duration": 25,
            "interval": 1
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": 1,
          "name": "噬光残影",
          "desc": "攻击速度+10（+2），自身周围四格有高台时，攻击速度额外+6",
          "descRaw": "攻击速度+10<@ba.talpu>（+2）</>，自身周围四格有高台时，攻击速度额外+6",
          "bb": {
            "attack_speed": 10,
            "attack_speed_add": 6,
            "cnt": 1
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": -1,
          "name": null,
          "desc": null,
          "descRaw": null,
          "bb": {
            "move_speed": -0.2
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": true,
          "fromModule": true
        }
      ],
      "tokens": [],
      "module": {
        "id": "uniequip_002_ascln",
        "name": "“无形，无情”",
        "type": "AMB-X",
        "level": 1,
        "active": true
      },
      "assets": {
        "avatar": "char_4132_ascln_2",
        "portrait": "char_4132_ascln_2",
        "spine": "char_4132_ascln",
        "skillIcon": "skchr_ascln_3",
        "subProfIcon": "sub_stalker_icon"
      },
      "skills": [
        {
          "skillId": "skchr_ascln_1",
          "iconId": "skchr_ascln_1",
          "name": "追袭",
          "level": 7,
          "desc": "下次攻击的攻击力提升至170%，并连续攻击两次\n可充能3次",
          "descRaw": "下次攻击的攻击力提升至<@ba.vup>170%</>，并连续攻击两次\n<@ba.rem>可充能3次</>",
          "skillType": "AUTO",
          "durationType": "NONE",
          "duration": -1,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 8,
          "initSp": 4,
          "maxChargeTime": 3,
          "increment": 1,
          "bb": {
            "atk_scale": 1.7,
            "cnt": 3
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_ascln_1",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 0,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_ascln_2",
          "iconId": "skchr_ascln_2",
          "name": "恩赐",
          "level": 7,
          "desc": "攻击力+90%，使攻击范围内地面敌人移动速度-40%，并在其被击倒时对周围敌人施加一层第一天赋效果",
          "descRaw": "攻击力<@ba.vup>+90%</>，使攻击范围内地面敌人移动速度<@ba.vup>-40%</>，并在其被击倒时对周围敌人施加一层第一天赋效果",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 35,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 24,
          "initSp": 10,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 0.9,
            "move_speed": -0.4,
            "range_radius": 1.3
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_ascln_2",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 1,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_ascln_3",
          "iconId": "skchr_ascln_3",
          "name": "降临",
          "level": 7,
          "desc": "攻击范围扩大，攻击力+20%，攻击间隔较大幅度缩短，使攻击范围内的地面敌人物理与法术命中率-30%。自身更易受到敌人攻击，敌人未命中自身或自身闪避时回复5%最大生命值",
          "descRaw": "攻击范围<@ba.vup>扩大</>，攻击力<@ba.vup>+20%</>，攻击间隔<@ba.vup>较大幅度缩短</>，使攻击范围内的地面敌人物理与法术命中率<@ba.vup>-30%</>。自身更易受到敌人攻击，敌人未命中自身或自身闪避时回复<@ba.vup>5%</>最大生命值",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 45,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 49,
          "initSp": 30,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "base_attack_time": -1.5,
            "atk": 0.2,
            "taunt_level": 2,
            "attack@hp_ratio": 0.05,
            "attack@damage_hitrate_physical": -0.3,
            "attack@damage_hitrate_magical": -0.3
          },
          "bbStr": {},
          "rangeId": "y-10",
          "rangeGrid": [
            [
              2,
              -1
            ],
            [
              2,
              0
            ],
            [
              2,
              1
            ],
            [
              1,
              -1
            ],
            [
              1,
              0
            ],
            [
              1,
              1
            ],
            [
              1,
              2
            ],
            [
              0,
              -1
            ],
            [
              0,
              0
            ],
            [
              0,
              1
            ],
            [
              0,
              2
            ],
            [
              -1,
              -1
            ],
            [
              -1,
              0
            ],
            [
              -1,
              1
            ],
            [
              -1,
              2
            ],
            [
              -2,
              -1
            ],
            [
              -2,
              0
            ],
            [
              -2,
              1
            ]
          ],
          "prefabId": "skchr_ascln_3",
          "trigger": {
            "rule": "ACTIVE_RANGE",
            "rawRule": "DEFAULT",
            "customRangeGrid": [
              [
                2,
                -1
              ],
              [
                2,
                0
              ],
              [
                2,
                1
              ],
              [
                1,
                -1
              ],
              [
                1,
                0
              ],
              [
                1,
                1
              ],
              [
                1,
                2
              ],
              [
                0,
                -1
              ],
              [
                0,
                0
              ],
              [
                0,
                1
              ],
              [
                0,
                2
              ],
              [
                -1,
                -1
              ],
              [
                -1,
                0
              ],
              [
                -1,
                1
              ],
              [
                -1,
                2
              ],
              [
                -2,
                -1
              ],
              [
                -2,
                0
              ],
              [
                -2,
                1
              ]
            ]
          },
          "index": 2,
          "overrideTokenKey": null,
          "isDefault": true
        }
      ],
      "statsBase": {
        "maxHp": 1652,
        "atk": 890,
        "def": 316,
        "res": 30,
        "cost": 19,
        "blockCnt": 0,
        "bat": 3.5,
        "aspd": 100,
        "respawnTime": 66,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": -1,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "traitBase": {
        "desc": "对攻击范围内所有敌人造成伤害\n拥有50%的物理和法术闪避且不容易成为敌人的攻击目标",
        "descRaw": "对攻击范围内<@ba.kw>所有敌人</>造成伤害\n拥有50%的物理和法术闪避且不容易成为敌人的<@ba.kw>攻击目标</>",
        "bb": {
          "prob": 0.5
        },
        "bbStr": {},
        "rangeGrid": null
      },
      "talentsBase": [
        {
          "index": 0,
          "name": "死亡拘审",
          "desc": "攻击对敌人施加效果：移动速度降低18％，每秒受到10％阿斯卡纶当前攻击力的法术伤害，持续25秒，效果最多叠加三层",
          "descRaw": "攻击对敌人施加效果：移动速度降低18％，每秒受到10％阿斯卡纶当前攻击力的法术伤害，持续25秒，效果最多叠加三层",
          "bb": {
            "move_speed": -0.18,
            "atk_ratio": 0.1,
            "max_stack_cnt": 3,
            "debuff_duration": 25,
            "interval": 1
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": 1,
          "name": "噬光残影",
          "desc": "攻击速度+10（+2），自身周围四格有高台时，攻击速度额外+6",
          "descRaw": "攻击速度+10<@ba.talpu>（+2）</>，自身周围四格有高台时，攻击速度额外+6",
          "bb": {
            "attack_speed": 10,
            "attack_speed_add": 6,
            "cnt": 1
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        }
      ],
      "modules": [
        {
          "uniEquipId": "uniequip_002_ascln",
          "name": "“无形，无情”",
          "typeName": "AMB-X",
          "typeIcon": "amb-x",
          "icon": "uniequip_002_ascln",
          "isDefault": true,
          "level": 1,
          "attr": {
            "maxHp": 180,
            "atk": 15
          },
          "traitOverride": {
            "desc": "对攻击范围内所有敌人造成伤害\n拥有50%的物理和法术闪避且不容易成为敌人的攻击目标",
            "descRaw": "对攻击范围内<@ba.kw>所有敌人</>造成伤害\n拥有50%的物理和法术闪避且不容易成为敌人的<@ba.kw>攻击目标</>",
            "bb": {
              "prob": 0.5
            },
            "bbStr": {},
            "rangeGrid": null,
            "moduleDesc": "攻击范围内所有敌人移动速度-20%",
            "moduleDescRaw": "攻击范围内所有敌人移动速度<@ba.kw>-20%</>"
          },
          "talentChanges": [
            {
              "talentIndex": -1,
              "name": null,
              "desc": null,
              "descRaw": null,
              "bb": {
                "move_speed": -0.2
              },
              "bbStr": {},
              "rangeGrid": null,
              "tokenKey": null,
              "hidden": true
            }
          ]
        },
        {
          "uniEquipId": "uniequip_003_ascln",
          "name": "“阿斯卡纶的眼睛”",
          "typeName": "AMB-Y",
          "typeIcon": "amb-y",
          "icon": "uniequip_003_ascln",
          "isDefault": false,
          "level": 1,
          "attr": {
            "atk": 55,
            "def": 25
          },
          "traitOverride": {
            "desc": "对攻击范围内所有敌人造成伤害\n拥有65%的物理和法术闪避且不容易成为敌人的攻击目标",
            "descRaw": "对攻击范围内<@ba.kw>所有敌人</>造成伤害\n拥有65%的物理和法术闪避且不容易成为敌人的<@ba.kw>攻击目标</>",
            "bb": {
              "prob": 0.65
            },
            "bbStr": {},
            "rangeGrid": null
          },
          "talentChanges": []
        }
      ],
      "growthKazdel": true
    },
    "chess_char_9_10_a": {
      "chessId": "chess_char_9_10_a",
      "baseId": "chess_char_9_10_a",
      "goldenId": "chess_char_9_10_b",
      "isGolden": false,
      "tier": 6,
      "identifier": 909,
      "isHidden": false,
      "isDiy": false,
      "visible": true,
      "chessType": "NORMAL",
      "backup": {
        "charId": "char_611_acnipe",
        "tmplId": null,
        "skillIndex": 2,
        "uniEquipId": null,
        "potRank": 0
      },
      "shopSortId": 909,
      "charId": "char_1035_wisdel",
      "name": "维什戴尔",
      "appellation": "Wiš'adel",
      "rarity": 6,
      "profession": "SNIPER",
      "subProfessionId": "bombarder",
      "subProfessionName": "投掷手",
      "position": "RANGED",
      "nationId": null,
      "bonds": [
        "kazdelShip",
        "skillfulShip",
        "preciShip"
      ],
      "garrisonIds": [
        "garrison_c_wisdel_a"
      ],
      "price": 4,
      "sellPrice": 1,
      "upgradeNum": 3,
      "upgradeChessId": "chess_char_9_10_b",
      "status": {
        "phase": 2,
        "level": 1,
        "skillLevel": 4,
        "equipLevel": 0
      },
      "stats": {
        "maxHp": 1434,
        "atk": 615,
        "def": 209,
        "res": 15,
        "cost": 23,
        "blockCnt": 1,
        "bat": 2.1,
        "aspd": 100,
        "respawnTime": 66,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "immunities": {
        "stun": false,
        "silence": false,
        "sleep": false,
        "frozen": false,
        "levitate": false
      },
      "rangeId": "3-9",
      "rangeGrid": [
        [
          2,
          0
        ],
        [
          2,
          1
        ],
        [
          2,
          2
        ],
        [
          1,
          0
        ],
        [
          1,
          1
        ],
        [
          1,
          2
        ],
        [
          1,
          3
        ],
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          0,
          2
        ],
        [
          0,
          3
        ],
        [
          0,
          4
        ],
        [
          -1,
          0
        ],
        [
          -1,
          1
        ],
        [
          -1,
          2
        ],
        [
          -1,
          3
        ],
        [
          -2,
          0
        ],
        [
          -2,
          1
        ],
        [
          -2,
          2
        ]
      ],
      "dmgType": "phys",
      "attackKind": "ranged",
      "projectile": "arrow",
      "canHitFly": false,
      "targetPriority": null,
      "trait": {
        "desc": "攻击对小范围的地面敌人造成两次物理伤害（第二次为余震，伤害降低至攻击力的一半）",
        "descRaw": "攻击对小范围的<@ba.kw>地面</>敌人造成<@ba.kw>两次</>物理伤害（第二次为余震，伤害降低至攻击力的一半）",
        "bb": {
          "attack@append_atk_scale": 0.5,
          "attack@enable_third_attack": 0
        },
        "bbStr": {},
        "rangeGrid": null
      },
      "skill": {
        "skillId": "skchr_wisdel_3",
        "iconId": "skchr_wisdel_3",
        "name": "爆裂黎明",
        "level": 4,
        "desc": "立刻在攻击范围内召唤1个魂灵之影（最多存在3个，技能结束后保留），攻击力+120%，攻击间隔大幅增大，攻击时攻击力提升至175%，溅射范围大幅扩大且第一天赋的发动概率提高至100%\n攻击装有6发弹药，打完后结束（可随时停止技能）",
        "descRaw": "立刻在攻击范围内召唤<@ba.vup>1</>个魂灵之影（最多存在3个，技能结束后保留），攻击力<@ba.vup>+120%</>，攻击间隔<@ba.vdown>大幅增大</>，攻击时攻击力提升至<@ba.vup>175%</>，溅射范围<@ba.vup>大幅扩大</>且第一天赋的发动概率提高至<@ba.vup>100%</>\n<@ba.rem>攻击装有6发弹药，打完后结束（可随时停止技能）</>",
        "skillType": "MANUAL",
        "durationType": "AMMO",
        "duration": -1,
        "spType": "INCREASE_WITH_TIME",
        "spCost": 64,
        "initSp": 30,
        "maxChargeTime": 1,
        "increment": 1,
        "bb": {
          "atk": 1.2,
          "max_cnt": 1,
          "base_attack_time": 2.9,
          "attack@atk_scale_3": 1.75,
          "attack@prob": 1,
          "attack@trigger_time": 6,
          "sp": 3
        },
        "bbStr": {},
        "rangeId": null,
        "rangeGrid": null,
        "prefabId": "skchr_wisdel_3",
        "trigger": {
          "rule": "SP_FULL",
          "rawRule": "ALWAYS",
          "customRangeGrid": null
        },
        "index": 2,
        "overrideTokenKey": "token_10035_wisdel_wward"
      },
      "talents": [
        {
          "index": 0,
          "name": "好礼",
          "desc": "攻击时对主目标的攻击力提升至115%并为其附着残影，残影受到维什戴尔的余震影响时有15%概率爆炸，对周围所有敌人造成160%（+10%）攻击力的物理伤害并使其晕眩1秒",
          "descRaw": "攻击时对主目标的攻击力提升至115%并为其附着残影，残影受到维什戴尔的余震影响时有15%概率爆炸，对周围所有敌人造成160%<@ba.talpu>（+10%）</>攻击力的物理伤害并使其<$ba.stun>晕眩</>1秒",
          "bb": {
            "attack@main_atk_scale": 1.15,
            "attack@prob": 0.15,
            "attack@bomb_atk_scale": 1.6,
            "attack@stun": 1,
            "attack@range_radius": 1.1
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": 1,
          "name": "死魂灵的余息",
          "desc": "部署后立刻在攻击范围内召唤一个魂灵之影，在魂灵之影周围时获得迷彩",
          "descRaw": "部署后立刻在攻击范围内召唤一个魂灵之影，在魂灵之影周围时获得<$ba.camou>迷彩</>",
          "bb": {},
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": "token_10035_wisdel_wward",
          "hidden": false,
          "fromModule": false
        }
      ],
      "tokens": [
        "token_10035_wisdel_wward"
      ],
      "module": {
        "id": "uniequip_002_wisdel",
        "name": "“祖宗发射器”",
        "type": "BOM-X",
        "level": 0,
        "active": false
      },
      "assets": {
        "avatar": "char_1035_wisdel",
        "portrait": "char_1035_wisdel_1",
        "spine": "char_1035_wisdel",
        "skillIcon": "skchr_wisdel_3",
        "subProfIcon": "sub_bombarder_icon"
      },
      "skills": [
        {
          "skillId": "skchr_wisdel_1",
          "iconId": "skchr_wisdel_1",
          "name": "定点清算",
          "level": 4,
          "desc": "下次攻击额外造成2次余震并使所有目标晕眩0.5秒，此次攻击的溅射范围略微扩大且余震伤害变为攻击力的75%",
          "descRaw": "下次攻击额外造成2次余震并使所有目标<$ba.stun>晕眩</><@ba.vup>0.5</>秒，此次攻击的溅射范围<@ba.vup>略微扩大</>且余震伤害变为攻击力的<@ba.vup>75%</>",
          "skillType": "AUTO",
          "durationType": "NONE",
          "duration": 0,
          "spType": "INCREASE_WHEN_ATTACK",
          "spCost": 4,
          "initSp": 0,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "append_atk_scale": 0.75,
            "stun_duration": 0.5
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_wisdel_1",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 0,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_wisdel_2",
          "iconId": "skchr_wisdel_2",
          "name": "饱和复仇",
          "level": 4,
          "desc": "攻击力+16%，攻击间隔略微缩短，可同时攻击3名敌人\n过载：攻击改为攻击力65%的4连发，随机攻击范围内的目标\n该技能可随时主动关闭",
          "descRaw": "攻击力<@ba.vup>+16%</>，攻击间隔<@ba.vup>略微缩短</>，可同时攻击<@ba.vup>3</>名敌人\n<$ba.overdrive>过载</>：攻击改为攻击力<@ba.vup>65%</>的<@ba.vup>4</>连发，随机攻击范围内的目标\n<@ba.rem>该技能可随时主动关闭</>",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 25,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 32,
          "initSp": 15,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "base_attack_time": -0.5,
            "atk": 0.16,
            "attack@atk_scale_ol": 0.65
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_wisdel_2",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 1,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_wisdel_3",
          "iconId": "skchr_wisdel_3",
          "name": "爆裂黎明",
          "level": 4,
          "desc": "立刻在攻击范围内召唤1个魂灵之影（最多存在3个，技能结束后保留），攻击力+120%，攻击间隔大幅增大，攻击时攻击力提升至175%，溅射范围大幅扩大且第一天赋的发动概率提高至100%\n攻击装有6发弹药，打完后结束（可随时停止技能）",
          "descRaw": "立刻在攻击范围内召唤<@ba.vup>1</>个魂灵之影（最多存在3个，技能结束后保留），攻击力<@ba.vup>+120%</>，攻击间隔<@ba.vdown>大幅增大</>，攻击时攻击力提升至<@ba.vup>175%</>，溅射范围<@ba.vup>大幅扩大</>且第一天赋的发动概率提高至<@ba.vup>100%</>\n<@ba.rem>攻击装有6发弹药，打完后结束（可随时停止技能）</>",
          "skillType": "MANUAL",
          "durationType": "AMMO",
          "duration": -1,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 64,
          "initSp": 30,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 1.2,
            "max_cnt": 1,
            "base_attack_time": 2.9,
            "attack@atk_scale_3": 1.75,
            "attack@prob": 1,
            "attack@trigger_time": 6,
            "sp": 3
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_wisdel_3",
          "trigger": {
            "rule": "SP_FULL",
            "rawRule": "ALWAYS",
            "customRangeGrid": null
          },
          "index": 2,
          "overrideTokenKey": "token_10035_wisdel_wward",
          "isDefault": true
        }
      ],
      "growthKazdel": true
    },
    "chess_char_9_10_b": {
      "chessId": "chess_char_9_10_b",
      "baseId": "chess_char_9_10_a",
      "goldenId": "chess_char_9_10_b",
      "isGolden": true,
      "tier": 6,
      "identifier": 909,
      "isHidden": false,
      "isDiy": false,
      "visible": true,
      "chessType": "NORMAL",
      "backup": {
        "charId": "char_611_acnipe",
        "tmplId": null,
        "skillIndex": 2,
        "uniEquipId": null,
        "potRank": 0
      },
      "shopSortId": 909,
      "charId": "char_1035_wisdel",
      "name": "维什戴尔",
      "appellation": "Wiš'adel",
      "rarity": 6,
      "profession": "SNIPER",
      "subProfessionId": "bombarder",
      "subProfessionName": "投掷手",
      "position": "RANGED",
      "nationId": null,
      "bonds": [
        "kazdelShip",
        "skillfulShip",
        "preciShip"
      ],
      "garrisonIds": [
        "garrison_c_wisdel_b"
      ],
      "price": 4,
      "sellPrice": 1,
      "upgradeNum": 0,
      "upgradeChessId": null,
      "status": {
        "phase": 2,
        "level": 60,
        "skillLevel": 7,
        "equipLevel": 3
      },
      "stats": {
        "maxHp": 1735,
        "atk": 749,
        "def": 240,
        "res": 15,
        "cost": 23,
        "blockCnt": 1,
        "bat": 2.1,
        "aspd": 107,
        "respawnTime": 66,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "immunities": {
        "stun": false,
        "silence": false,
        "sleep": false,
        "frozen": false,
        "levitate": false
      },
      "rangeId": "3-9",
      "rangeGrid": [
        [
          2,
          0
        ],
        [
          2,
          1
        ],
        [
          2,
          2
        ],
        [
          1,
          0
        ],
        [
          1,
          1
        ],
        [
          1,
          2
        ],
        [
          1,
          3
        ],
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          0,
          2
        ],
        [
          0,
          3
        ],
        [
          0,
          4
        ],
        [
          -1,
          0
        ],
        [
          -1,
          1
        ],
        [
          -1,
          2
        ],
        [
          -1,
          3
        ],
        [
          -2,
          0
        ],
        [
          -2,
          1
        ],
        [
          -2,
          2
        ]
      ],
      "dmgType": "phys",
      "attackKind": "ranged",
      "projectile": "arrow",
      "canHitFly": false,
      "targetPriority": null,
      "trait": {
        "desc": "攻击对小范围的地面敌人造成三次物理伤害（后两次为余震，伤害降低至攻击力的50％）",
        "descRaw": "攻击对小范围的<@ba.kw>地面</>敌人造成<@ba.kw>三次</>物理伤害（后两次为余震，伤害降低至攻击力的50％）",
        "bb": {
          "attack@append_atk_scale": 0.5,
          "attack@enable_third_attack": 1
        },
        "bbStr": {},
        "rangeGrid": null
      },
      "skill": {
        "skillId": "skchr_wisdel_3",
        "iconId": "skchr_wisdel_3",
        "name": "爆裂黎明",
        "level": 7,
        "desc": "立刻在攻击范围内召唤2个魂灵之影（最多存在3个，技能结束后保留），攻击力+150%，攻击间隔大幅增大，攻击时攻击力提升至190%，溅射范围大幅扩大且第一天赋的发动概率提高至100%\n攻击装有6发弹药，打完后结束（可随时停止技能）",
        "descRaw": "立刻在攻击范围内召唤<@ba.vup>2</>个魂灵之影（最多存在3个，技能结束后保留），攻击力<@ba.vup>+150%</>，攻击间隔<@ba.vdown>大幅增大</>，攻击时攻击力提升至<@ba.vup>190%</>，溅射范围<@ba.vup>大幅扩大</>且第一天赋的发动概率提高至<@ba.vup>100%</>\n<@ba.rem>攻击装有6发弹药，打完后结束（可随时停止技能）</>",
        "skillType": "MANUAL",
        "durationType": "AMMO",
        "duration": -1,
        "spType": "INCREASE_WITH_TIME",
        "spCost": 58,
        "initSp": 35,
        "maxChargeTime": 1,
        "increment": 1,
        "bb": {
          "atk": 1.5,
          "max_cnt": 2,
          "base_attack_time": 2.9,
          "attack@atk_scale_3": 1.9,
          "attack@prob": 1,
          "attack@trigger_time": 6,
          "sp": 3
        },
        "bbStr": {},
        "rangeId": null,
        "rangeGrid": null,
        "prefabId": "skchr_wisdel_3",
        "trigger": {
          "rule": "SP_FULL",
          "rawRule": "ALWAYS",
          "customRangeGrid": null
        },
        "index": 2,
        "overrideTokenKey": "token_10035_wisdel_wward"
      },
      "talents": [
        {
          "index": 0,
          "name": "好礼",
          "desc": "攻击时对主目标的攻击力提升至125%并为其附着残影，残影受到维什戴尔的余震影响时有15%概率爆炸，对周围所有敌人造成185%（+10%）攻击力的物理伤害并使其晕眩1秒",
          "descRaw": "攻击时对主目标的攻击力提升至125%并为其附着残影，残影受到维什戴尔的余震影响时有15%概率爆炸，对周围所有敌人造成185%<@ba.talpu>（+10%）</>攻击力的物理伤害并使其<$ba.stun>晕眩</>1秒",
          "bb": {
            "attack@main_atk_scale": 1.25,
            "attack@prob": 0.15,
            "attack@bomb_atk_scale": 1.85,
            "attack@stun": 1,
            "attack@range_radius": 1.1
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": true
        },
        {
          "index": 1,
          "name": "死魂灵的余息",
          "desc": "部署后立刻在攻击范围内召唤一个魂灵之影，在魂灵之影周围时获得迷彩",
          "descRaw": "部署后立刻在攻击范围内召唤一个魂灵之影，在魂灵之影周围时获得<$ba.camou>迷彩</>",
          "bb": {},
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": "token_10035_wisdel_wward",
          "hidden": false,
          "fromModule": false
        }
      ],
      "tokens": [
        "token_10035_wisdel_wward"
      ],
      "module": {
        "id": "uniequip_002_wisdel",
        "name": "“祖宗发射器”",
        "type": "BOM-X",
        "level": 3,
        "active": true
      },
      "assets": {
        "avatar": "char_1035_wisdel_2",
        "portrait": "char_1035_wisdel_2",
        "spine": "char_1035_wisdel",
        "skillIcon": "skchr_wisdel_3",
        "subProfIcon": "sub_bombarder_icon"
      },
      "skills": [
        {
          "skillId": "skchr_wisdel_1",
          "iconId": "skchr_wisdel_1",
          "name": "定点清算",
          "level": 7,
          "desc": "下次攻击额外造成2次余震并使所有目标晕眩1秒，此次攻击的溅射范围略微扩大且余震伤害变为攻击力的90%",
          "descRaw": "下次攻击额外造成2次余震并使所有目标<$ba.stun>晕眩</><@ba.vup>1</>秒，此次攻击的溅射范围<@ba.vup>略微扩大</>且余震伤害变为攻击力的<@ba.vup>90%</>",
          "skillType": "AUTO",
          "durationType": "NONE",
          "duration": 0,
          "spType": "INCREASE_WHEN_ATTACK",
          "spCost": 3,
          "initSp": 0,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "append_atk_scale": 0.9,
            "stun_duration": 1
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_wisdel_1",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 0,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_wisdel_2",
          "iconId": "skchr_wisdel_2",
          "name": "饱和复仇",
          "level": 7,
          "desc": "攻击力+25%，攻击间隔缩短，可同时攻击3名敌人\n过载：攻击改为攻击力70%的4连发，随机攻击范围内的目标\n该技能可随时主动关闭",
          "descRaw": "攻击力<@ba.vup>+25%</>，攻击间隔<@ba.vup>缩短</>，可同时攻击<@ba.vup>3</>名敌人\n<$ba.overdrive>过载</>：攻击改为攻击力<@ba.vup>70%</>的<@ba.vup>4</>连发，随机攻击范围内的目标\n<@ba.rem>该技能可随时主动关闭</>",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 25,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 29,
          "initSp": 15,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "base_attack_time": -0.7,
            "atk": 0.25,
            "attack@atk_scale_ol": 0.7
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_wisdel_2",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 1,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_wisdel_3",
          "iconId": "skchr_wisdel_3",
          "name": "爆裂黎明",
          "level": 7,
          "desc": "立刻在攻击范围内召唤2个魂灵之影（最多存在3个，技能结束后保留），攻击力+150%，攻击间隔大幅增大，攻击时攻击力提升至190%，溅射范围大幅扩大且第一天赋的发动概率提高至100%\n攻击装有6发弹药，打完后结束（可随时停止技能）",
          "descRaw": "立刻在攻击范围内召唤<@ba.vup>2</>个魂灵之影（最多存在3个，技能结束后保留），攻击力<@ba.vup>+150%</>，攻击间隔<@ba.vdown>大幅增大</>，攻击时攻击力提升至<@ba.vup>190%</>，溅射范围<@ba.vup>大幅扩大</>且第一天赋的发动概率提高至<@ba.vup>100%</>\n<@ba.rem>攻击装有6发弹药，打完后结束（可随时停止技能）</>",
          "skillType": "MANUAL",
          "durationType": "AMMO",
          "duration": -1,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 58,
          "initSp": 35,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 1.5,
            "max_cnt": 2,
            "base_attack_time": 2.9,
            "attack@atk_scale_3": 1.9,
            "attack@prob": 1,
            "attack@trigger_time": 6,
            "sp": 3
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_wisdel_3",
          "trigger": {
            "rule": "SP_FULL",
            "rawRule": "ALWAYS",
            "customRangeGrid": null
          },
          "index": 2,
          "overrideTokenKey": "token_10035_wisdel_wward",
          "isDefault": true
        }
      ],
      "statsBase": {
        "maxHp": 1735,
        "atk": 684,
        "def": 240,
        "res": 15,
        "cost": 23,
        "blockCnt": 1,
        "bat": 2.1,
        "aspd": 100,
        "respawnTime": 66,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "traitBase": {
        "desc": "攻击对小范围的地面敌人造成两次物理伤害（第二次为余震，伤害降低至攻击力的一半）",
        "descRaw": "攻击对小范围的<@ba.kw>地面</>敌人造成<@ba.kw>两次</>物理伤害（第二次为余震，伤害降低至攻击力的一半）",
        "bb": {
          "attack@append_atk_scale": 0.5,
          "attack@enable_third_attack": 0
        },
        "bbStr": {},
        "rangeGrid": null
      },
      "talentsBase": [
        {
          "index": 0,
          "name": "好礼",
          "desc": "攻击时对主目标的攻击力提升至115%并为其附着残影，残影受到维什戴尔的余震影响时有15%概率爆炸，对周围所有敌人造成160%（+10%）攻击力的物理伤害并使其晕眩1秒",
          "descRaw": "攻击时对主目标的攻击力提升至115%并为其附着残影，残影受到维什戴尔的余震影响时有15%概率爆炸，对周围所有敌人造成160%<@ba.talpu>（+10%）</>攻击力的物理伤害并使其<$ba.stun>晕眩</>1秒",
          "bb": {
            "attack@main_atk_scale": 1.15,
            "attack@prob": 0.15,
            "attack@bomb_atk_scale": 1.6,
            "attack@stun": 1,
            "attack@range_radius": 1.1
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": 1,
          "name": "死魂灵的余息",
          "desc": "部署后立刻在攻击范围内召唤一个魂灵之影，在魂灵之影周围时获得迷彩",
          "descRaw": "部署后立刻在攻击范围内召唤一个魂灵之影，在魂灵之影周围时获得<$ba.camou>迷彩</>",
          "bb": {},
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": "token_10035_wisdel_wward",
          "hidden": false,
          "fromModule": false
        }
      ],
      "modules": [
        {
          "uniEquipId": "uniequip_002_wisdel",
          "name": "“祖宗发射器”",
          "typeName": "BOM-X",
          "typeIcon": "bom-x",
          "icon": "uniequip_002_wisdel",
          "isDefault": true,
          "level": 3,
          "attr": {
            "atk": 65,
            "aspd": 7
          },
          "traitOverride": {
            "desc": "攻击对小范围的地面敌人造成三次物理伤害（后两次为余震，伤害降低至攻击力的50％）",
            "descRaw": "攻击对小范围的<@ba.kw>地面</>敌人造成<@ba.kw>三次</>物理伤害（后两次为余震，伤害降低至攻击力的50％）",
            "bb": {
              "attack@append_atk_scale": 0.5,
              "attack@enable_third_attack": 1
            },
            "bbStr": {},
            "rangeGrid": null
          },
          "talentChanges": [
            {
              "talentIndex": 0,
              "name": "好礼",
              "desc": "攻击时对主目标的攻击力提升至125%并为其附着残影，残影受到维什戴尔的余震影响时有15%概率爆炸，对周围所有敌人造成185%（+10%）攻击力的物理伤害并使其晕眩1秒",
              "descRaw": "攻击时对主目标的攻击力提升至125%并为其附着残影，残影受到维什戴尔的余震影响时有15%概率爆炸，对周围所有敌人造成185%<@ba.talpu>（+10%）</>攻击力的物理伤害并使其<$ba.stun>晕眩</>1秒",
              "bb": {
                "attack@main_atk_scale": 1.25,
                "attack@prob": 0.15,
                "attack@bomb_atk_scale": 1.85,
                "attack@stun": 1,
                "attack@range_radius": 1.1
              },
              "bbStr": {},
              "rangeGrid": null,
              "tokenKey": null,
              "hidden": false
            }
          ]
        }
      ],
      "growthKazdel": true
    },
    "chess_char_9_22_a": {
      "chessId": "chess_char_9_22_a",
      "baseId": "chess_char_9_22_a",
      "goldenId": "chess_char_9_22_b",
      "isGolden": false,
      "tier": 6,
      "identifier": 919,
      "isHidden": false,
      "isDiy": false,
      "visible": true,
      "chessType": "NORMAL",
      "backup": {
        "charId": "char_612_accast",
        "tmplId": null,
        "skillIndex": 2,
        "uniEquipId": null,
        "potRank": 0
      },
      "shopSortId": 919,
      "charId": "char_4133_logos",
      "name": "逻各斯",
      "appellation": "Logos",
      "rarity": 6,
      "profession": "CASTER",
      "subProfessionId": "corecaster",
      "subProfessionName": "中坚术师",
      "position": "RANGED",
      "nationId": "rhodes",
      "bonds": [
        "rhodesShip",
        "kazdelShip",
        "visiShip"
      ],
      "garrisonIds": [
        "garrison_c_logos_a"
      ],
      "price": 4,
      "sellPrice": 1,
      "upgradeNum": 3,
      "upgradeChessId": "chess_char_9_22_b",
      "status": {
        "phase": 2,
        "level": 1,
        "skillLevel": 4,
        "equipLevel": 0
      },
      "stats": {
        "maxHp": 1297,
        "atk": 583,
        "def": 106,
        "res": 20,
        "cost": 19,
        "blockCnt": 1,
        "bat": 1.6,
        "aspd": 100,
        "respawnTime": 70,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "immunities": {
        "stun": false,
        "silence": false,
        "sleep": false,
        "frozen": false,
        "levitate": false
      },
      "rangeId": "3-1",
      "rangeGrid": [
        [
          1,
          0
        ],
        [
          1,
          1
        ],
        [
          1,
          2
        ],
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          0,
          2
        ],
        [
          0,
          3
        ],
        [
          -1,
          0
        ],
        [
          -1,
          1
        ],
        [
          -1,
          2
        ]
      ],
      "dmgType": "arts",
      "attackKind": "ranged",
      "projectile": "bolt",
      "canHitFly": true,
      "targetPriority": null,
      "trait": {
        "desc": "攻击造成法术伤害",
        "descRaw": "攻击造成<@ba.kw>法术伤害</>",
        "bb": {},
        "bbStr": {},
        "rangeGrid": null
      },
      "skill": {
        "skillId": "skchr_logos_3",
        "iconId": "skchr_logos_3",
        "name": "延异视阈",
        "level": 4,
        "desc": "攻击范围扩大，攻击力+160%，同时攻击3个目标，使攻击范围内敌方子弹的飞行速度大幅降低、并在技能结束时将其全部清除",
        "descRaw": "攻击范围<@ba.vup>扩大</>，攻击力<@ba.vup>+160%</>，同时攻击<@ba.vup>3</>个目标，使攻击范围内敌方子弹的飞行速度<@ba.vup>大幅降低</>、并在技能结束时将其全部<@ba.vup>清除</>",
        "skillType": "MANUAL",
        "durationType": "NONE",
        "duration": 30,
        "spType": "INCREASE_WITH_TIME",
        "spCost": 45,
        "initSp": 9,
        "maxChargeTime": 1,
        "increment": 1,
        "bb": {
          "atk": 1.6,
          "attack@max_target": 3,
          "projectile_move_scale": 0.05
        },
        "bbStr": {},
        "rangeId": "3-4",
        "rangeGrid": [
          [
            2,
            0
          ],
          [
            2,
            1
          ],
          [
            2,
            2
          ],
          [
            1,
            0
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ],
          [
            1,
            3
          ],
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            0,
            3
          ],
          [
            -1,
            0
          ],
          [
            -1,
            1
          ],
          [
            -1,
            2
          ],
          [
            -1,
            3
          ],
          [
            -2,
            0
          ],
          [
            -2,
            1
          ],
          [
            -2,
            2
          ]
        ],
        "prefabId": "skchr_logos_3",
        "trigger": {
          "rule": "ACTIVE_RANGE",
          "rawRule": "DEFAULT",
          "customRangeGrid": [
            [
              2,
              0
            ],
            [
              2,
              1
            ],
            [
              2,
              2
            ],
            [
              1,
              0
            ],
            [
              1,
              1
            ],
            [
              1,
              2
            ],
            [
              1,
              3
            ],
            [
              0,
              0
            ],
            [
              0,
              1
            ],
            [
              0,
              2
            ],
            [
              0,
              3
            ],
            [
              -1,
              0
            ],
            [
              -1,
              1
            ],
            [
              -1,
              2
            ],
            [
              -1,
              3
            ],
            [
              -2,
              0
            ],
            [
              -2,
              1
            ],
            [
              -2,
              2
            ]
          ]
        },
        "index": 2,
        "overrideTokenKey": null
      },
      "talents": [
        {
          "index": 0,
          "name": "语汇演化",
          "desc": "对一个目标发起攻击时，有40%几率额外对攻击范围内一个随机目标造成相当于攻击力65%（+5%）的法术伤害并使其停顿0.8秒",
          "descRaw": "对一个目标发起攻击时，有40%几率额外对攻击范围内一个随机目标造成相当于攻击力65%<@ba.talpu>（+5%）</>的法术伤害并使其<$ba.sluggish>停顿</>0.8秒",
          "bb": {
            "prob": 0.4,
            "atk_scale": 0.65,
            "sluggish": 0.8
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": 1,
          "name": "剜魂具辞",
          "desc": "攻击使目标在5秒内法术抗性-10且受到的法术伤害提高165（+15）点",
          "descRaw": "攻击使目标在5秒内法术抗性-10且受到的法术伤害提高165<@ba.talpu>（+15）</>点",
          "bb": {
            "duration": 5,
            "magic_resistance": -10,
            "atk_addition": 165
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        }
      ],
      "tokens": [],
      "module": {
        "id": "uniequip_002_logos",
        "name": "来自河谷的笔盒",
        "type": "CCR-D",
        "level": 0,
        "active": false
      },
      "assets": {
        "avatar": "char_4133_logos",
        "portrait": "char_4133_logos_1",
        "spine": "char_4133_logos",
        "skillIcon": "skchr_logos_3",
        "subProfIcon": "sub_corecaster_icon"
      },
      "skills": [
        {
          "skillId": "skchr_logos_1",
          "iconId": "skchr_logos_1",
          "name": "殁亡",
          "level": 4,
          "desc": "攻击范围扩大，攻击力+40%，使攻击范围内生命值低于逻各斯攻击力90%的敌人立刻倒下、并对另一个随机目标造成与倒下单位生命值相等的法术伤害\n持续时间无限",
          "descRaw": "攻击范围<@ba.vup>扩大</>，攻击力<@ba.vup>+40%</>，使攻击范围内生命值低于逻各斯攻击力<@ba.vup>90%</>的敌人立刻倒下、并对另一个随机目标造成与倒下单位生命值相等的法术伤害\n<@ba.rem>持续时间无限</>",
          "skillType": "AUTO",
          "durationType": "NONE",
          "duration": -1,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 74,
          "initSp": 0,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 0.4,
            "attack@kill_atk_scale": 0.9,
            "attack@kill_damage": 9999999
          },
          "bbStr": {},
          "rangeId": "3-3",
          "rangeGrid": [
            [
              1,
              0
            ],
            [
              1,
              1
            ],
            [
              1,
              2
            ],
            [
              1,
              3
            ],
            [
              0,
              0
            ],
            [
              0,
              1
            ],
            [
              0,
              2
            ],
            [
              0,
              3
            ],
            [
              -1,
              0
            ],
            [
              -1,
              1
            ],
            [
              -1,
              2
            ],
            [
              -1,
              3
            ]
          ],
          "prefabId": "skchr_logos_1",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 0,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_logos_2",
          "iconId": "skchr_logos_2",
          "name": "提喻",
          "level": 4,
          "desc": "法术抗性+40，攻击改为锁定一个目标对其每0.5秒造成一次相当于攻击力35%的法术伤害，对相同目标的伤害逐渐提高至3倍并使其移动速度逐渐降低至40%(锁定5秒后达到上限)，被打断或目标倒下时重新索敌且效果重置",
          "descRaw": "法术抗性<@ba.vup>+40</>，攻击改为锁定一个目标对其每<@ba.vup>0.5</>秒造成一次相当于攻击力<@ba.vup>35%</>的法术伤害，对相同目标的伤害逐渐提高至<@ba.vup>3</>倍并使其移动速度逐渐降低至<@ba.vup>40%</>(锁定5秒后达到上限)，被打断或目标倒下时重新索敌且效果重置",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 20,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 39,
          "initSp": 20,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "magic_resistance": 40,
            "attack@cooldown": 0.5,
            "attack@atk_scale_base": 0.35,
            "attack@atk_scale_delta": 0.07,
            "attack@move_speed": -0.06,
            "attack@max_stack_cnt": 10
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_logos_2",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 1,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_logos_3",
          "iconId": "skchr_logos_3",
          "name": "延异视阈",
          "level": 4,
          "desc": "攻击范围扩大，攻击力+160%，同时攻击3个目标，使攻击范围内敌方子弹的飞行速度大幅降低、并在技能结束时将其全部清除",
          "descRaw": "攻击范围<@ba.vup>扩大</>，攻击力<@ba.vup>+160%</>，同时攻击<@ba.vup>3</>个目标，使攻击范围内敌方子弹的飞行速度<@ba.vup>大幅降低</>、并在技能结束时将其全部<@ba.vup>清除</>",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 30,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 45,
          "initSp": 9,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 1.6,
            "attack@max_target": 3,
            "projectile_move_scale": 0.05
          },
          "bbStr": {},
          "rangeId": "3-4",
          "rangeGrid": [
            [
              2,
              0
            ],
            [
              2,
              1
            ],
            [
              2,
              2
            ],
            [
              1,
              0
            ],
            [
              1,
              1
            ],
            [
              1,
              2
            ],
            [
              1,
              3
            ],
            [
              0,
              0
            ],
            [
              0,
              1
            ],
            [
              0,
              2
            ],
            [
              0,
              3
            ],
            [
              -1,
              0
            ],
            [
              -1,
              1
            ],
            [
              -1,
              2
            ],
            [
              -1,
              3
            ],
            [
              -2,
              0
            ],
            [
              -2,
              1
            ],
            [
              -2,
              2
            ]
          ],
          "prefabId": "skchr_logos_3",
          "trigger": {
            "rule": "ACTIVE_RANGE",
            "rawRule": "DEFAULT",
            "customRangeGrid": [
              [
                2,
                0
              ],
              [
                2,
                1
              ],
              [
                2,
                2
              ],
              [
                1,
                0
              ],
              [
                1,
                1
              ],
              [
                1,
                2
              ],
              [
                1,
                3
              ],
              [
                0,
                0
              ],
              [
                0,
                1
              ],
              [
                0,
                2
              ],
              [
                0,
                3
              ],
              [
                -1,
                0
              ],
              [
                -1,
                1
              ],
              [
                -1,
                2
              ],
              [
                -1,
                3
              ],
              [
                -2,
                0
              ],
              [
                -2,
                1
              ],
              [
                -2,
                2
              ]
            ]
          },
          "index": 2,
          "overrideTokenKey": null,
          "isDefault": true
        }
      ],
      "growthKazdel": true
    },
    "chess_char_9_22_b": {
      "chessId": "chess_char_9_22_b",
      "baseId": "chess_char_9_22_a",
      "goldenId": "chess_char_9_22_b",
      "isGolden": true,
      "tier": 6,
      "identifier": 919,
      "isHidden": false,
      "isDiy": false,
      "visible": true,
      "chessType": "NORMAL",
      "backup": {
        "charId": "char_612_accast",
        "tmplId": null,
        "skillIndex": 2,
        "uniEquipId": null,
        "potRank": 0
      },
      "shopSortId": 919,
      "charId": "char_4133_logos",
      "name": "逻各斯",
      "appellation": "Logos",
      "rarity": 6,
      "profession": "CASTER",
      "subProfessionId": "corecaster",
      "subProfessionName": "中坚术师",
      "position": "RANGED",
      "nationId": "rhodes",
      "bonds": [
        "rhodesShip",
        "kazdelShip",
        "visiShip"
      ],
      "garrisonIds": [
        "garrison_c_logos_b"
      ],
      "price": 4,
      "sellPrice": 1,
      "upgradeNum": 0,
      "upgradeChessId": null,
      "status": {
        "phase": 2,
        "level": 60,
        "skillLevel": 7,
        "equipLevel": 3
      },
      "stats": {
        "maxHp": 1710,
        "atk": 726,
        "def": 115,
        "res": 20,
        "cost": 19,
        "blockCnt": 1,
        "bat": 1.6,
        "aspd": 100,
        "respawnTime": 70,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "immunities": {
        "stun": false,
        "silence": false,
        "sleep": false,
        "frozen": false,
        "levitate": false
      },
      "rangeId": "3-1",
      "rangeGrid": [
        [
          1,
          0
        ],
        [
          1,
          1
        ],
        [
          1,
          2
        ],
        [
          0,
          0
        ],
        [
          0,
          1
        ],
        [
          0,
          2
        ],
        [
          0,
          3
        ],
        [
          -1,
          0
        ],
        [
          -1,
          1
        ],
        [
          -1,
          2
        ]
      ],
      "dmgType": "arts",
      "attackKind": "ranged",
      "projectile": "bolt",
      "canHitFly": true,
      "targetPriority": null,
      "trait": {
        "desc": "攻击造成法术伤害",
        "descRaw": "攻击造成<@ba.kw>法术伤害</>",
        "bb": {},
        "bbStr": {},
        "rangeGrid": null,
        "moduleDesc": "造成法术伤害时附带相当于8%伤害的凋亡损伤",
        "moduleDescRaw": "造成法术伤害时附带相当于<@ba.vup>8%</>伤害的<$ba.dt.apoptosis2>凋亡损伤</>"
      },
      "skill": {
        "skillId": "skchr_logos_3",
        "iconId": "skchr_logos_3",
        "name": "延异视阈",
        "level": 7,
        "desc": "攻击范围扩大，攻击力+220%，同时攻击3个目标，使攻击范围内敌方子弹的飞行速度大幅降低、并在技能结束时将其全部清除",
        "descRaw": "攻击范围<@ba.vup>扩大</>，攻击力<@ba.vup>+220%</>，同时攻击<@ba.vup>3</>个目标，使攻击范围内敌方子弹的飞行速度<@ba.vup>大幅降低</>、并在技能结束时将其全部<@ba.vup>清除</>",
        "skillType": "MANUAL",
        "durationType": "NONE",
        "duration": 30,
        "spType": "INCREASE_WITH_TIME",
        "spCost": 45,
        "initSp": 18,
        "maxChargeTime": 1,
        "increment": 1,
        "bb": {
          "atk": 2.2,
          "attack@max_target": 3,
          "projectile_move_scale": 0.05
        },
        "bbStr": {},
        "rangeId": "3-4",
        "rangeGrid": [
          [
            2,
            0
          ],
          [
            2,
            1
          ],
          [
            2,
            2
          ],
          [
            1,
            0
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ],
          [
            1,
            3
          ],
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            0,
            3
          ],
          [
            -1,
            0
          ],
          [
            -1,
            1
          ],
          [
            -1,
            2
          ],
          [
            -1,
            3
          ],
          [
            -2,
            0
          ],
          [
            -2,
            1
          ],
          [
            -2,
            2
          ]
        ],
        "prefabId": "skchr_logos_3",
        "trigger": {
          "rule": "ACTIVE_RANGE",
          "rawRule": "DEFAULT",
          "customRangeGrid": [
            [
              2,
              0
            ],
            [
              2,
              1
            ],
            [
              2,
              2
            ],
            [
              1,
              0
            ],
            [
              1,
              1
            ],
            [
              1,
              2
            ],
            [
              1,
              3
            ],
            [
              0,
              0
            ],
            [
              0,
              1
            ],
            [
              0,
              2
            ],
            [
              0,
              3
            ],
            [
              -1,
              0
            ],
            [
              -1,
              1
            ],
            [
              -1,
              2
            ],
            [
              -1,
              3
            ],
            [
              -2,
              0
            ],
            [
              -2,
              1
            ],
            [
              -2,
              2
            ]
          ]
        },
        "index": 2,
        "overrideTokenKey": null
      },
      "talents": [
        {
          "index": 0,
          "name": "语汇演化",
          "desc": "对一个目标发起攻击时，有60%几率额外对攻击范围内一个随机目标造成相当于攻击力65%（+5%）的法术伤害并使其停顿0.8秒，若该随机目标处于凋亡损伤爆发期间则同时造成相当于攻击力60%的元素伤害",
          "descRaw": "对一个目标发起攻击时，有60%几率额外对攻击范围内一个随机目标造成相当于攻击力65%<@ba.talpu>（+5%）</>的法术伤害并使其<$ba.sluggish>停顿</>0.8秒，若该随机目标处于<$ba.dt.apoptosis2>凋亡损伤</>爆发期间则同时造成相当于攻击力60%的元素伤害",
          "bb": {
            "prob": 0.6,
            "atk_scale": 0.65,
            "sluggish": 0.8,
            "element_atk_scale": 0.6
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": true
        },
        {
          "index": 1,
          "name": "剜魂具辞",
          "desc": "攻击使目标在5秒内法术抗性-10且受到的法术伤害提高165（+15）点",
          "descRaw": "攻击使目标在5秒内法术抗性-10且受到的法术伤害提高165<@ba.talpu>（+15）</>点",
          "bb": {
            "duration": 5,
            "magic_resistance": -10,
            "atk_addition": 165
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": -1,
          "name": null,
          "desc": null,
          "descRaw": null,
          "bb": {
            "ep_damage_ratio": 0.08
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": true,
          "fromModule": true
        }
      ],
      "tokens": [],
      "module": {
        "id": "uniequip_002_logos",
        "name": "来自河谷的笔盒",
        "type": "CCR-D",
        "level": 3,
        "active": true
      },
      "assets": {
        "avatar": "char_4133_logos_2",
        "portrait": "char_4133_logos_2",
        "spine": "char_4133_logos",
        "skillIcon": "skchr_logos_3",
        "subProfIcon": "sub_corecaster_icon"
      },
      "skills": [
        {
          "skillId": "skchr_logos_1",
          "iconId": "skchr_logos_1",
          "name": "殁亡",
          "level": 7,
          "desc": "攻击范围扩大，攻击力+70%，使攻击范围内生命值低于逻各斯攻击力120%的敌人立刻倒下、并对另一个随机目标造成与倒下单位生命值相等的法术伤害\n持续时间无限",
          "descRaw": "攻击范围<@ba.vup>扩大</>，攻击力<@ba.vup>+70%</>，使攻击范围内生命值低于逻各斯攻击力<@ba.vup>120%</>的敌人立刻倒下、并对另一个随机目标造成与倒下单位生命值相等的法术伤害\n<@ba.rem>持续时间无限</>",
          "skillType": "AUTO",
          "durationType": "NONE",
          "duration": -1,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 68,
          "initSp": 0,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 0.7,
            "attack@kill_atk_scale": 1.2,
            "attack@kill_damage": 9999999
          },
          "bbStr": {},
          "rangeId": "3-3",
          "rangeGrid": [
            [
              1,
              0
            ],
            [
              1,
              1
            ],
            [
              1,
              2
            ],
            [
              1,
              3
            ],
            [
              0,
              0
            ],
            [
              0,
              1
            ],
            [
              0,
              2
            ],
            [
              0,
              3
            ],
            [
              -1,
              0
            ],
            [
              -1,
              1
            ],
            [
              -1,
              2
            ],
            [
              -1,
              3
            ]
          ],
          "prefabId": "skchr_logos_1",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 0,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_logos_2",
          "iconId": "skchr_logos_2",
          "name": "提喻",
          "level": 7,
          "desc": "法术抗性+50，攻击改为锁定一个目标对其每0.5秒造成一次相当于攻击力50%的法术伤害，对相同目标的伤害逐渐提高至3倍并使其移动速度逐渐降低至40%(锁定5秒后达到上限)，被打断或目标倒下时重新索敌且效果重置",
          "descRaw": "法术抗性<@ba.vup>+50</>，攻击改为锁定一个目标对其每<@ba.vup>0.5</>秒造成一次相当于攻击力<@ba.vup>50%</>的法术伤害，对相同目标的伤害逐渐提高至<@ba.vup>3</>倍并使其移动速度逐渐降低至<@ba.vup>40%</>(锁定5秒后达到上限)，被打断或目标倒下时重新索敌且效果重置",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 20,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 36,
          "initSp": 20,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "magic_resistance": 50,
            "attack@cooldown": 0.5,
            "attack@atk_scale_base": 0.5,
            "attack@atk_scale_delta": 0.1,
            "attack@move_speed": -0.06,
            "attack@max_stack_cnt": 10
          },
          "bbStr": {},
          "rangeId": null,
          "rangeGrid": null,
          "prefabId": "skchr_logos_2",
          "trigger": {
            "rule": "DEFAULT",
            "rawRule": "DEFAULT",
            "customRangeGrid": null
          },
          "index": 1,
          "overrideTokenKey": null,
          "isDefault": false
        },
        {
          "skillId": "skchr_logos_3",
          "iconId": "skchr_logos_3",
          "name": "延异视阈",
          "level": 7,
          "desc": "攻击范围扩大，攻击力+220%，同时攻击3个目标，使攻击范围内敌方子弹的飞行速度大幅降低、并在技能结束时将其全部清除",
          "descRaw": "攻击范围<@ba.vup>扩大</>，攻击力<@ba.vup>+220%</>，同时攻击<@ba.vup>3</>个目标，使攻击范围内敌方子弹的飞行速度<@ba.vup>大幅降低</>、并在技能结束时将其全部<@ba.vup>清除</>",
          "skillType": "MANUAL",
          "durationType": "NONE",
          "duration": 30,
          "spType": "INCREASE_WITH_TIME",
          "spCost": 45,
          "initSp": 18,
          "maxChargeTime": 1,
          "increment": 1,
          "bb": {
            "atk": 2.2,
            "attack@max_target": 3,
            "projectile_move_scale": 0.05
          },
          "bbStr": {},
          "rangeId": "3-4",
          "rangeGrid": [
            [
              2,
              0
            ],
            [
              2,
              1
            ],
            [
              2,
              2
            ],
            [
              1,
              0
            ],
            [
              1,
              1
            ],
            [
              1,
              2
            ],
            [
              1,
              3
            ],
            [
              0,
              0
            ],
            [
              0,
              1
            ],
            [
              0,
              2
            ],
            [
              0,
              3
            ],
            [
              -1,
              0
            ],
            [
              -1,
              1
            ],
            [
              -1,
              2
            ],
            [
              -1,
              3
            ],
            [
              -2,
              0
            ],
            [
              -2,
              1
            ],
            [
              -2,
              2
            ]
          ],
          "prefabId": "skchr_logos_3",
          "trigger": {
            "rule": "ACTIVE_RANGE",
            "rawRule": "DEFAULT",
            "customRangeGrid": [
              [
                2,
                0
              ],
              [
                2,
                1
              ],
              [
                2,
                2
              ],
              [
                1,
                0
              ],
              [
                1,
                1
              ],
              [
                1,
                2
              ],
              [
                1,
                3
              ],
              [
                0,
                0
              ],
              [
                0,
                1
              ],
              [
                0,
                2
              ],
              [
                0,
                3
              ],
              [
                -1,
                0
              ],
              [
                -1,
                1
              ],
              [
                -1,
                2
              ],
              [
                -1,
                3
              ],
              [
                -2,
                0
              ],
              [
                -2,
                1
              ],
              [
                -2,
                2
              ]
            ]
          },
          "index": 2,
          "overrideTokenKey": null,
          "isDefault": true
        }
      ],
      "statsBase": {
        "maxHp": 1540,
        "atk": 659,
        "def": 115,
        "res": 20,
        "cost": 19,
        "blockCnt": 1,
        "bat": 1.6,
        "aspd": 100,
        "respawnTime": 70,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 1,
        "deckStack": 0
      },
      "traitBase": {
        "desc": "攻击造成法术伤害",
        "descRaw": "攻击造成<@ba.kw>法术伤害</>",
        "bb": {},
        "bbStr": {},
        "rangeGrid": null
      },
      "talentsBase": [
        {
          "index": 0,
          "name": "语汇演化",
          "desc": "对一个目标发起攻击时，有40%几率额外对攻击范围内一个随机目标造成相当于攻击力65%（+5%）的法术伤害并使其停顿0.8秒",
          "descRaw": "对一个目标发起攻击时，有40%几率额外对攻击范围内一个随机目标造成相当于攻击力65%<@ba.talpu>（+5%）</>的法术伤害并使其<$ba.sluggish>停顿</>0.8秒",
          "bb": {
            "prob": 0.4,
            "atk_scale": 0.65,
            "sluggish": 0.8
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        },
        {
          "index": 1,
          "name": "剜魂具辞",
          "desc": "攻击使目标在5秒内法术抗性-10且受到的法术伤害提高165（+15）点",
          "descRaw": "攻击使目标在5秒内法术抗性-10且受到的法术伤害提高165<@ba.talpu>（+15）</>点",
          "bb": {
            "duration": 5,
            "magic_resistance": -10,
            "atk_addition": 165
          },
          "bbStr": {},
          "rangeGrid": null,
          "tokenKey": null,
          "hidden": false,
          "fromModule": false
        }
      ],
      "modules": [
        {
          "uniEquipId": "uniequip_002_logos",
          "name": "来自河谷的笔盒",
          "typeName": "CCR-D",
          "typeIcon": "ccr-d",
          "icon": "uniequip_002_logos",
          "isDefault": true,
          "level": 3,
          "attr": {
            "maxHp": 170,
            "atk": 67
          },
          "traitOverride": {
            "desc": "攻击造成法术伤害",
            "descRaw": "攻击造成<@ba.kw>法术伤害</>",
            "bb": {},
            "bbStr": {},
            "rangeGrid": null,
            "moduleDesc": "造成法术伤害时附带相当于8%伤害的凋亡损伤",
            "moduleDescRaw": "造成法术伤害时附带相当于<@ba.vup>8%</>伤害的<$ba.dt.apoptosis2>凋亡损伤</>"
          },
          "talentChanges": [
            {
              "talentIndex": -1,
              "name": null,
              "desc": null,
              "descRaw": null,
              "bb": {
                "ep_damage_ratio": 0.08
              },
              "bbStr": {},
              "rangeGrid": null,
              "tokenKey": null,
              "hidden": true
            },
            {
              "talentIndex": 0,
              "name": "语汇演化",
              "desc": "对一个目标发起攻击时，有60%几率额外对攻击范围内一个随机目标造成相当于攻击力65%（+5%）的法术伤害并使其停顿0.8秒，若该随机目标处于凋亡损伤爆发期间则同时造成相当于攻击力60%的元素伤害",
              "descRaw": "对一个目标发起攻击时，有60%几率额外对攻击范围内一个随机目标造成相当于攻击力65%<@ba.talpu>（+5%）</>的法术伤害并使其<$ba.sluggish>停顿</>0.8秒，若该随机目标处于<$ba.dt.apoptosis2>凋亡损伤</>爆发期间则同时造成相当于攻击力60%的元素伤害",
              "bb": {
                "prob": 0.6,
                "atk_scale": 0.65,
                "sluggish": 0.8,
                "element_atk_scale": 0.6
              },
              "bbStr": {},
              "rangeGrid": null,
              "tokenKey": null,
              "hidden": false
            }
          ]
        },
        {
          "uniEquipId": "uniequip_003_logos",
          "name": "《语义范式百科》",
          "typeName": "CCR-Y",
          "typeIcon": "ccr-y",
          "icon": "uniequip_003_logos",
          "isDefault": false,
          "level": 3,
          "attr": {
            "atk": 60,
            "res": 5
          },
          "traitOverride": {
            "desc": "攻击造成法术伤害",
            "descRaw": "攻击造成<@ba.kw>法术伤害</>",
            "bb": {
              "sp": 1
            },
            "bbStr": {},
            "rangeGrid": null,
            "moduleDesc": "普通攻击命中精英或领袖敌人时获得1点技力",
            "moduleDescRaw": "普通攻击命中精英或领袖敌人时获得<@ba.kw>1</>点技力"
          },
          "talentChanges": [
            {
              "talentIndex": 0,
              "name": "语汇演化",
              "desc": "对一个目标发起攻击时，有40%几率额外对攻击范围内两个随机目标造成相当于攻击力70%（+5%）的法术伤害并使其停顿0.8秒",
              "descRaw": "对一个目标发起攻击时，有40%几率额外对攻击范围内两个随机目标造成相当于攻击力70%<@ba.talpu>（+5%）</>的法术伤害并使其<$ba.sluggish>停顿</>0.8秒",
              "bb": {
                "prob": 0.4,
                "atk_scale": 0.7,
                "sluggish": 0.8,
                "emit_count": 2
              },
              "bbStr": {},
              "rangeGrid": null,
              "tokenKey": null,
              "hidden": false
            }
          ]
        }
      ],
      "growthKazdel": true
    }
  },
  "tokens": {
    "token_10035_wisdel_wward": {
      "tokenId": "token_10035_wisdel_wward",
      "kind": "summon",
      "name": "魂灵之影",
      "appellation": "Shadow of Revenant",
      "desc": "可攻击维什戴尔攻击范围内的敌人",
      "descRaw": "可攻击维什戴尔攻击范围内的敌人",
      "profession": "TOKEN",
      "subProfessionId": "notchar1",
      "position": "ALL",
      "displayType": "HIDDEN",
      "placeable": false,
      "ownerRange": false,
      "owners": [
        "chess_char_9_10_a",
        "chess_char_9_10_b"
      ],
      "stats": {
        "maxHp": 3500,
        "atk": 660,
        "def": 585,
        "res": 50,
        "cost": 0,
        "blockCnt": 0,
        "bat": 1,
        "aspd": 100,
        "respawnTime": 5,
        "spRecovery": 1,
        "hpRecoveryPerSec": 0,
        "moveSpeed": 1,
        "tauntLevel": 0,
        "massLevel": 0,
        "deployLimit": 3,
        "deckStack": 1
      },
      "rangeGrid": [
        [
          0,
          0
        ]
      ],
      "dmgType": "phys",
      "attackKind": "ranged",
      "projectile": "arrow",
      "canHitFly": true,
      "skill": {
        "skillId": "sktok_wisdel_wward",
        "bb": {
          "sluggish": 1,
          "sp_min": 0,
          "sp_max": 3
        }
      },
      "deployLimit": 3,
      "count": null,
      "abnormal": [],
      "variants": {
        "chess_char_9_10_a": {
          "phase": 2,
          "level": 1,
          "stats": {
            "maxHp": 3500,
            "atk": 660,
            "def": 585,
            "res": 50,
            "cost": 0,
            "blockCnt": 0,
            "bat": 1,
            "aspd": 100,
            "respawnTime": 5,
            "spRecovery": 1,
            "hpRecoveryPerSec": 0,
            "moveSpeed": 1,
            "tauntLevel": 0,
            "massLevel": 0,
            "deployLimit": 3,
            "deckStack": 1
          },
          "immunities": {
            "stun": false,
            "silence": false,
            "sleep": false,
            "frozen": false,
            "levitate": false
          },
          "rangeGrid": [
            [
              0,
              0
            ]
          ],
          "trait": {
            "desc": "可攻击维什戴尔攻击范围内的敌人",
            "descRaw": "可攻击维什戴尔攻击范围内的敌人",
            "bb": {},
            "bbStr": {}
          },
          "dmgType": "phys",
          "attackKind": "ranged",
          "projectile": "arrow",
          "canHitFly": true,
          "targetPriority": null,
          "skill": {
            "skillId": "sktok_wisdel_wward",
            "iconId": "sktok_wisdel_wward",
            "name": "魂灵之影",
            "level": 4,
            "desc": "对一名在维什戴尔攻击范围内的敌人造成法术伤害，对其造成1秒停顿并附着残影，之后获得0-2点技力",
            "descRaw": "对一名在维什戴尔攻击范围内的敌人造成法术伤害，对其造成<@ba.vup>1</>秒<$ba.sluggish>停顿</>并附着残影，之后获得0-2点技力",
            "skillType": "AUTO",
            "durationType": "NONE",
            "duration": 0,
            "spType": "INCREASE_WITH_TIME",
            "spCost": 5,
            "initSp": 0,
            "maxChargeTime": 1,
            "increment": 1,
            "bb": {
              "sluggish": 1,
              "sp_min": 0,
              "sp_max": 3
            },
            "bbStr": {},
            "rangeId": null,
            "rangeGrid": null,
            "prefabId": "sktok_wisdel_wward",
            "trigger": {
              "rule": "DEFAULT",
              "rawRule": "DEFAULT",
              "customRangeGrid": null
            },
            "index": 2
          },
          "talents": [],
          "count": null,
          "sources": [
            "talent",
            "skill",
            "display"
          ],
          "bySkill": {
            "0": {
              "skill": {
                "skillId": "sktok_wisdel_wward",
                "iconId": "sktok_wisdel_wward",
                "name": "魂灵之影",
                "level": 4,
                "desc": "对一名在维什戴尔攻击范围内的敌人造成法术伤害，对其造成1秒停顿并附着残影，之后获得0-2点技力",
                "descRaw": "对一名在维什戴尔攻击范围内的敌人造成法术伤害，对其造成<@ba.vup>1</>秒<$ba.sluggish>停顿</>并附着残影，之后获得0-2点技力",
                "skillType": "AUTO",
                "durationType": "NONE",
                "duration": 0,
                "spType": "INCREASE_WITH_TIME",
                "spCost": 5,
                "initSp": 0,
                "maxChargeTime": 1,
                "increment": 1,
                "bb": {
                  "sluggish": 1,
                  "sp_min": 0,
                  "sp_max": 3
                },
                "bbStr": {},
                "rangeId": null,
                "rangeGrid": null,
                "prefabId": "sktok_wisdel_wward",
                "trigger": {
                  "rule": "DEFAULT",
                  "rawRule": "DEFAULT",
                  "customRangeGrid": null
                },
                "index": 0
              },
              "count": null,
              "sources": [
                "talent",
                "display"
              ]
            },
            "1": {
              "skill": {
                "skillId": "sktok_wisdel_wward",
                "iconId": "sktok_wisdel_wward",
                "name": "魂灵之影",
                "level": 4,
                "desc": "对一名在维什戴尔攻击范围内的敌人造成法术伤害，对其造成1秒停顿并附着残影，之后获得0-2点技力",
                "descRaw": "对一名在维什戴尔攻击范围内的敌人造成法术伤害，对其造成<@ba.vup>1</>秒<$ba.sluggish>停顿</>并附着残影，之后获得0-2点技力",
                "skillType": "AUTO",
                "durationType": "NONE",
                "duration": 0,
                "spType": "INCREASE_WITH_TIME",
                "spCost": 5,
                "initSp": 0,
                "maxChargeTime": 1,
                "increment": 1,
                "bb": {
                  "sluggish": 1,
                  "sp_min": 0,
                  "sp_max": 3
                },
                "bbStr": {},
                "rangeId": null,
                "rangeGrid": null,
                "prefabId": "sktok_wisdel_wward",
                "trigger": {
                  "rule": "DEFAULT",
                  "rawRule": "DEFAULT",
                  "customRangeGrid": null
                },
                "index": 1
              },
              "count": null,
              "sources": [
                "talent",
                "display"
              ]
            }
          }
        },
        "chess_char_9_10_b": {
          "phase": 2,
          "level": 60,
          "stats": {
            "maxHp": 3500,
            "atk": 738,
            "def": 628,
            "res": 50,
            "cost": 0,
            "blockCnt": 0,
            "bat": 1,
            "aspd": 100,
            "respawnTime": 5,
            "spRecovery": 1,
            "hpRecoveryPerSec": 0,
            "moveSpeed": 1,
            "tauntLevel": 0,
            "massLevel": 0,
            "deployLimit": 3,
            "deckStack": 1
          },
          "immunities": {
            "stun": false,
            "silence": false,
            "sleep": false,
            "frozen": false,
            "levitate": false
          },
          "rangeGrid": [
            [
              0,
              0
            ]
          ],
          "trait": {
            "desc": "可攻击维什戴尔攻击范围内的敌人",
            "descRaw": "可攻击维什戴尔攻击范围内的敌人",
            "bb": {},
            "bbStr": {}
          },
          "dmgType": "phys",
          "attackKind": "ranged",
          "projectile": "arrow",
          "canHitFly": true,
          "targetPriority": null,
          "skill": {
            "skillId": "sktok_wisdel_wward",
            "iconId": "sktok_wisdel_wward",
            "name": "魂灵之影",
            "level": 7,
            "desc": "对一名在维什戴尔攻击范围内的敌人造成法术伤害，对其造成1秒停顿并附着残影，之后获得0-2点技力",
            "descRaw": "对一名在维什戴尔攻击范围内的敌人造成法术伤害，对其造成<@ba.vup>1</>秒<$ba.sluggish>停顿</>并附着残影，之后获得0-2点技力",
            "skillType": "AUTO",
            "durationType": "NONE",
            "duration": 0,
            "spType": "INCREASE_WITH_TIME",
            "spCost": 5,
            "initSp": 0,
            "maxChargeTime": 1,
            "increment": 1,
            "bb": {
              "sluggish": 1,
              "sp_min": 0,
              "sp_max": 3
            },
            "bbStr": {},
            "rangeId": null,
            "rangeGrid": null,
            "prefabId": "sktok_wisdel_wward",
            "trigger": {
              "rule": "DEFAULT",
              "rawRule": "DEFAULT",
              "customRangeGrid": null
            },
            "index": 2
          },
          "talents": [],
          "count": null,
          "sources": [
            "talent",
            "skill",
            "display"
          ],
          "bySkill": {
            "0": {
              "skill": {
                "skillId": "sktok_wisdel_wward",
                "iconId": "sktok_wisdel_wward",
                "name": "魂灵之影",
                "level": 7,
                "desc": "对一名在维什戴尔攻击范围内的敌人造成法术伤害，对其造成1秒停顿并附着残影，之后获得0-2点技力",
                "descRaw": "对一名在维什戴尔攻击范围内的敌人造成法术伤害，对其造成<@ba.vup>1</>秒<$ba.sluggish>停顿</>并附着残影，之后获得0-2点技力",
                "skillType": "AUTO",
                "durationType": "NONE",
                "duration": 0,
                "spType": "INCREASE_WITH_TIME",
                "spCost": 5,
                "initSp": 0,
                "maxChargeTime": 1,
                "increment": 1,
                "bb": {
                  "sluggish": 1,
                  "sp_min": 0,
                  "sp_max": 3
                },
                "bbStr": {},
                "rangeId": null,
                "rangeGrid": null,
                "prefabId": "sktok_wisdel_wward",
                "trigger": {
                  "rule": "DEFAULT",
                  "rawRule": "DEFAULT",
                  "customRangeGrid": null
                },
                "index": 0
              },
              "count": null,
              "sources": [
                "talent",
                "display"
              ]
            },
            "1": {
              "skill": {
                "skillId": "sktok_wisdel_wward",
                "iconId": "sktok_wisdel_wward",
                "name": "魂灵之影",
                "level": 7,
                "desc": "对一名在维什戴尔攻击范围内的敌人造成法术伤害，对其造成1秒停顿并附着残影，之后获得0-2点技力",
                "descRaw": "对一名在维什戴尔攻击范围内的敌人造成法术伤害，对其造成<@ba.vup>1</>秒<$ba.sluggish>停顿</>并附着残影，之后获得0-2点技力",
                "skillType": "AUTO",
                "durationType": "NONE",
                "duration": 0,
                "spType": "INCREASE_WITH_TIME",
                "spCost": 5,
                "initSp": 0,
                "maxChargeTime": 1,
                "increment": 1,
                "bb": {
                  "sluggish": 1,
                  "sp_min": 0,
                  "sp_max": 3
                },
                "bbStr": {},
                "rangeId": null,
                "rangeGrid": null,
                "prefabId": "sktok_wisdel_wward",
                "trigger": {
                  "rule": "DEFAULT",
                  "rawRule": "DEFAULT",
                  "customRangeGrid": null
                },
                "index": 1
              },
              "count": null,
              "sources": [
                "talent",
                "display"
              ]
            }
          },
          "byModule": {
            "none": {
              "stats": {
                "maxHp": 3500,
                "atk": 738,
                "def": 628,
                "res": 50,
                "cost": 0,
                "blockCnt": 0,
                "bat": 1,
                "aspd": 100,
                "respawnTime": 5,
                "spRecovery": 1,
                "hpRecoveryPerSec": 0,
                "moveSpeed": 1,
                "tauntLevel": 0,
                "massLevel": 0,
                "deployLimit": 3,
                "deckStack": 1
              },
              "immunities": {
                "stun": false,
                "silence": false,
                "sleep": false,
                "frozen": false,
                "levitate": false
              },
              "trait": {
                "desc": "可攻击维什戴尔攻击范围内的敌人",
                "descRaw": "可攻击维什戴尔攻击范围内的敌人",
                "bb": {},
                "bbStr": {}
              },
              "talents": []
            }
          }
        }
      },
      "assets": {
        "avatar": "token_10035_wisdel_wward",
        "spine": "token_10035_wisdel_wward"
      }
    }
  },
  "items": {
    "chess_item_c_01_e_a": {
      "id": "chess_item_c_01_e_a",
      "baseId": "chess_item_c_01_e_a",
      "goldenId": "chess_item_c_01_e_b",
      "isGolden": false,
      "trapId": "trap_c_01",
      "iconId": "trap_c_01",
      "identifier": 901,
      "name": "萨卡兹的断角",
      "itemType": "EQUIP",
      "tier": 3,
      "shopSortId": 900,
      "price": 2,
      "hideInShop": false,
      "shopExcluded": false,
      "shopExcludedBy": null,
      "mergeable": true,
      "upgradeNum": 2,
      "upgradeChessId": "chess_item_c_01_e_b",
      "duration": -1,
      "giveBondId": "kazdelShip",
      "givePowerId": null,
      "canGiveBond": false,
      "requiresBondId": null,
      "effectId": "eff_kazdel_horn",
      "effectName": "萨卡兹的断角",
      "desc": "攻击力+20%，生命值+20%",
      "descRaw": "攻击力<@ba.vup>+20%</>，生命值<@ba.vup>+20%</>",
      "buffs": [
        {
          "key": "env_gbuff_new_with_verify",
          "countType": "NONE",
          "bb": {
            "atk": 0.2,
            "max_hp": 0.2
          },
          "bbStr": {
            "key": "attr_common_global_buff"
          }
        }
      ],
      "params": {
        "atk": 0.2,
        "max_hp": 0.2,
        "key": "attr_common_global_buff"
      },
      "category": "STAT",
      "kind": "passive",
      "family": null,
      "implFormula": "Carrier ATK% += atk and max HP% += max_hp (directMods, additive with every other percentage).",
      "note": null,
      "rangeGrid": [
        [
          0,
          0
        ]
      ],
      "flavor": "折断的萨卡兹之角，仍存留着古老的怒意。"
    },
    "chess_item_c_01_e_b": {
      "id": "chess_item_c_01_e_b",
      "baseId": "chess_item_c_01_e_a",
      "goldenId": "chess_item_c_01_e_b",
      "isGolden": true,
      "trapId": "trap_c_01",
      "iconId": "trap_c_01",
      "identifier": 902,
      "name": "萨卡兹的断角",
      "itemType": "EQUIP",
      "tier": 3,
      "shopSortId": 900,
      "price": 2,
      "hideInShop": true,
      "shopExcluded": true,
      "shopExcludedBy": "golden",
      "mergeable": false,
      "upgradeNum": 0,
      "upgradeChessId": null,
      "duration": -1,
      "giveBondId": "kazdelShip",
      "givePowerId": null,
      "canGiveBond": false,
      "requiresBondId": null,
      "effectId": "eff_kazdel_horn",
      "effectName": "萨卡兹的断角",
      "desc": "攻击力+50%，生命值+50%",
      "descRaw": "攻击力<@ba.vup>+50%</>，生命值<@ba.vup>+50%</>",
      "buffs": [
        {
          "key": "env_gbuff_new_with_verify",
          "countType": "NONE",
          "bb": {
            "atk": 0.5,
            "max_hp": 0.5
          },
          "bbStr": {
            "key": "attr_common_global_buff"
          }
        }
      ],
      "params": {
        "atk": 0.5,
        "max_hp": 0.5,
        "key": "attr_common_global_buff"
      },
      "category": "STAT",
      "kind": "passive",
      "family": null,
      "implFormula": "Carrier ATK% += atk and max HP% += max_hp (directMods, additive with every other percentage).",
      "note": null,
      "rangeGrid": [
        [
          0,
          0
        ]
      ],
      "flavor": "折断的萨卡兹之角，仍存留着古老的怒意。"
    }
  },
  "bond": {
    "bondId": "kazdelShip",
    "name": "卡兹戴尔",
    "identifier": 101,
    "isCore": true,
    "bondType": "SEASON",
    "bondOrder": 2,
    "powerIdList": [
      "kazdel",
      "sarkaz",
      "babel"
    ],
    "iconId": "icon_kazdelShip",
    "activeCount": 3,
    "thresholds": [
      3,
      6
    ],
    "maxCount": null,
    "thresholdTemplate": "count_threshold_upward",
    "countMode": "BOARD",
    "countsHand": false,
    "countsGoldenOnly": false,
    "activeType": "BATTLE",
    "isActiveInDeck": false,
    "noStack": false,
    "weight": 10,
    "maxInactiveBondCount": -1,
    "layerMilestones": [
      {
        "layer": 100,
        "mode": "every",
        "effect": "bond_layer_added_reward_equip"
      }
    ],
    "desc": "【卡兹戴尔】干员对处于眩晕、停顿、束缚、不动的单位造成的伤害提升（受层数影响）\n<每叠加100层>获得一件“萨卡兹的断角”\n<在场6名不同【卡兹戴尔】干员>所有【卡兹戴尔】干员攻击速度+50，且攻击附带20%攻击力的真实伤害",
    "descRaw": "【卡兹戴尔】干员对处于<@ba.vup>眩晕</>、<@ba.vup>停顿</>、<@ba.vup>束缚</>、<@ba.vup>不动</>的单位造成的伤害<@ba.vup>提升</><@autochess.gray>（受层数影响）</>\n<叠加<@autochess.dgreen>100</>层>获得一件<@ba.vup>“萨卡兹的断角”</>\n<在场<@autochess.dgreen>6</>名不同【卡兹戴尔】干员>所有【卡兹戴尔】干员<@ba.vup>攻击速度+50</>，且攻击附带<@ba.vup>20%</>攻击力的<@ba.vup>真实伤害</>",
    "effectId": "bondeffect_kazdel",
    "effectName": "卡兹戴尔",
    "effectDesc": "【卡兹戴尔】干员对处于眩晕、停顿、束缚、不动的单位造成的伤害+{0:0%}（受层数影响）\n<每叠加100层>获得一件“萨卡兹的断角”\n<在场6名不同【卡兹戴尔】干员>所有【卡兹戴尔】干员攻击速度+50，且攻击附带20%攻击力的真实伤害",
    "effectDescRaw": "【卡兹戴尔】干员对处于<@ba.vup>眩晕</>、<@ba.vup>停顿</>、<@ba.vup>束缚</>、<@ba.vup>不动</>的单位造成的伤害<@ba.vup>+{0:0%}</><@ba.acrem>（受层数影响）</>\n<叠加<@autochess.dgreen>100</>层>获得一件<@ba.vup>“萨卡兹的断角”</>\n<在场<@autochess.dgreen>6</>名不同【卡兹戴尔】干员>所有【卡兹戴尔】干员<@ba.vup>攻击速度+50</>，且攻击附带<@ba.vup>20%</>攻击力的<@ba.vup>真实伤害</>",
    "effectDescParams": [
      {
        "index": 0,
        "format": "0%",
        "base": "base_damage_scale",
        "perStack": "damage_scale_per_stack"
      }
    ],
    "bb": {
      "base_damage_scale": 0.2,
      "damage_scale_per_stack": 0.009,
      "power_bond_char_cnt": 6,
      "bonus_attack_speed": 50,
      "true_damage_scale": 0.2,
      "layer": 100,
      "count": 1
    },
    "bbStr": {
      "key": "act2autochess_bond_eff_kazdel"
    },
    "buffs": [
      {
        "key": "env_gbuff_new",
        "bb": {
          "base_damage_scale": 0.2,
          "damage_scale_per_stack": 0.009,
          "power_bond_char_cnt": 6,
          "bonus_attack_speed": 50,
          "true_damage_scale": 0.2
        },
        "bbStr": {
          "key": "act2autochess_bond_eff_kazdel"
        }
      },
      {
        "key": "bond_layer_added_reward_equip",
        "bb": {
          "layer": 100,
          "count": 1
        },
        "bbStr": {
          "reward_item": "chess_item_c_01_e_a"
        }
      }
    ],
    "baseParams": [
      "base_damage_scale"
    ],
    "perStackParams": [
      "damage_scale_per_stack"
    ],
    "members": [
      "chess_char_4_04_a",
      "chess_char_4_25_a",
      "chess_char_4_26_a",
      "chess_char_5_06_a",
      "chess_char_9_01_a",
      "chess_char_9_02_a",
      "chess_char_9_04_a",
      "chess_char_9_06_a",
      "chess_char_9_09_a",
      "chess_char_9_10_a",
      "chess_char_9_22_a"
    ],
    "visibleMembers": [
      "chess_char_4_04_a",
      "chess_char_4_25_a",
      "chess_char_4_26_a",
      "chess_char_5_06_a",
      "chess_char_9_01_a",
      "chess_char_9_02_a",
      "chess_char_9_04_a",
      "chess_char_9_06_a",
      "chess_char_9_09_a",
      "chess_char_9_10_a",
      "chess_char_9_22_a"
    ],
    "spec": {
      "tiers": [
        {
          "need": "3 distinct",
          "effect": "卡兹戴尔 members deal +20% + 0.9%×L damage to 眩晕/停顿/束缚/不动 enemies."
        },
        {
          "need": "6 distinct",
          "effect": "All 卡兹戴尔 members +50 ASPD and their attacks deal 20% of ATK as TRUE damage."
        },
        {
          "need": "every 100 layers",
          "effect": "Gain one 萨卡兹的断角 (chess_item_c_01_e_a)."
        }
      ]
    }
  }
};
