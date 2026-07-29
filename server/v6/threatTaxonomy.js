const threatTaxonomy = {
  "armed_conflict": {
    label: "Armed Conflict",
    subtypes: {
      "airstrike": {
        label: "Airstrike",
        severityBands: [
          { level: 1, name: "information", trigger: "airstrike level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "airstrike level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "airstrike level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "airstrike level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "airstrike level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "airstrike",
          "airstrike",
          "airstrike",
          "armed conflict",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "artillery": {
        label: "Artillery",
        severityBands: [
          { level: 1, name: "information", trigger: "artillery level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "artillery level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "artillery level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "artillery level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "artillery level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "artillery",
          "artillery",
          "artillery",
          "armed conflict",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "drone_attack": {
        label: "Drone Attack",
        severityBands: [
          { level: 1, name: "information", trigger: "drone_attack level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "drone_attack level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "drone_attack level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "drone_attack level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "drone_attack level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "drone attack",
          "drone_attack",
          "drone",
          "armed conflict",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "missile_attack": {
        label: "Missile Attack",
        severityBands: [
          { level: 1, name: "information", trigger: "missile_attack level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "missile_attack level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "missile_attack level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "missile_attack level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "missile_attack level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "missile attack",
          "missile_attack",
          "missile",
          "armed conflict",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "ground_assault": {
        label: "Ground Assault",
        severityBands: [
          { level: 1, name: "information", trigger: "ground_assault level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "ground_assault level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "ground_assault level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "ground_assault level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "ground_assault level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "ground assault",
          "ground_assault",
          "ground",
          "armed conflict",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "frontline_shift": {
        label: "Frontline Shift",
        severityBands: [
          { level: 1, name: "information", trigger: "frontline_shift level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "frontline_shift level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "frontline_shift level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "frontline_shift level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "frontline_shift level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "frontline shift",
          "frontline_shift",
          "frontline",
          "armed conflict",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "occupation_pressure": {
        label: "Occupation Pressure",
        severityBands: [
          { level: 1, name: "information", trigger: "occupation_pressure level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "occupation_pressure level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "occupation_pressure level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "occupation_pressure level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "occupation_pressure level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "occupation pressure",
          "occupation_pressure",
          "occupation",
          "armed conflict",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "border_shelling": {
        label: "Border Shelling",
        severityBands: [
          { level: 1, name: "information", trigger: "border_shelling level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "border_shelling level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "border_shelling level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "border_shelling level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "border_shelling level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "border shelling",
          "border_shelling",
          "border",
          "armed conflict",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "military_mobilisation": {
        label: "Military Mobilisation",
        severityBands: [
          { level: 1, name: "information", trigger: "military_mobilisation level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "military_mobilisation level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "military_mobilisation level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "military_mobilisation level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "military_mobilisation level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "military mobilisation",
          "military_mobilisation",
          "military",
          "armed conflict",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "munitions_explosion": {
        label: "Munitions Explosion",
        severityBands: [
          { level: 1, name: "information", trigger: "munitions_explosion level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "munitions_explosion level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "munitions_explosion level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "munitions_explosion level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "munitions_explosion level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "munitions explosion",
          "munitions_explosion",
          "munitions",
          "armed conflict",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
    }
  },
  "violent_crime": {
    label: "Violent Crime",
    subtypes: {
      "active_attacker": {
        label: "Active Attacker",
        severityBands: [
          { level: 1, name: "information", trigger: "active_attacker level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "active_attacker level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "active_attacker level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "active_attacker level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "active_attacker level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "active attacker",
          "active_attacker",
          "active",
          "violent crime",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "active_shooter": {
        label: "Active Shooter",
        severityBands: [
          { level: 1, name: "information", trigger: "active_shooter level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "active_shooter level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "active_shooter level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "active_shooter level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "active_shooter level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "active shooter",
          "active_shooter",
          "active",
          "violent crime",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "stabbing_spree": {
        label: "Stabbing Spree",
        severityBands: [
          { level: 1, name: "information", trigger: "stabbing_spree level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "stabbing_spree level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "stabbing_spree level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "stabbing_spree level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "stabbing_spree level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "stabbing spree",
          "stabbing_spree",
          "stabbing",
          "violent crime",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "armed_robbery": {
        label: "Armed Robbery",
        severityBands: [
          { level: 1, name: "information", trigger: "armed_robbery level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "armed_robbery level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "armed_robbery level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "armed_robbery level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "armed_robbery level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "armed robbery",
          "armed_robbery",
          "armed",
          "violent crime",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "burglary_cluster": {
        label: "Burglary Cluster",
        severityBands: [
          { level: 1, name: "information", trigger: "burglary_cluster level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "burglary_cluster level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "burglary_cluster level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "burglary_cluster level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "burglary_cluster level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "burglary cluster",
          "burglary_cluster",
          "burglary",
          "violent crime",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "vehicle_theft_cluster": {
        label: "Vehicle Theft Cluster",
        severityBands: [
          { level: 1, name: "information", trigger: "vehicle_theft_cluster level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "vehicle_theft_cluster level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "vehicle_theft_cluster level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "vehicle_theft_cluster level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "vehicle_theft_cluster level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "vehicle theft cluster",
          "vehicle_theft_cluster",
          "vehicle",
          "violent crime",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "kidnap_report": {
        label: "Kidnap Report",
        severityBands: [
          { level: 1, name: "information", trigger: "kidnap_report level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "kidnap_report level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "kidnap_report level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "kidnap_report level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "kidnap_report level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "kidnap report",
          "kidnap_report",
          "kidnap",
          "violent crime",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "gang_clash": {
        label: "Gang Clash",
        severityBands: [
          { level: 1, name: "information", trigger: "gang_clash level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "gang_clash level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "gang_clash level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "gang_clash level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "gang_clash level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "gang clash",
          "gang_clash",
          "gang",
          "violent crime",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "weapons_incident": {
        label: "Weapons Incident",
        severityBands: [
          { level: 1, name: "information", trigger: "weapons_incident level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "weapons_incident level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "weapons_incident level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "weapons_incident level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "weapons_incident level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "weapons incident",
          "weapons_incident",
          "weapons",
          "violent crime",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "violent_assault": {
        label: "Violent Assault",
        severityBands: [
          { level: 1, name: "information", trigger: "violent_assault level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "violent_assault level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "violent_assault level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "violent_assault level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "violent_assault level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "violent assault",
          "violent_assault",
          "violent",
          "violent crime",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
    }
  },
  "civil_unrest": {
    label: "Civil Unrest",
    subtypes: {
      "protest": {
        label: "Protest",
        severityBands: [
          { level: 1, name: "information", trigger: "protest level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "protest level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "protest level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "protest level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "protest level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "protest",
          "protest",
          "protest",
          "civil unrest",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "riot": {
        label: "Riot",
        severityBands: [
          { level: 1, name: "information", trigger: "riot level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "riot level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "riot level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "riot level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "riot level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "riot",
          "riot",
          "riot",
          "civil unrest",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "strike": {
        label: "Strike",
        severityBands: [
          { level: 1, name: "information", trigger: "strike level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "strike level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "strike level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "strike level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "strike level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "strike",
          "strike",
          "strike",
          "civil unrest",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "road_block": {
        label: "Road Block",
        severityBands: [
          { level: 1, name: "information", trigger: "road_block level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "road_block level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "road_block level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "road_block level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "road_block level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "road block",
          "road_block",
          "road",
          "civil unrest",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "government_building_protest": {
        label: "Government Building Protest",
        severityBands: [
          { level: 1, name: "information", trigger: "government_building_protest level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "government_building_protest level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "government_building_protest level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "government_building_protest level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "government_building_protest level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "government building protest",
          "government_building_protest",
          "government",
          "civil unrest",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "election_unrest": {
        label: "Election Unrest",
        severityBands: [
          { level: 1, name: "information", trigger: "election_unrest level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "election_unrest level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "election_unrest level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "election_unrest level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "election_unrest level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "election unrest",
          "election_unrest",
          "election",
          "civil unrest",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "religious_tension": {
        label: "Religious Tension",
        severityBands: [
          { level: 1, name: "information", trigger: "religious_tension level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "religious_tension level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "religious_tension level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "religious_tension level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "religious_tension level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "religious tension",
          "religious_tension",
          "religious",
          "civil unrest",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "police_clashes": {
        label: "Police Clashes",
        severityBands: [
          { level: 1, name: "information", trigger: "police_clashes level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "police_clashes level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "police_clashes level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "police_clashes level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "police_clashes level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "police clashes",
          "police_clashes",
          "police",
          "civil unrest",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "student_unrest": {
        label: "Student Unrest",
        severityBands: [
          { level: 1, name: "information", trigger: "student_unrest level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "student_unrest level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "student_unrest level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "student_unrest level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "student_unrest level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "student unrest",
          "student_unrest",
          "student",
          "civil unrest",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "labour_action": {
        label: "Labour Action",
        severityBands: [
          { level: 1, name: "information", trigger: "labour_action level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "labour_action level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "labour_action level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "labour_action level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "labour_action level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "labour action",
          "labour_action",
          "labour",
          "civil unrest",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
    }
  },
  "movement": {
    label: "Movement",
    subtypes: {
      "airport_disruption": {
        label: "Airport Disruption",
        severityBands: [
          { level: 1, name: "information", trigger: "airport_disruption level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "airport_disruption level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "airport_disruption level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "airport_disruption level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "airport_disruption level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "airport disruption",
          "airport_disruption",
          "airport",
          "movement",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "rail_disruption": {
        label: "Rail Disruption",
        severityBands: [
          { level: 1, name: "information", trigger: "rail_disruption level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "rail_disruption level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "rail_disruption level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "rail_disruption level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "rail_disruption level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "rail disruption",
          "rail_disruption",
          "rail",
          "movement",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "road_closure": {
        label: "Road Closure",
        severityBands: [
          { level: 1, name: "information", trigger: "road_closure level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "road_closure level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "road_closure level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "road_closure level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "road_closure level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "road closure",
          "road_closure",
          "road",
          "movement",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "border_delay": {
        label: "Border Delay",
        severityBands: [
          { level: 1, name: "information", trigger: "border_delay level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "border_delay level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "border_delay level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "border_delay level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "border_delay level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "border delay",
          "border_delay",
          "border",
          "movement",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "port_delay": {
        label: "Port Delay",
        severityBands: [
          { level: 1, name: "information", trigger: "port_delay level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "port_delay level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "port_delay level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "port_delay level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "port_delay level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "port delay",
          "port_delay",
          "port",
          "movement",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "fuel_shortage": {
        label: "Fuel Shortage",
        severityBands: [
          { level: 1, name: "information", trigger: "fuel_shortage level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "fuel_shortage level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "fuel_shortage level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "fuel_shortage level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "fuel_shortage level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "fuel shortage",
          "fuel_shortage",
          "fuel",
          "movement",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "checkpoint_delay": {
        label: "Checkpoint Delay",
        severityBands: [
          { level: 1, name: "information", trigger: "checkpoint_delay level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "checkpoint_delay level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "checkpoint_delay level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "checkpoint_delay level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "checkpoint_delay level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "checkpoint delay",
          "checkpoint_delay",
          "checkpoint",
          "movement",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "curfew": {
        label: "Curfew",
        severityBands: [
          { level: 1, name: "information", trigger: "curfew level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "curfew level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "curfew level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "curfew level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "curfew level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "curfew",
          "curfew",
          "curfew",
          "movement",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "evacuation_order": {
        label: "Evacuation Order",
        severityBands: [
          { level: 1, name: "information", trigger: "evacuation_order level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "evacuation_order level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "evacuation_order level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "evacuation_order level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "evacuation_order level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "evacuation order",
          "evacuation_order",
          "evacuation",
          "movement",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "navigation_warning": {
        label: "Navigation Warning",
        severityBands: [
          { level: 1, name: "information", trigger: "navigation_warning level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "navigation_warning level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "navigation_warning level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "navigation_warning level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "navigation_warning level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "navigation warning",
          "navigation_warning",
          "navigation",
          "movement",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
    }
  },
  "critical_infrastructure": {
    label: "Critical Infrastructure",
    subtypes: {
      "power_outage": {
        label: "Power Outage",
        severityBands: [
          { level: 1, name: "information", trigger: "power_outage level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "power_outage level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "power_outage level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "power_outage level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "power_outage level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "power outage",
          "power_outage",
          "power",
          "critical infrastructure",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "water_disruption": {
        label: "Water Disruption",
        severityBands: [
          { level: 1, name: "information", trigger: "water_disruption level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "water_disruption level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "water_disruption level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "water_disruption level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "water_disruption level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "water disruption",
          "water_disruption",
          "water",
          "critical infrastructure",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "telecoms_outage": {
        label: "Telecoms Outage",
        severityBands: [
          { level: 1, name: "information", trigger: "telecoms_outage level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "telecoms_outage level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "telecoms_outage level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "telecoms_outage level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "telecoms_outage level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "telecoms outage",
          "telecoms_outage",
          "telecoms",
          "critical infrastructure",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "hospital_disruption": {
        label: "Hospital Disruption",
        severityBands: [
          { level: 1, name: "information", trigger: "hospital_disruption level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "hospital_disruption level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "hospital_disruption level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "hospital_disruption level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "hospital_disruption level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "hospital disruption",
          "hospital_disruption",
          "hospital",
          "critical infrastructure",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "banking_outage": {
        label: "Banking Outage",
        severityBands: [
          { level: 1, name: "information", trigger: "banking_outage level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "banking_outage level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "banking_outage level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "banking_outage level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "banking_outage level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "banking outage",
          "banking_outage",
          "banking",
          "critical infrastructure",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "internet_shutdown": {
        label: "Internet Shutdown",
        severityBands: [
          { level: 1, name: "information", trigger: "internet_shutdown level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "internet_shutdown level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "internet_shutdown level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "internet_shutdown level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "internet_shutdown level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "internet shutdown",
          "internet_shutdown",
          "internet",
          "critical infrastructure",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "fuel_station_closure": {
        label: "Fuel Station Closure",
        severityBands: [
          { level: 1, name: "information", trigger: "fuel_station_closure level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "fuel_station_closure level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "fuel_station_closure level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "fuel_station_closure level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "fuel_station_closure level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "fuel station closure",
          "fuel_station_closure",
          "fuel",
          "critical infrastructure",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "bridge_damage": {
        label: "Bridge Damage",
        severityBands: [
          { level: 1, name: "information", trigger: "bridge_damage level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "bridge_damage level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "bridge_damage level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "bridge_damage level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "bridge_damage level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "bridge damage",
          "bridge_damage",
          "bridge",
          "critical infrastructure",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "dam_risk": {
        label: "Dam Risk",
        severityBands: [
          { level: 1, name: "information", trigger: "dam_risk level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "dam_risk level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "dam_risk level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "dam_risk level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "dam_risk level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "dam risk",
          "dam_risk",
          "dam",
          "critical infrastructure",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "pipeline_disruption": {
        label: "Pipeline Disruption",
        severityBands: [
          { level: 1, name: "information", trigger: "pipeline_disruption level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "pipeline_disruption level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "pipeline_disruption level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "pipeline_disruption level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "pipeline_disruption level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "pipeline disruption",
          "pipeline_disruption",
          "pipeline",
          "critical infrastructure",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
    }
  },
  "natural_hazard": {
    label: "Natural Hazard",
    subtypes: {
      "earthquake": {
        label: "Earthquake",
        severityBands: [
          { level: 1, name: "information", trigger: "earthquake level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "earthquake level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "earthquake level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "earthquake level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "earthquake level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "earthquake",
          "earthquake",
          "earthquake",
          "natural hazard",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "flood": {
        label: "Flood",
        severityBands: [
          { level: 1, name: "information", trigger: "flood level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "flood level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "flood level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "flood level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "flood level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "flood",
          "flood",
          "flood",
          "natural hazard",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "wildfire": {
        label: "Wildfire",
        severityBands: [
          { level: 1, name: "information", trigger: "wildfire level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "wildfire level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "wildfire level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "wildfire level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "wildfire level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "wildfire",
          "wildfire",
          "wildfire",
          "natural hazard",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "storm": {
        label: "Storm",
        severityBands: [
          { level: 1, name: "information", trigger: "storm level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "storm level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "storm level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "storm level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "storm level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "storm",
          "storm",
          "storm",
          "natural hazard",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "tornado": {
        label: "Tornado",
        severityBands: [
          { level: 1, name: "information", trigger: "tornado level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "tornado level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "tornado level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "tornado level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "tornado level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "tornado",
          "tornado",
          "tornado",
          "natural hazard",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "landslide": {
        label: "Landslide",
        severityBands: [
          { level: 1, name: "information", trigger: "landslide level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "landslide level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "landslide level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "landslide level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "landslide level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "landslide",
          "landslide",
          "landslide",
          "natural hazard",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "volcano": {
        label: "Volcano",
        severityBands: [
          { level: 1, name: "information", trigger: "volcano level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "volcano level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "volcano level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "volcano level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "volcano level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "volcano",
          "volcano",
          "volcano",
          "natural hazard",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "extreme_heat": {
        label: "Extreme Heat",
        severityBands: [
          { level: 1, name: "information", trigger: "extreme_heat level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "extreme_heat level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "extreme_heat level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "extreme_heat level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "extreme_heat level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "extreme heat",
          "extreme_heat",
          "extreme",
          "natural hazard",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "extreme_cold": {
        label: "Extreme Cold",
        severityBands: [
          { level: 1, name: "information", trigger: "extreme_cold level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "extreme_cold level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "extreme_cold level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "extreme_cold level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "extreme_cold level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "extreme cold",
          "extreme_cold",
          "extreme",
          "natural hazard",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "drought": {
        label: "Drought",
        severityBands: [
          { level: 1, name: "information", trigger: "drought level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "drought level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "drought level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "drought level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "drought level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "drought",
          "drought",
          "drought",
          "natural hazard",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
    }
  },
  "business_money": {
    label: "Business Money",
    subtypes: {
      "currency_volatility": {
        label: "Currency Volatility",
        severityBands: [
          { level: 1, name: "information", trigger: "currency_volatility level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "currency_volatility level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "currency_volatility level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "currency_volatility level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "currency_volatility level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "currency volatility",
          "currency_volatility",
          "currency",
          "business money",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "sanctions_change": {
        label: "Sanctions Change",
        severityBands: [
          { level: 1, name: "information", trigger: "sanctions_change level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "sanctions_change level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "sanctions_change level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "sanctions_change level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "sanctions_change level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "sanctions change",
          "sanctions_change",
          "sanctions",
          "business money",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "cash_shortage": {
        label: "Cash Shortage",
        severityBands: [
          { level: 1, name: "information", trigger: "cash_shortage level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "cash_shortage level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "cash_shortage level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "cash_shortage level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "cash_shortage level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "cash shortage",
          "cash_shortage",
          "cash",
          "business money",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "capital_controls": {
        label: "Capital Controls",
        severityBands: [
          { level: 1, name: "information", trigger: "capital_controls level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "capital_controls level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "capital_controls level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "capital_controls level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "capital_controls level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "capital controls",
          "capital_controls",
          "capital",
          "business money",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "crypto_restriction": {
        label: "Crypto Restriction",
        severityBands: [
          { level: 1, name: "information", trigger: "crypto_restriction level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "crypto_restriction level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "crypto_restriction level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "crypto_restriction level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "crypto_restriction level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "crypto restriction",
          "crypto_restriction",
          "crypto",
          "business money",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "bank_closure": {
        label: "Bank Closure",
        severityBands: [
          { level: 1, name: "information", trigger: "bank_closure level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "bank_closure level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "bank_closure level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "bank_closure level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "bank_closure level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "bank closure",
          "bank_closure",
          "bank",
          "business money",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "atm_shortage": {
        label: "Atm Shortage",
        severityBands: [
          { level: 1, name: "information", trigger: "atm_shortage level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "atm_shortage level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "atm_shortage level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "atm_shortage level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "atm_shortage level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "atm shortage",
          "atm_shortage",
          "atm",
          "business money",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "remittance_disruption": {
        label: "Remittance Disruption",
        severityBands: [
          { level: 1, name: "information", trigger: "remittance_disruption level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "remittance_disruption level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "remittance_disruption level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "remittance_disruption level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "remittance_disruption level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "remittance disruption",
          "remittance_disruption",
          "remittance",
          "business money",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "commodity_shock": {
        label: "Commodity Shock",
        severityBands: [
          { level: 1, name: "information", trigger: "commodity_shock level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "commodity_shock level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "commodity_shock level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "commodity_shock level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "commodity_shock level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "commodity shock",
          "commodity_shock",
          "commodity",
          "business money",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "payment_network_outage": {
        label: "Payment Network Outage",
        severityBands: [
          { level: 1, name: "information", trigger: "payment_network_outage level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "payment_network_outage level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "payment_network_outage level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "payment_network_outage level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "payment_network_outage level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "payment network outage",
          "payment_network_outage",
          "payment",
          "business money",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
    }
  },
  "political": {
    label: "Political",
    subtypes: {
      "coup_risk": {
        label: "Coup Risk",
        severityBands: [
          { level: 1, name: "information", trigger: "coup_risk level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "coup_risk level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "coup_risk level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "coup_risk level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "coup_risk level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "coup risk",
          "coup_risk",
          "coup",
          "political",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "minister_resignation": {
        label: "Minister Resignation",
        severityBands: [
          { level: 1, name: "information", trigger: "minister_resignation level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "minister_resignation level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "minister_resignation level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "minister_resignation level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "minister_resignation level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "minister resignation",
          "minister_resignation",
          "minister",
          "political",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "election_change": {
        label: "Election Change",
        severityBands: [
          { level: 1, name: "information", trigger: "election_change level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "election_change level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "election_change level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "election_change level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "election_change level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "election change",
          "election_change",
          "election",
          "political",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "sanction_vote": {
        label: "Sanction Vote",
        severityBands: [
          { level: 1, name: "information", trigger: "sanction_vote level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "sanction_vote level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "sanction_vote level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "sanction_vote level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "sanction_vote level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "sanction vote",
          "sanction_vote",
          "sanction",
          "political",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "diplomatic_expulsion": {
        label: "Diplomatic Expulsion",
        severityBands: [
          { level: 1, name: "information", trigger: "diplomatic_expulsion level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "diplomatic_expulsion level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "diplomatic_expulsion level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "diplomatic_expulsion level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "diplomatic_expulsion level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "diplomatic expulsion",
          "diplomatic_expulsion",
          "diplomatic",
          "political",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "border_policy_change": {
        label: "Border Policy Change",
        severityBands: [
          { level: 1, name: "information", trigger: "border_policy_change level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "border_policy_change level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "border_policy_change level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "border_policy_change level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "border_policy_change level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "border policy change",
          "border_policy_change",
          "border",
          "political",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "emergency_law": {
        label: "Emergency Law",
        severityBands: [
          { level: 1, name: "information", trigger: "emergency_law level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "emergency_law level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "emergency_law level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "emergency_law level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "emergency_law level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "emergency law",
          "emergency_law",
          "emergency",
          "political",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "parliament_violence": {
        label: "Parliament Violence",
        severityBands: [
          { level: 1, name: "information", trigger: "parliament_violence level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "parliament_violence level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "parliament_violence level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "parliament_violence level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "parliament_violence level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "parliament violence",
          "parliament_violence",
          "parliament",
          "political",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "corruption_scandal": {
        label: "Corruption Scandal",
        severityBands: [
          { level: 1, name: "information", trigger: "corruption_scandal level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "corruption_scandal level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "corruption_scandal level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "corruption_scandal level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "corruption_scandal level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "corruption scandal",
          "corruption_scandal",
          "corruption",
          "political",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
      "civil_military_tension": {
        label: "Civil Military Tension",
        severityBands: [
          { level: 1, name: "information", trigger: "civil_military_tension level 1", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 2, name: "watch", trigger: "civil_military_tension level 2", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 3, name: "caution", trigger: "civil_military_tension level 3", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 4, name: "danger", trigger: "civil_military_tension level 4", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"},
          { level: 5, name: "emergency", trigger: "civil_military_tension level 5", response: "verify source, check distance, avoid immediate area if close, reassess route and communications"}
        ],
        keywords: [
          "civil military tension",
          "civil_military_tension",
          "civil",
          "political",
          "security",
          "travel",
        ],
        customerUse: [
          "decide whether to travel",
          "warn contact near the area",
          "change route",
          "check embassy/hospital/fuel options",
          "verify with second source",
        ]
      },
    }
  },
};
function listThreatTypes(){ return threatTaxonomy; }
function classifyThreatText(text){ const s=String(text||"").toLowerCase(); const hits=[]; for(const [cat,cfg] of Object.entries(threatTaxonomy)){ for(const [sub,rule] of Object.entries(cfg.subtypes)){ if((rule.keywords||[]).some(k=>s.includes(String(k).toLowerCase()))) hits.push({category:cat,subtype:sub,label:rule.label}); }} return hits; }
module.exports = { threatTaxonomy, listThreatTypes, classifyThreatText };