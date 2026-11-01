// Parsed from Blue Poison's actual Front/Back skeletons; binary game art stays in ignored public/assets.
export const GROWTH_BLUE_POISON_ASSETS={
  "chars": {
    "char_129_bluep": {
      "avatar": "/assets/growth-bluepoison/char/avatar/char_129_bluep.png",
      "avatarE2": "/assets/growth-bluepoison/char/avatar/char_129_bluep_2.png",
      "portrait": "/assets/growth-bluepoison/char/portrait/char_129_bluep_1.png",
      "portraitE2": "/assets/growth-bluepoison/char/portrait/char_129_bluep_2.png",
      "spine": {
        "front": {
          "skel": "/assets/growth-bluepoison/spine/op/char_129_bluep/front/char_129_bluep.skel",
          "atlas": "/assets/growth-bluepoison/spine/op/char_129_bluep/front/char_129_bluep.atlas",
          "textures": [
            "/assets/growth-bluepoison/spine/op/char_129_bluep/front/char_129_bluep.png"
          ],
          "pma": false,
          "anims": {
            "idle": "Idle",
            "deploy": "Start",
            "attack": {
              "begin": null,
              "loop": "Attack",
              "end": null
            },
            "attackDown": null,
            "skill": {
              "begin": null,
              "loop": "Attack",
              "end": null,
              "via": "attack",
              "index": 1,
              "idle": null
            },
            "die": "Die",
            "move": null,
            "stun": null,
            "skills": {
              "0": {
                "begin": null,
                "loop": "Attack",
                "end": null,
                "via": "attack",
                "index": 0,
                "idle": null
              },
              "1": {
                "begin": null,
                "loop": "Attack",
                "end": null,
                "via": "attack",
                "index": 1,
                "idle": null
              }
            }
          },
          "animations": {
            "Attack": 1,
            "Default": 0,
            "Die": 1,
            "Idle": 4,
            "Start": 1
          },
          "events": [
            "OnAttack",
            "OnStart"
          ],
          "hits": {
            "Attack": [
              0.5
            ]
          },
          "bounds": {
            "x": -108.806,
            "y": -4.27,
            "width": 297.184,
            "height": 381.5
          }
        },
        "back": {
          "skel": "/assets/growth-bluepoison/spine/op/char_129_bluep/back/char_129_bluep.skel",
          "atlas": "/assets/growth-bluepoison/spine/op/char_129_bluep/back/char_129_bluep.atlas",
          "textures": [
            "/assets/growth-bluepoison/spine/op/char_129_bluep/back/char_129_bluep.png"
          ],
          "pma": false,
          "anims": {
            "idle": "Idle",
            "deploy": "Start",
            "attack": {
              "begin": null,
              "loop": "Attack",
              "end": null
            },
            "attackDown": null,
            "skill": {
              "begin": null,
              "loop": "Attack",
              "end": null,
              "via": "attack",
              "index": 1,
              "idle": null
            },
            "die": null,
            "move": null,
            "stun": null,
            "skills": {
              "0": {
                "begin": null,
                "loop": "Attack",
                "end": null,
                "via": "attack",
                "index": 0,
                "idle": null
              },
              "1": {
                "begin": null,
                "loop": "Attack",
                "end": null,
                "via": "attack",
                "index": 1,
                "idle": null
              }
            }
          },
          "animations": {
            "Attack": 1,
            "Default": 0,
            "Idle": 1,
            "Start": 1
          },
          "events": [
            "OnAttack",
            "OnStart"
          ],
          "hits": {
            "Attack": [
              0.5
            ]
          },
          "bounds": {
            "x": -109.383,
            "y": -2.597,
            "width": 305.023,
            "height": 382.002
          }
        }
      }
    }
  },
  "skills": {
    "skchr_bluep_2": "/assets/growth-bluepoison/skill/skchr_bluep_2.png",
    "skchr_bluep_1": "/assets/growth-bluepoison/skill/skchr_bluep_1.png"
  },
  "audio": {
    "voice": {
      "char_129_bluep": {
        "start": "/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_019.mp3",
        "faceEnemy": "/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_020.mp3",
        "select": [
          "/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_021.mp3",
          "/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_022.mp3"
        ],
        "place": [
          "/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_023.mp3",
          "/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_024.mp3"
        ],
        "skill1": "/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_025.mp3",
        "skill2": "/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_026.mp3",
        "skill3": "/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_027.mp3",
        "skill4": "/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_028.mp3",
        "resultFour": "/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_029.mp3",
        "resultThree": "/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_030.mp3",
        "resultTwo": "/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_031.mp3",
        "resultLose": "/assets/growth-bluepoison/audio/voice/cn/char_129_bluep/cn_032.mp3"
      }
    },
    "voiceJp": {
      "char_129_bluep": {
        "start": "/assets/growth-bluepoison/audio/voice/jp/char_129_bluep/cn_019.mp3",
        "faceEnemy": "/assets/growth-bluepoison/audio/voice/jp/char_129_bluep/cn_020.mp3",
        "select": [
          "/assets/growth-bluepoison/audio/voice/jp/char_129_bluep/cn_021.mp3",
          "/assets/growth-bluepoison/audio/voice/jp/char_129_bluep/cn_022.mp3"
        ],
        "place": [
          "/assets/growth-bluepoison/audio/voice/jp/char_129_bluep/cn_023.mp3",
          "/assets/growth-bluepoison/audio/voice/jp/char_129_bluep/cn_024.mp3"
        ],
        "skill1": "/assets/growth-bluepoison/audio/voice/jp/char_129_bluep/cn_025.mp3",
        "skill2": "/assets/growth-bluepoison/audio/voice/jp/char_129_bluep/cn_026.mp3",
        "skill3": "/assets/growth-bluepoison/audio/voice/jp/char_129_bluep/cn_027.mp3",
        "skill4": "/assets/growth-bluepoison/audio/voice/jp/char_129_bluep/cn_028.mp3",
        "resultFour": "/assets/growth-bluepoison/audio/voice/jp/char_129_bluep/cn_029.mp3",
        "resultThree": "/assets/growth-bluepoison/audio/voice/jp/char_129_bluep/cn_030.mp3",
        "resultTwo": "/assets/growth-bluepoison/audio/voice/jp/char_129_bluep/cn_031.mp3",
        "resultLose": "/assets/growth-bluepoison/audio/voice/jp/char_129_bluep/cn_032.mp3"
      }
    },
    "voiceEn": {
      "char_129_bluep": {
        "start": "/assets/growth-bluepoison/audio/voice/en/char_129_bluep/cn_019.mp3",
        "faceEnemy": "/assets/growth-bluepoison/audio/voice/en/char_129_bluep/cn_020.mp3",
        "select": [
          "/assets/growth-bluepoison/audio/voice/en/char_129_bluep/cn_021.mp3",
          "/assets/growth-bluepoison/audio/voice/en/char_129_bluep/cn_022.mp3"
        ],
        "place": [
          "/assets/growth-bluepoison/audio/voice/en/char_129_bluep/cn_023.mp3",
          "/assets/growth-bluepoison/audio/voice/en/char_129_bluep/cn_024.mp3"
        ],
        "skill1": "/assets/growth-bluepoison/audio/voice/en/char_129_bluep/cn_025.mp3",
        "skill2": "/assets/growth-bluepoison/audio/voice/en/char_129_bluep/cn_026.mp3",
        "skill3": "/assets/growth-bluepoison/audio/voice/en/char_129_bluep/cn_027.mp3",
        "skill4": "/assets/growth-bluepoison/audio/voice/en/char_129_bluep/cn_028.mp3",
        "resultFour": "/assets/growth-bluepoison/audio/voice/en/char_129_bluep/cn_029.mp3",
        "resultThree": "/assets/growth-bluepoison/audio/voice/en/char_129_bluep/cn_030.mp3",
        "resultTwo": "/assets/growth-bluepoison/audio/voice/en/char_129_bluep/cn_031.mp3",
        "resultLose": "/assets/growth-bluepoison/audio/voice/en/char_129_bluep/cn_032.mp3"
      }
    },
    "voiceKr": {
      "char_129_bluep": {
        "start": "/assets/growth-bluepoison/audio/voice/kr/char_129_bluep/cn_019.mp3",
        "faceEnemy": "/assets/growth-bluepoison/audio/voice/kr/char_129_bluep/cn_020.mp3",
        "select": [
          "/assets/growth-bluepoison/audio/voice/kr/char_129_bluep/cn_021.mp3",
          "/assets/growth-bluepoison/audio/voice/kr/char_129_bluep/cn_022.mp3"
        ],
        "place": [
          "/assets/growth-bluepoison/audio/voice/kr/char_129_bluep/cn_023.mp3",
          "/assets/growth-bluepoison/audio/voice/kr/char_129_bluep/cn_024.mp3"
        ],
        "skill1": "/assets/growth-bluepoison/audio/voice/kr/char_129_bluep/cn_025.mp3",
        "skill2": "/assets/growth-bluepoison/audio/voice/kr/char_129_bluep/cn_026.mp3",
        "skill3": "/assets/growth-bluepoison/audio/voice/kr/char_129_bluep/cn_027.mp3",
        "skill4": "/assets/growth-bluepoison/audio/voice/kr/char_129_bluep/cn_028.mp3",
        "resultFour": "/assets/growth-bluepoison/audio/voice/kr/char_129_bluep/cn_029.mp3",
        "resultThree": "/assets/growth-bluepoison/audio/voice/kr/char_129_bluep/cn_030.mp3",
        "resultTwo": "/assets/growth-bluepoison/audio/voice/kr/char_129_bluep/cn_031.mp3",
        "resultLose": "/assets/growth-bluepoison/audio/voice/kr/char_129_bluep/cn_032.mp3"
      }
    },
    "voiceNativeLangType": {}
  }
};
