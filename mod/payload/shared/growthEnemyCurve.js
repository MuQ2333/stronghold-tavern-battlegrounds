// Maintainer workbook 2026-10-23; only explicit edits override the incoming content set.
// Source SHA256: 083c8020eb44de090cfacb070eb4518e34ef891c489a192241ebabebf64904ab
const ROUND_EDITS = {
  "mode_single_hard": {
    "8": {
      "hp": 1
    },
    "9": {
      "hp": 2,
      "atk": 1
    },
    "10": {
      "hp": 5,
      "atk": 1
    },
    "11": {
      "hp": 10,
      "atk": 1.2
    },
    "12": {
      "hp": 20,
      "atk": 1.5
    },
    "13": {
      "hp": 50,
      "atk": 2
    },
    "14": {
      "hp": 120,
      "atk": 3
    },
    "15": {
      "hp": 250,
      "atk": 4
    }
  },
  "mode_single_abyss": {
    "7": {
      "hp": 2,
      "atk": 1.5
    },
    "8": {
      "hp": 3,
      "atk": 1.8
    },
    "9": {
      "hp": 6,
      "atk": 2
    },
    "10": {
      "hp": 10,
      "atk": 2.3
    },
    "11": {
      "hp": 20,
      "atk": 2.7
    },
    "12": {
      "hp": 50,
      "atk": 3
    },
    "13": {
      "hp": 100,
      "atk": 3.5
    },
    "14": {
      "hp": 200,
      "atk": 4
    },
    "15": {
      "hp": 400,
      "atk": 5
    }
  },
  "mode_multi_hard": {
    "7": {
      "hp": 2
    },
    "8": {
      "hp": 3,
      "atk": 1.5
    },
    "9": {
      "hp": 5,
      "atk": 1.6
    },
    "10": {
      "hp": 14,
      "atk": 1.8
    },
    "11": {
      "hp": 30,
      "atk": 2
    },
    "12": {
      "hp": 60,
      "atk": 2.2
    },
    "13": {
      "hp": 130,
      "atk": 2.5
    },
    "14": {
      "hp": 250,
      "atk": 3
    },
    "15": {
      "hp": 500,
      "atk": 4
    }
  },
  "mode_multi_abyss": {
    "7": {
      "hp": 3.5
    },
    "8": {
      "hp": 5
    },
    "9": {
      "hp": 8,
      "atk": 1.8
    },
    "10": {
      "hp": 20,
      "atk": 2
    },
    "11": {
      "hp": 40,
      "atk": 2.3
    },
    "12": {
      "hp": 100,
      "atk": 2.7
    },
    "13": {
      "hp": 200,
      "atk": 3
    },
    "14": {
      "hp": 400,
      "atk": 3.5
    },
    "15": {
      "hp": 800,
      "atk": 4
    }
  }
};
export function growthEnemyScale(modeId, incoming) {
  const edits=ROUND_EDITS[modeId];
  if(!edits||!incoming)return incoming;
  const out={...incoming};
  for(const [r,edit] of Object.entries(edits)) {
    const old=incoming[r];if(!old)continue;
    const next={...old,...edit};
    // The workbook keeps the separate multi-ABYSS hit-count table unchanged.
    // Preserve its effective HP by using the existing exclusion divisor, including Forge input values.
    if(modeId==='mode_multi_abyss' && edit.hp!=null && old.hp>0) {
      next.supplyHp=edit.hp/(old.hp/(old.supplyHp||1));
    }
    out[r]=next;
  }
  return out;
}

// Latest direct confirmation supersedes the workbook's solo values and the 50/100 notes.
export function growthBossHp(modeId,original) {
  return Object.hasOwn(ROUND_EDITS,modeId)?original*100:original;
}
