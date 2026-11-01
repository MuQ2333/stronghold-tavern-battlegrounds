// Mode-only asset metadata. Meteorite clips are parsed from her actual Front/Back skeletons by the native pipeline.
// Official client art is distributed separately; no image/model bytes are stored in this module.
export const GROWTH_KAZDEL_ASSETS = {
  "chars": {
    "char_219_meteo": {
      "avatar": "/assets/growth/char/avatar/char_219_meteo.png",
      "avatarE2": "/assets/growth/char/avatar/char_219_meteo_2.png",
      "portrait": "/assets/growth/char/portrait/char_219_meteo_1.png",
      "portraitE2": "/assets/growth/char/portrait/char_219_meteo_2.png",
      "spine": {
        "front": {
          "skel": "/assets/growth/spine/op/char_219_meteo/front/char_219_meteo.skel",
          "atlas": "/assets/growth/spine/op/char_219_meteo/front/char_219_meteo.atlas",
          "textures": [
            "/assets/growth/spine/op/char_219_meteo/front/char_219_meteo.png"
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
              "loop": "Skill",
              "end": null,
              "index": 1,
              "idle": null
            },
            "die": "Die",
            "move": null,
            "stun": null,
            "skills": {
              "0": {
                "begin": null,
                "loop": "Skill",
                "end": null,
                "index": 0,
                "idle": null
              },
              "1": {
                "begin": null,
                "loop": "Skill",
                "end": null,
                "index": 1,
                "idle": null
              }
            }
          },
          "animations": {
            "Attack": 0.967,
            "Default": 0,
            "Die": 1,
            "Idle": 2,
            "Skill": 1.033,
            "Start": 1
          },
          "events": [
            "OnAttack",
            "OnStart"
          ],
          "hits": {
            "Attack": [
              0.267
            ],
            "Skill": [
              0.4
            ]
          },
          "bounds": {
            "x": -144.963,
            "y": -0.006,
            "width": 373.419,
            "height": 361.466
          }
        },
        "back": {
          "skel": "/assets/growth/spine/op/char_219_meteo/back/char_219_meteo.skel",
          "atlas": "/assets/growth/spine/op/char_219_meteo/back/char_219_meteo.atlas",
          "textures": [
            "/assets/growth/spine/op/char_219_meteo/back/char_219_meteo.png"
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
              "loop": "Skill",
              "end": null,
              "index": 1,
              "idle": null
            },
            "die": null,
            "move": null,
            "stun": null,
            "skills": {
              "0": {
                "begin": null,
                "loop": "Skill",
                "end": null,
                "index": 0,
                "idle": null
              },
              "1": {
                "begin": null,
                "loop": "Skill",
                "end": null,
                "index": 1,
                "idle": null
              }
            }
          },
          "animations": {
            "Attack": 0.967,
            "Default": 0,
            "Idle": 2,
            "Skill": 0.967,
            "Start": 1
          },
          "events": [
            "OnAttack",
            "OnStart"
          ],
          "hits": {
            "Attack": [
              0.267
            ],
            "Skill": [
              0.267
            ]
          },
          "bounds": null
        }
      }
    }
  },
  "skills": {
    "skchr_meteo_2": "/assets/growth/skill/skchr_meteo_2.png",
    "skchr_meteo_1": "/assets/growth/skill/skchr_meteo_1.png"
  },
  "skillsById": {
    "skchr_meteo_2": "skchr_meteo_2",
    "skchr_meteo_1": "skchr_meteo_1"
  },
  "bonds": {
    "kazdelShip": "/assets/growth/kazdel.png"
  },
  "items": {
    "trap_c_01": "/assets/growth/horn.png"
  }
};
