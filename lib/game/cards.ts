import type { PlantDefinition } from "../types";

export const EXPANDED_DECK: PlantDefinition[] = [
  {
    "id": "moon-willow-2-1",
    "key": "moon-willow-2",
    "name": "Moon Willow",
    "cost": {
      "water": 1,
      "compost": 1,
      "mineral": 1
    },
    "points": 2,
    "maxSunTokens": 6,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "choice",
          "options": [
            {
              "label": "Gain 1 mineral",
              "effects": [
                {
                  "type": "gainResource",
                  "resource": "mineral",
                  "amount": 1
                }
              ]
            },
            {
              "label": "Gain 1 sunlight",
              "effects": [
                {
                  "type": "gainSunlight",
                  "amount": 1
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    "id": "star-bloom-2",
    "key": "star-bloom",
    "name": "Star Bloom",
    "cost": {
      "compost": 1,
      "pollinator": 1,
      "mineral": 1,
      "trellis": 1
    },
    "points": 9,
    "maxSunTokens": 5,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ]
  },
  {
    "id": "silver-bloom-3",
    "key": "silver-bloom",
    "name": "Silver Bloom",
    "cost": {
      "water": 1,
      "mineral": 2,
      "trellis": 1
    },
    "points": 2,
    "maxSunTokens": 8,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 2
      }
    }
  },
  {
    "id": "star-cactus-4",
    "key": "star-cactus",
    "name": "Star Cactus",
    "cost": {
      "water": 1,
      "compost": 1,
      "pollinator": 1,
      "mineral": 1,
      "trellis": 1
    },
    "points": 2,
    "maxSunTokens": 9,
    "biomes": [
      "understory"
    ],
    "onActivate": {
      "type": "groupBenefit",
      "effect": {
        "allPlayersGain": {
          "resource": "compost",
          "amount": 1
        },
        "youGain": {
          "resource": "compost",
          "amount": 2
        }
      }
    }
  },
  {
    "id": "velvet-orchid-2-5",
    "key": "velvet-orchid-2",
    "name": "Velvet Orchid",
    "cost": {
      "compost": 1,
      "pollinator": 2,
      "trellis": 2
    },
    "points": 7,
    "maxSunTokens": 7,
    "biomes": [
      "oasisEdge"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 3
      }
    }
  },
  {
    "id": "thorn-bloom-6",
    "key": "thorn-bloom",
    "name": "Thorn Bloom",
    "cost": {
      "water": 1,
      "compost": 1
    },
    "points": 5,
    "maxSunTokens": 7,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ]
  },
  {
    "id": "amber-aster-7",
    "key": "amber-aster",
    "name": "Amber Aster",
    "cost": {
      "water": 2,
      "compost": 1,
      "pollinator": 1,
      "trellis": 1
    },
    "points": 2,
    "maxSunTokens": 8,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 3
      }
    }
  },
  {
    "id": "dust-willow-8",
    "key": "dust-willow",
    "name": "Dust Willow",
    "cost": {
      "water": 1,
      "compost": 1,
      "pollinator": 1
    },
    "points": 5,
    "maxSunTokens": 6,
    "biomes": [
      "canopy",
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 5,
        "onSuccess": {
          "tuckCards": 2
        }
      }
    }
  },
  {
    "id": "sun-ivy-9",
    "key": "sun-ivy",
    "name": "Sun Ivy",
    "cost": {
      "water": 1,
      "compost": 1,
      "mineral": 1,
      "trellis": 2
    },
    "points": 6,
    "maxSunTokens": 7,
    "biomes": [
      "oasisEdge"
    ],
    "onActivate": {
      "type": "drawCards",
      "effect": {
        "draw": 2
      }
    }
  },
  {
    "id": "dust-vine-4-10",
    "key": "dust-vine-4",
    "name": "Dust Vine",
    "cost": {
      "water": 2,
      "compost": 1
    },
    "points": 1,
    "maxSunTokens": 7,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "choice",
          "options": [
            {
              "label": "Gain 1 pollinator",
              "effects": [
                {
                  "type": "gainResource",
                  "resource": "pollinator",
                  "amount": 1
                }
              ]
            },
            {
              "label": "Gain 1 sunlight",
              "effects": [
                {
                  "type": "gainSunlight",
                  "amount": 1
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    "id": "amber-willow-11",
    "key": "amber-willow",
    "name": "Amber Willow",
    "cost": {
      "water": 2,
      "compost": 1,
      "trellis": 1
    },
    "points": 2,
    "maxSunTokens": 10,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 2
      }
    }
  },
  {
    "id": "velvet-moss-12",
    "key": "velvet-moss",
    "name": "Velvet Moss",
    "cost": {
      "water": 2,
      "trellis": 1
    },
    "points": 3,
    "maxSunTokens": 6,
    "biomes": [
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 4,
        "onSuccess": {
          "tuckCards": 1
        }
      }
    }
  },
  {
    "id": "golden-willow-13",
    "key": "golden-willow",
    "name": "Golden Willow",
    "cost": {
      "water": 2,
      "trellis": 1
    },
    "points": 3,
    "maxSunTokens": 5,
    "biomes": [
      "canopy",
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 7,
        "onSuccess": {
          "tuckCards": 1
        }
      }
    }
  },
  {
    "id": "ghost-willow-2-14",
    "key": "ghost-willow-2",
    "name": "Ghost Willow",
    "cost": {
      "water": 3,
      "trellis": 1
    },
    "points": 2,
    "maxSunTokens": 8,
    "biomes": [
      "canopy"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 4,
        "onSuccess": {
          "tuckCards": 1
        }
      }
    }
  },
  {
    "id": "shade-bloom-5-15",
    "key": "shade-bloom-5",
    "name": "Shade Bloom",
    "cost": {
      "compost": 1,
      "pollinator": 1,
      "trellis": 3
    },
    "points": 7,
    "maxSunTokens": 10,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "gainResource",
          "resource": "trellis",
          "amount": 1
        }
      ]
    }
  },
  {
    "id": "cinder-willow-16",
    "key": "cinder-willow",
    "name": "Cinder Willow",
    "cost": {
      "water": 1,
      "compost": 2,
      "mineral": 2
    },
    "points": 1,
    "maxSunTokens": 6,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onActivate": {
      "type": "groupBenefit",
      "effect": {
        "allPlayersGain": {
          "resource": "compost",
          "amount": 1
        },
        "youGain": {
          "resource": "compost",
          "amount": 1
        }
      }
    }
  },
  {
    "id": "thorn-aster-17",
    "key": "thorn-aster",
    "name": "Thorn Aster",
    "cost": {
      "water": 1,
      "compost": 1,
      "mineral": 1,
      "trellis": 1
    },
    "points": 1,
    "maxSunTokens": 7,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "groupBenefit",
      "effect": {
        "allPlayersGain": {
          "resource": "water",
          "amount": 1
        },
        "youGain": {
          "resource": "water",
          "amount": 1
        }
      }
    }
  },
  {
    "id": "thorn-willow-3-18",
    "key": "thorn-willow-3",
    "name": "Thorn Willow",
    "cost": {
      "water": 2,
      "mineral": 1,
      "trellis": 2
    },
    "points": 7,
    "maxSunTokens": 8,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 4,
        "onSuccess": {
          "tuckCards": 1
        }
      }
    }
  },
  {
    "id": "silver-fern-19",
    "key": "silver-fern",
    "name": "Silver Fern",
    "cost": {
      "water": 2,
      "pollinator": 2,
      "mineral": 1
    },
    "points": 5,
    "maxSunTokens": 9,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 5,
        "onSuccess": {
          "tuckCards": 2
        }
      }
    }
  },
  {
    "id": "sun-moss-20",
    "key": "sun-moss",
    "name": "Sun Moss",
    "cost": {
      "mineral": 1,
      "trellis": 4,
      "wild": 1
    },
    "points": 9,
    "maxSunTokens": 10,
    "biomes": [
      "oasisEdge",
      "understory"
    ]
  },
  {
    "id": "sword-vine-2-21",
    "key": "sword-vine-2",
    "name": "Sword Vine",
    "cost": {
      "water": 2,
      "compost": 2,
      "pollinator": 1,
      "trellis": 1
    },
    "points": 5,
    "maxSunTokens": 9,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onActivate": {
      "type": "drawCards",
      "effect": {
        "draw": 2
      }
    }
  },
  {
    "id": "thorn-reed-22",
    "key": "thorn-reed",
    "name": "Thorn Reed",
    "cost": {
      "compost": 3,
      "pollinator": 1,
      "trellis": 1
    },
    "points": 2,
    "maxSunTokens": 7,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "drawCards",
      "effect": {
        "draw": 3
      }
    }
  },
  {
    "id": "amber-clover-23",
    "key": "amber-clover",
    "name": "Amber Clover",
    "cost": {
      "mineral": 2
    },
    "points": 3,
    "maxSunTokens": 6,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 2
      }
    }
  },
  {
    "id": "river-thistle-24",
    "key": "river-thistle",
    "name": "River Thistle",
    "cost": {
      "pollinator": 2,
      "trellis": 1
    },
    "points": 5,
    "maxSunTokens": 7,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 5,
        "onSuccess": {
          "tuckCards": 1
        }
      }
    }
  },
  {
    "id": "sword-briar-25",
    "key": "sword-briar",
    "name": "Sword Briar",
    "cost": {
      "water": 1,
      "pollinator": 1,
      "mineral": 2,
      "trellis": 1
    },
    "points": 6,
    "maxSunTokens": 8,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "gainResource",
          "resource": "trellis",
          "amount": 1
        }
      ]
    }
  },
  {
    "id": "silver-reed-26",
    "key": "silver-reed",
    "name": "Silver Reed",
    "cost": {
      "water": 1,
      "compost": 1,
      "mineral": 1
    },
    "points": 5,
    "maxSunTokens": 9,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 2
      }
    }
  },
  {
    "id": "amber-willow-2-27",
    "key": "amber-willow-2",
    "name": "Amber Willow",
    "cost": {
      "compost": 1,
      "mineral": 1
    },
    "points": 5,
    "maxSunTokens": 6,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "drawCards",
      "effect": {
        "draw": 1
      }
    }
  },
  {
    "id": "amber-bloom-2-28",
    "key": "amber-bloom-2",
    "name": "Amber Bloom",
    "cost": {
      "compost": 1,
      "trellis": 1
    },
    "points": 2,
    "maxSunTokens": 6,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "choice",
          "options": [
            {
              "label": "Gain 1 compost",
              "effects": [
                {
                  "type": "gainResource",
                  "resource": "compost",
                  "amount": 1
                }
              ]
            },
            {
              "label": "Gain 1 sunlight",
              "effects": [
                {
                  "type": "gainSunlight",
                  "amount": 1
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    "id": "sun-aster-29",
    "key": "sun-aster",
    "name": "Sun Aster",
    "cost": {
      "water": 1,
      "compost": 1,
      "mineral": 1
    },
    "points": 4,
    "maxSunTokens": 5,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 5,
        "onSuccess": {
          "tuckCards": 1
        }
      }
    }
  },
  {
    "id": "ghost-ivy-30",
    "key": "ghost-ivy",
    "name": "Ghost Ivy",
    "cost": {
      "pollinator": 3,
      "trellis": 2,
      "wild": 1
    },
    "points": 8,
    "maxSunTokens": 8,
    "biomes": [
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 5,
        "onSuccess": {
          "tuckCards": 2
        }
      }
    }
  },
  {
    "id": "thorn-orchid-31",
    "key": "thorn-orchid",
    "name": "Thorn Orchid",
    "cost": {
      "compost": 1,
      "pollinator": 1,
      "mineral": 1,
      "trellis": 2
    },
    "points": 8,
    "maxSunTokens": 9,
    "biomes": [
      "canopy",
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 4,
        "onSuccess": {
          "tuckCards": 2
        }
      }
    }
  },
  {
    "id": "ghost-bloom-3-32",
    "key": "ghost-bloom-3",
    "name": "Ghost Bloom",
    "cost": {
      "water": 1,
      "mineral": 1,
      "trellis": 1
    },
    "points": 7,
    "maxSunTokens": 4,
    "biomes": [
      "oasisEdge",
      "understory"
    ]
  },
  {
    "id": "dust-orchid-4-33",
    "key": "dust-orchid-4",
    "name": "Dust Orchid",
    "cost": {
      "compost": 1,
      "mineral": 1,
      "trellis": 1
    },
    "points": 4,
    "maxSunTokens": 7,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 7,
        "onSuccess": {
          "tuckCards": 1
        }
      }
    }
  },
  {
    "id": "silver-orchid-2-34",
    "key": "silver-orchid-2",
    "name": "Silver Orchid",
    "cost": {
      "water": 1,
      "pollinator": 1,
      "trellis": 1
    },
    "points": 3,
    "maxSunTokens": 4,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "choice",
          "options": [
            {
              "label": "Gain 1 water",
              "effects": [
                {
                  "type": "gainResource",
                  "resource": "water",
                  "amount": 1
                }
              ]
            },
            {
              "label": "Gain 1 sunlight",
              "effects": [
                {
                  "type": "gainSunlight",
                  "amount": 1
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    "id": "star-bloom-2-35",
    "key": "star-bloom-2",
    "name": "Star Bloom",
    "cost": {
      "compost": 4,
      "mineral": 1
    },
    "points": 5,
    "maxSunTokens": 6,
    "biomes": [
      "understory"
    ],
    "onActivate": {
      "type": "groupBenefit",
      "effect": {
        "allPlayersGain": {
          "resource": "compost",
          "amount": 1
        },
        "youGain": {
          "resource": "compost",
          "amount": 2
        }
      }
    }
  },
  {
    "id": "amber-bloom-5-36",
    "key": "amber-bloom-5",
    "name": "Amber Bloom",
    "cost": {
      "water": 1,
      "compost": 1,
      "pollinator": 1,
      "trellis": 1
    },
    "points": 7,
    "maxSunTokens": 7,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 2
      }
    }
  },
  {
    "id": "amber-willow-4-37",
    "key": "amber-willow-4",
    "name": "Amber Willow",
    "cost": {
      "water": 1,
      "pollinator": 1,
      "mineral": 2
    },
    "points": 4,
    "maxSunTokens": 10,
    "biomes": [
      "canopy"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 2
      }
    }
  },
  {
    "id": "shade-vine-2-38",
    "key": "shade-vine-2",
    "name": "Shade Vine",
    "cost": {
      "compost": 1
    },
    "points": 3,
    "maxSunTokens": 7,
    "biomes": [
      "understory"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "gainResource",
          "resource": "trellis",
          "amount": 1
        }
      ]
    }
  },
  {
    "id": "ghost-orchid-39",
    "key": "ghost-orchid",
    "name": "Ghost Orchid",
    "cost": {
      "water": 1,
      "compost": 1,
      "pollinator": 1
    },
    "points": 2,
    "maxSunTokens": 7,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "groupBenefit",
      "effect": {
        "allPlayersGain": {
          "resource": "trellis",
          "amount": 1
        },
        "youGain": {
          "resource": "trellis",
          "amount": 1
        }
      }
    }
  },
  {
    "id": "shade-reed-40",
    "key": "shade-reed",
    "name": "Shade Reed",
    "cost": {
      "water": 1,
      "compost": 1,
      "trellis": 1
    },
    "points": 2,
    "maxSunTokens": 8,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "choice",
          "options": [
            {
              "label": "Gain 1 pollinator",
              "effects": [
                {
                  "type": "gainResource",
                  "resource": "pollinator",
                  "amount": 1
                }
              ]
            },
            {
              "label": "Gain 1 sunlight",
              "effects": [
                {
                  "type": "gainSunlight",
                  "amount": 1
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    "id": "amber-bloom-4-41",
    "key": "amber-bloom-4",
    "name": "Amber Bloom",
    "cost": {
      "water": 1,
      "mineral": 1,
      "trellis": 1
    },
    "points": 5,
    "maxSunTokens": 4,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "groupBenefit",
      "effect": {
        "allPlayersGain": {
          "resource": "pollinator",
          "amount": 1
        },
        "youGain": {
          "resource": "pollinator",
          "amount": 1
        }
      }
    }
  },
  {
    "id": "golden-bloom-42",
    "key": "golden-bloom",
    "name": "Golden Bloom",
    "cost": {
      "compost": 2,
      "pollinator": 1,
      "mineral": 1,
      "trellis": 1
    },
    "points": 4,
    "maxSunTokens": 9,
    "biomes": [
      "canopy",
      "understory"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 3
      }
    }
  },
  {
    "id": "silver-orchid-43",
    "key": "silver-orchid",
    "name": "Silver Orchid",
    "cost": {
      "water": 2,
      "compost": 1,
      "pollinator": 1
    },
    "points": 5,
    "maxSunTokens": 8,
    "biomes": [
      "canopy",
      "understory"
    ]
  },
  {
    "id": "velvet-orchid-44",
    "key": "velvet-orchid",
    "name": "Velvet Orchid",
    "cost": {
      "water": 3,
      "trellis": 1
    },
    "points": 5,
    "maxSunTokens": 8,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ]
  },
  {
    "id": "shade-orchid-45",
    "key": "shade-orchid",
    "name": "Shade Orchid",
    "cost": {
      "pollinator": 3,
      "trellis": 1
    },
    "points": 1,
    "maxSunTokens": 5,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "drawCards",
      "effect": {
        "draw": 1
      }
    }
  },
  {
    "id": "dust-vine-2-46",
    "key": "dust-vine-2",
    "name": "Dust Vine",
    "cost": {
      "water": 1,
      "compost": 2,
      "trellis": 1
    },
    "points": 4,
    "maxSunTokens": 10,
    "biomes": [
      "canopy",
      "understory"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 2
      }
    }
  },
  {
    "id": "shade-vine-47",
    "key": "shade-vine",
    "name": "Shade Vine",
    "cost": {
      "mineral": 2,
      "trellis": 1
    },
    "points": 1,
    "maxSunTokens": 6,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "choice",
          "options": [
            {
              "label": "Gain 1 pollinator",
              "effects": [
                {
                  "type": "gainResource",
                  "resource": "pollinator",
                  "amount": 1
                }
              ]
            },
            {
              "label": "Gain 1 sunlight",
              "effects": [
                {
                  "type": "gainSunlight",
                  "amount": 1
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    "id": "dust-vine-3-48",
    "key": "dust-vine-3",
    "name": "Dust Vine",
    "cost": {
      "mineral": 3,
      "trellis": 1
    },
    "points": 4,
    "maxSunTokens": 10,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 2
      }
    }
  },
  {
    "id": "shade-bloom-3-49",
    "key": "shade-bloom-3",
    "name": "Shade Bloom",
    "cost": {
      "pollinator": 1,
      "mineral": 1,
      "trellis": 1
    },
    "points": 4,
    "maxSunTokens": 6,
    "biomes": [
      "canopy",
      "oasisEdge"
    ]
  },
  {
    "id": "dust-orchid-3-50",
    "key": "dust-orchid-3",
    "name": "Dust Orchid",
    "cost": {
      "pollinator": 1
    },
    "points": 1,
    "maxSunTokens": 6,
    "biomes": [
      "canopy"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "choice",
          "options": [
            {
              "label": "Gain 1 compost",
              "effects": [
                {
                  "type": "gainResource",
                  "resource": "compost",
                  "amount": 1
                }
              ]
            },
            {
              "label": "Gain 1 sunlight",
              "effects": [
                {
                  "type": "gainSunlight",
                  "amount": 1
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    "id": "spiral-vine-2-51",
    "key": "spiral-vine-2",
    "name": "Spiral Vine",
    "cost": {
      "compost": 1,
      "pollinator": 3,
      "trellis": 1
    },
    "points": 6,
    "maxSunTokens": 7,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 3
      }
    }
  },
  {
    "id": "sun-bloom-2-52",
    "key": "sun-bloom-2",
    "name": "Sun Bloom",
    "cost": {
      "water": 1,
      "compost": 3,
      "mineral": 1
    },
    "points": 5,
    "maxSunTokens": 8,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 4,
        "onSuccess": {
          "tuckCards": 1
        }
      }
    }
  },
  {
    "id": "star-briar-53",
    "key": "star-briar",
    "name": "Star Briar",
    "cost": {
      "water": 1,
      "trellis": 1
    },
    "points": 3,
    "maxSunTokens": 7,
    "biomes": [
      "oasisEdge"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "gainResource",
          "resource": "mineral",
          "amount": 1
        }
      ]
    }
  },
  {
    "id": "river-clover-54",
    "key": "river-clover",
    "name": "River Clover",
    "cost": {
      "water": 1,
      "trellis": 2
    },
    "points": 5,
    "maxSunTokens": 5,
    "biomes": [
      "oasisEdge",
      "understory"
    ]
  },
  {
    "id": "ghost-vine-55",
    "key": "ghost-vine",
    "name": "Ghost Vine",
    "cost": {
      "compost": 2,
      "pollinator": 1,
      "mineral": 1,
      "trellis": 1
    },
    "points": 2,
    "maxSunTokens": 9,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ]
  },
  {
    "id": "ghost-bloom-56",
    "key": "ghost-bloom",
    "name": "Ghost Bloom",
    "cost": {
      "compost": 1,
      "pollinator": 2,
      "mineral": 2
    },
    "points": 5,
    "maxSunTokens": 8,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 5,
        "onSuccess": {
          "tuckCards": 2
        }
      }
    }
  },
  {
    "id": "star-willow-57",
    "key": "star-willow",
    "name": "Star Willow",
    "cost": {
      "water": 1,
      "compost": 1,
      "trellis": 2
    },
    "points": 6,
    "maxSunTokens": 4,
    "biomes": [
      "canopy"
    ]
  },
  {
    "id": "spiral-bloom-58",
    "key": "spiral-bloom",
    "name": "Spiral Bloom",
    "cost": {
      "water": 1,
      "pollinator": 1,
      "mineral": 1,
      "trellis": 1
    },
    "points": 5,
    "maxSunTokens": 5,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ]
  },
  {
    "id": "thorn-willow-2-59",
    "key": "thorn-willow-2",
    "name": "Thorn Willow",
    "cost": {
      "water": 1,
      "mineral": 1,
      "trellis": 1
    },
    "points": 2,
    "maxSunTokens": 8,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onActivate": {
      "type": "groupBenefit",
      "effect": {
        "allPlayersGain": {
          "resource": "pollinator",
          "amount": 1
        },
        "youGain": {
          "resource": "pollinator",
          "amount": 1
        }
      }
    }
  },
  {
    "id": "ghost-bloom-2-60",
    "key": "ghost-bloom-2",
    "name": "Ghost Bloom",
    "cost": {
      "water": 2,
      "compost": 1,
      "mineral": 1,
      "trellis": 1
    },
    "points": 4,
    "maxSunTokens": 9,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 2
      }
    }
  },
  {
    "id": "shade-bloom-4-61",
    "key": "shade-bloom-4",
    "name": "Shade Bloom",
    "cost": {
      "water": 1,
      "mineral": 1,
      "trellis": 3
    },
    "points": 7,
    "maxSunTokens": 10,
    "biomes": [
      "canopy",
      "oasisEdge"
    ]
  },
  {
    "id": "shade-bloom-2-62",
    "key": "shade-bloom-2",
    "name": "Shade Bloom",
    "cost": {
      "water": 1,
      "mineral": 2
    },
    "points": 1,
    "maxSunTokens": 7,
    "biomes": [
      "canopy",
      "understory"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "gainResource",
          "resource": "compost",
          "amount": 1
        }
      ]
    }
  },
  {
    "id": "silver-willow-63",
    "key": "silver-willow",
    "name": "Silver Willow",
    "cost": {
      "water": 3,
      "compost": 1,
      "mineral": 1
    },
    "points": 7,
    "maxSunTokens": 9,
    "biomes": [
      "canopy",
      "oasisEdge"
    ]
  },
  {
    "id": "spiral-vine-64",
    "key": "spiral-vine",
    "name": "Spiral Vine",
    "cost": {
      "water": 1,
      "compost": 1,
      "trellis": 1
    },
    "points": 3,
    "maxSunTokens": 6,
    "biomes": [
      "canopy",
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 5,
        "onSuccess": {
          "tuckCards": 2
        }
      }
    }
  },
  {
    "id": "spiral-willow-65",
    "key": "spiral-willow",
    "name": "Spiral Willow",
    "cost": {
      "pollinator": 1,
      "trellis": 1
    },
    "points": 1,
    "maxSunTokens": 7,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "groupBenefit",
      "effect": {
        "allPlayersGain": {
          "resource": "pollinator",
          "amount": 1
        },
        "youGain": {
          "resource": "pollinator",
          "amount": 1
        }
      }
    }
  },
  {
    "id": "golden-clover-66",
    "key": "golden-clover",
    "name": "Golden Clover",
    "cost": {
      "water": 1,
      "pollinator": 2,
      "trellis": 2
    },
    "points": 4,
    "maxSunTokens": 9,
    "biomes": [
      "understory"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "gainResource",
          "resource": "pollinator",
          "amount": 1
        }
      ]
    }
  },
  {
    "id": "ghost-willow-67",
    "key": "ghost-willow",
    "name": "Ghost Willow",
    "cost": {
      "water": 1,
      "compost": 1,
      "mineral": 1
    },
    "points": 6,
    "maxSunTokens": 5,
    "biomes": [
      "canopy",
      "understory"
    ]
  },
  {
    "id": "cinder-vine-68",
    "key": "cinder-vine",
    "name": "Cinder Vine",
    "cost": {
      "compost": 1,
      "trellis": 1
    },
    "points": 4,
    "maxSunTokens": 6,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 2
      }
    }
  },
  {
    "id": "sword-willow-69",
    "key": "sword-willow",
    "name": "Sword Willow",
    "cost": {
      "water": 2,
      "compost": 1
    },
    "points": 4,
    "maxSunTokens": 3,
    "biomes": [
      "canopy",
      "understory"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "gainResource",
          "resource": "pollinator",
          "amount": 1
        }
      ]
    }
  },
  {
    "id": "amber-willow-3-70",
    "key": "amber-willow-3",
    "name": "Amber Willow",
    "cost": {
      "water": 3
    },
    "points": 3,
    "maxSunTokens": 9,
    "biomes": [
      "canopy"
    ]
  },
  {
    "id": "sword-vine-3-71",
    "key": "sword-vine-3",
    "name": "Sword Vine",
    "cost": {
      "compost": 2
    },
    "points": 3,
    "maxSunTokens": 7,
    "biomes": [
      "canopy",
      "understory"
    ],
    "onActivate": {
      "type": "drawCards",
      "effect": {
        "draw": 1
      }
    }
  },
  {
    "id": "shade-bloom-72",
    "key": "shade-bloom",
    "name": "Shade Bloom",
    "cost": {
      "compost": 1,
      "mineral": 2,
      "trellis": 1
    },
    "points": 2,
    "maxSunTokens": 6,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onActivate": {
      "type": "groupBenefit",
      "effect": {
        "allPlayersGain": {
          "resource": "pollinator",
          "amount": 1
        },
        "youGain": {
          "resource": "pollinator",
          "amount": 1
        }
      }
    }
  },
  {
    "id": "river-bloom-73",
    "key": "river-bloom",
    "name": "River Bloom",
    "cost": {
      "water": 1,
      "compost": 1,
      "pollinator": 1
    },
    "points": 2,
    "maxSunTokens": 5,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 7,
        "onSuccess": {
          "tuckCards": 1
        }
      }
    }
  },
  {
    "id": "dust-vine-74",
    "key": "dust-vine",
    "name": "Dust Vine",
    "cost": {
      "pollinator": 2,
      "mineral": 1
    },
    "points": 4,
    "maxSunTokens": 7,
    "biomes": [
      "canopy",
      "oasisEdge"
    ]
  },
  {
    "id": "amber-bloom-3-75",
    "key": "amber-bloom-3",
    "name": "Amber Bloom",
    "cost": {
      "water": 3,
      "trellis": 1
    },
    "points": 7,
    "maxSunTokens": 5,
    "biomes": [
      "canopy",
      "oasisEdge"
    ]
  },
  {
    "id": "thorn-willow-76",
    "key": "thorn-willow",
    "name": "Thorn Willow",
    "cost": {
      "water": 2,
      "compost": 2,
      "pollinator": 1
    },
    "points": 3,
    "maxSunTokens": 8,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 3
      }
    }
  },
  {
    "id": "sun-bloom-3-77",
    "key": "sun-bloom-3",
    "name": "Sun Bloom",
    "cost": {
      "water": 1,
      "pollinator": 2,
      "mineral": 2
    },
    "points": 4,
    "maxSunTokens": 9,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "drawCards",
      "effect": {
        "draw": 2
      }
    }
  },
  {
    "id": "sword-vine-4-78",
    "key": "sword-vine-4",
    "name": "Sword Vine",
    "cost": {
      "water": 1,
      "pollinator": 2,
      "trellis": 2
    },
    "points": 5,
    "maxSunTokens": 10,
    "biomes": [
      "canopy",
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 4,
        "onSuccess": {
          "tuckCards": 2
        }
      }
    }
  },
  {
    "id": "sun-vine-79",
    "key": "sun-vine",
    "name": "Sun Vine",
    "cost": {
      "compost": 1,
      "pollinator": 1,
      "mineral": 1
    },
    "points": 4,
    "maxSunTokens": 5,
    "biomes": [
      "oasisEdge"
    ]
  },
  {
    "id": "river-willow-80",
    "key": "river-willow",
    "name": "River Willow",
    "cost": {
      "water": 1,
      "trellis": 1
    },
    "points": 3,
    "maxSunTokens": 5,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "choice",
          "options": [
            {
              "label": "Gain 1 compost",
              "effects": [
                {
                  "type": "gainResource",
                  "resource": "compost",
                  "amount": 1
                }
              ]
            },
            {
              "label": "Gain 1 sunlight",
              "effects": [
                {
                  "type": "gainSunlight",
                  "amount": 1
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    "id": "star-orchid-81",
    "key": "star-orchid",
    "name": "Star Orchid",
    "cost": {
      "water": 1,
      "compost": 1,
      "pollinator": 2,
      "mineral": 1,
      "trellis": 1
    },
    "points": 1,
    "maxSunTokens": 8,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onActivate": {
      "type": "groupBenefit",
      "effect": {
        "allPlayersGain": {
          "resource": "pollinator",
          "amount": 1
        },
        "youGain": {
          "resource": "pollinator",
          "amount": 2
        }
      }
    }
  },
  {
    "id": "moon-willow-82",
    "key": "moon-willow",
    "name": "Moon Willow",
    "cost": {
      "compost": 3,
      "pollinator": 1,
      "trellis": 1
    },
    "points": 7,
    "maxSunTokens": 6,
    "biomes": [
      "canopy",
      "understory"
    ]
  },
  {
    "id": "spiral-orchid-83",
    "key": "spiral-orchid",
    "name": "Spiral Orchid",
    "cost": {
      "mineral": 1,
      "trellis": 2
    },
    "points": 3,
    "maxSunTokens": 7,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onPlay": {
      "trigger": "onPlay",
      "effects": [
        {
          "type": "choice",
          "options": [
            {
              "label": "Gain 1 pollinator",
              "effects": [
                {
                  "type": "gainResource",
                  "resource": "pollinator",
                  "amount": 1
                }
              ]
            },
            {
              "label": "Gain 1 sunlight",
              "effects": [
                {
                  "type": "gainSunlight",
                  "amount": 1
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    "id": "amber-bloom-84",
    "key": "amber-bloom",
    "name": "Amber Bloom",
    "cost": {
      "water": 1,
      "mineral": 2,
      "trellis": 2,
      "wild": 1
    },
    "points": 8,
    "maxSunTokens": 9,
    "biomes": [
      "canopy"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 2,
        "onSuccess": {
          "tuckCards": 2
        }
      }
    }
  },
  {
    "id": "sun-bloom-85",
    "key": "sun-bloom",
    "name": "Sun Bloom",
    "cost": {
      "water": 2,
      "trellis": 3
    },
    "points": 9,
    "maxSunTokens": 10,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 5,
        "onSuccess": {
          "tuckCards": 2
        }
      }
    }
  },
  {
    "id": "sun-vine-2-86",
    "key": "sun-vine-2",
    "name": "Sun Vine",
    "cost": {
      "pollinator": 5
    },
    "points": 7,
    "maxSunTokens": 7,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 4,
        "onSuccess": {
          "tuckCards": 2
        }
      }
    }
  },
  {
    "id": "cinder-willow-2-87",
    "key": "cinder-willow-2",
    "name": "Cinder Willow",
    "cost": {
      "water": 1,
      "compost": 2,
      "mineral": 1,
      "trellis": 1
    },
    "points": 3,
    "maxSunTokens": 6,
    "biomes": [
      "canopy"
    ],
    "onActivate": {
      "type": "drawCards",
      "effect": {
        "draw": 1
      }
    }
  },
  {
    "id": "spiral-willow-2-88",
    "key": "spiral-willow-2",
    "name": "Spiral Willow",
    "cost": {
      "compost": 4,
      "trellis": 1
    },
    "points": 4,
    "maxSunTokens": 4,
    "biomes": [
      "canopy",
      "understory"
    ]
  },
  {
    "id": "shade-vine-3-89",
    "key": "shade-vine-3",
    "name": "Shade Vine",
    "cost": {
      "water": 2,
      "mineral": 1,
      "trellis": 2
    },
    "points": 4,
    "maxSunTokens": 9,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "drawCards",
      "effect": {
        "draw": 3
      }
    }
  },
  {
    "id": "thorn-orchid-2-90",
    "key": "thorn-orchid-2",
    "name": "Thorn Orchid",
    "cost": {
      "water": 1,
      "compost": 1,
      "pollinator": 1
    },
    "points": 1,
    "maxSunTokens": 4,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onActivate": {
      "type": "groupBenefit",
      "effect": {
        "allPlayersGain": {
          "resource": "compost",
          "amount": 1
        },
        "youGain": {
          "resource": "compost",
          "amount": 1
        }
      }
    }
  },
  {
    "id": "river-ivy-91",
    "key": "river-ivy",
    "name": "River Ivy",
    "cost": {
      "water": 2,
      "compost": 1,
      "pollinator": 1,
      "mineral": 1
    },
    "points": 7,
    "maxSunTokens": 10,
    "biomes": [
      "understory"
    ]
  },
  {
    "id": "ghost-lily-92",
    "key": "ghost-lily",
    "name": "Ghost Lily",
    "cost": {
      "compost": 4
    },
    "points": 6,
    "maxSunTokens": 7,
    "biomes": [
      "oasisEdge",
      "understory"
    ]
  },
  {
    "id": "velvet-bloom-93",
    "key": "velvet-bloom",
    "name": "Velvet Bloom",
    "cost": {
      "compost": 2,
      "pollinator": 1,
      "mineral": 1,
      "trellis": 1
    },
    "points": 7,
    "maxSunTokens": 10,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "drawCards",
      "effect": {
        "draw": 3
      }
    }
  },
  {
    "id": "dust-orchid-94",
    "key": "dust-orchid",
    "name": "Dust Orchid",
    "cost": {
      "water": 1,
      "compost": 1,
      "pollinator": 1,
      "trellis": 1
    },
    "points": 3,
    "maxSunTokens": 5,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "drawCards",
      "effect": {
        "draw": 1
      }
    }
  },
  {
    "id": "amber-vine-95",
    "key": "amber-vine",
    "name": "Amber Vine",
    "cost": {
      "compost": 1,
      "pollinator": 2,
      "trellis": 2
    },
    "points": 4,
    "maxSunTokens": 10,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 3
      }
    }
  },
  {
    "id": "sword-vine-96",
    "key": "sword-vine",
    "name": "Sword Vine",
    "cost": {
      "water": 2,
      "pollinator": 1,
      "mineral": 1,
      "trellis": 1
    },
    "points": 7,
    "maxSunTokens": 8,
    "biomes": [
      "canopy"
    ],
    "onActivate": {
      "type": "drawCards",
      "effect": {
        "draw": 1
      }
    }
  },
  {
    "id": "cinder-root-97",
    "key": "cinder-root",
    "name": "Cinder Root",
    "cost": {
      "compost": 2,
      "mineral": 1,
      "trellis": 2
    },
    "points": 9,
    "maxSunTokens": 9,
    "biomes": [
      "oasisEdge",
      "understory"
    ],
    "onActivate": {
      "type": "gainSun",
      "effect": {
        "amount": 2
      }
    }
  },
  {
    "id": "silver-bloom-2-98",
    "key": "silver-bloom-2",
    "name": "Silver Bloom",
    "cost": {
      "water": 1,
      "pollinator": 1,
      "mineral": 1,
      "trellis": 1
    },
    "points": 4,
    "maxSunTokens": 5,
    "biomes": [
      "canopy",
      "oasisEdge",
      "understory"
    ]
  },
  {
    "id": "dust-orchid-2-99",
    "key": "dust-orchid-2",
    "name": "Dust Orchid",
    "cost": {
      "pollinator": 3,
      "trellis": 1
    },
    "points": 1,
    "maxSunTokens": 7,
    "biomes": [
      "canopy",
      "oasisEdge"
    ],
    "onActivate": {
      "type": "groupBenefit",
      "effect": {
        "allPlayersGain": {
          "resource": "pollinator",
          "amount": 1
        },
        "youGain": {
          "resource": "pollinator",
          "amount": 1
        }
      }
    }
  },
  {
    "id": "moon-orchid-100",
    "key": "moon-orchid",
    "name": "Moon Orchid",
    "cost": {
      "compost": 2
    },
    "points": 4,
    "maxSunTokens": 7,
    "biomes": [
      "understory"
    ],
    "onActivate": {
      "type": "rollDieTuck",
      "effect": {
        "die": "d6",
        "successIfLessThan": 6,
        "onSuccess": {
          "tuckCards": 1
        }
      }
    }
  }
];

export const CARD_BY_ID = new Map(EXPANDED_DECK.map((cardDefinition) => [cardDefinition.id, cardDefinition]));
