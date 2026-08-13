export const STRATEGIC_AREAS = Object.freeze([
  {
    "id": "kharg",
    "name": "Kharg Island",
    "regionId": "middle-east",
    "countryCode": "IR",
    "lat": 29.24,
    "lon": 50.31,
    "type": "energy-export",
    "importance": 98,
    "aliases": [
      "Kharg",
      "Kharg Island"
    ],
    "exposures": [
      "Iranian crude exports",
      "tankers"
    ],
    "monitorFor": [
      "loading disruption",
      "attack",
      "sanctions"
    ]
  },
  {
    "id": "bandar-abbas",
    "name": "Bandar Abbas",
    "regionId": "middle-east",
    "countryCode": "IR",
    "lat": 27.18,
    "lon": 56.27,
    "type": "port-military",
    "importance": 96,
    "aliases": [
      "Bandar Abbas"
    ],
    "exposures": [
      "Hormuz shipping",
      "IRGC Navy"
    ],
    "monitorFor": [
      "naval deployment",
      "port closure",
      "seizure"
    ]
  },
  {
    "id": "fujairah",
    "name": "Fujairah",
    "regionId": "middle-east",
    "countryCode": "AE",
    "lat": 25.13,
    "lon": 56.33,
    "type": "energy-port",
    "importance": 94,
    "aliases": [
      "Fujairah"
    ],
    "exposures": [
      "oil storage",
      "bunkering",
      "Hormuz bypass"
    ],
    "monitorFor": [
      "terminal outage",
      "tanker incident",
      "storage"
    ]
  },
  {
    "id": "ras-tanura",
    "name": "Ras Tanura",
    "regionId": "middle-east",
    "countryCode": "SA",
    "lat": 26.64,
    "lon": 50.16,
    "type": "energy-port",
    "importance": 98,
    "aliases": [
      "Ras Tanura"
    ],
    "exposures": [
      "Saudi crude exports"
    ],
    "monitorFor": [
      "attack",
      "loading suspension",
      "capacity"
    ]
  },
  {
    "id": "abqaiq",
    "name": "Abqaiq",
    "regionId": "middle-east",
    "countryCode": "SA",
    "lat": 25.94,
    "lon": 49.67,
    "type": "energy-processing",
    "importance": 99,
    "aliases": [
      "Abqaiq"
    ],
    "exposures": [
      "Saudi oil processing"
    ],
    "monitorFor": [
      "attack",
      "processing outage",
      "production loss"
    ]
  },
  {
    "id": "ras-laffan",
    "name": "Ras Laffan",
    "regionId": "middle-east",
    "countryCode": "QA",
    "lat": 25.92,
    "lon": 51.55,
    "type": "lng-hub",
    "importance": 98,
    "aliases": [
      "Ras Laffan"
    ],
    "exposures": [
      "Qatar LNG",
      "LNG shipping"
    ],
    "monitorFor": [
      "outage",
      "force majeure",
      "shipping restriction"
    ]
  },
  {
    "id": "jebel-ali",
    "name": "Jebel Ali",
    "regionId": "middle-east",
    "countryCode": "AE",
    "lat": 24.99,
    "lon": 55.06,
    "type": "container-port",
    "importance": 91,
    "aliases": [
      "Jebel Ali"
    ],
    "exposures": [
      "Gulf container trade"
    ],
    "monitorFor": [
      "closure",
      "cyber incident",
      "congestion"
    ]
  },
  {
    "id": "natanz",
    "name": "Natanz",
    "regionId": "middle-east",
    "countryCode": "IR",
    "lat": 33.72,
    "lon": 51.73,
    "type": "nuclear-site",
    "importance": 100,
    "aliases": [
      "Natanz"
    ],
    "exposures": [
      "nuclear escalation"
    ],
    "monitorFor": [
      "IAEA access",
      "enrichment",
      "attack"
    ]
  },
  {
    "id": "fordow",
    "name": "Fordow",
    "regionId": "middle-east",
    "countryCode": "IR",
    "lat": 34.88,
    "lon": 50.99,
    "type": "nuclear-site",
    "importance": 100,
    "aliases": [
      "Fordow",
      "Fordo"
    ],
    "exposures": [
      "nuclear escalation"
    ],
    "monitorFor": [
      "enrichment",
      "IAEA access",
      "attack"
    ]
  },
  {
    "id": "bushehr",
    "name": "Bushehr",
    "regionId": "middle-east",
    "countryCode": "IR",
    "lat": 28.83,
    "lon": 50.89,
    "type": "nuclear-energy",
    "importance": 91,
    "aliases": [
      "Bushehr"
    ],
    "exposures": [
      "nuclear safety",
      "Gulf security"
    ],
    "monitorFor": [
      "incident",
      "attack",
      "shutdown"
    ]
  },
  {
    "id": "haifa",
    "name": "Haifa",
    "regionId": "middle-east",
    "countryCode": "IL",
    "lat": 32.82,
    "lon": 34.99,
    "type": "port-industrial",
    "importance": 90,
    "aliases": [
      "Haifa"
    ],
    "exposures": [
      "shipping",
      "chemicals",
      "Israel logistics"
    ],
    "monitorFor": [
      "missile attack",
      "port closure"
    ]
  },
  {
    "id": "ashdod",
    "name": "Ashdod",
    "regionId": "middle-east",
    "countryCode": "IL",
    "lat": 31.8,
    "lon": 34.65,
    "type": "container-port",
    "importance": 88,
    "aliases": [
      "Ashdod"
    ],
    "exposures": [
      "Israel imports"
    ],
    "monitorFor": [
      "closure",
      "attack",
      "congestion"
    ]
  },
  {
    "id": "eilat",
    "name": "Eilat",
    "regionId": "middle-east",
    "countryCode": "IL",
    "lat": 29.55,
    "lon": 34.95,
    "type": "red-sea-port",
    "importance": 84,
    "aliases": [
      "Eilat"
    ],
    "exposures": [
      "Red Sea trade"
    ],
    "monitorFor": [
      "Houthi attack",
      "closure"
    ]
  },
  {
    "id": "incirlik",
    "name": "Incirlik Air Base",
    "regionId": "middle-east",
    "countryCode": "TR",
    "lat": 37.0,
    "lon": 35.43,
    "type": "military-base",
    "importance": 86,
    "aliases": [
      "Incirlik"
    ],
    "exposures": [
      "NATO posture"
    ],
    "monitorFor": [
      "deployment",
      "alert status"
    ]
  },
  {
    "id": "al-udeid",
    "name": "Al Udeid Air Base",
    "regionId": "middle-east",
    "countryCode": "QA",
    "lat": 25.12,
    "lon": 51.31,
    "type": "military-base",
    "importance": 95,
    "aliases": [
      "Al Udeid"
    ],
    "exposures": [
      "US Gulf posture"
    ],
    "monitorFor": [
      "deployment",
      "evacuation",
      "alert"
    ]
  },
  {
    "id": "odesa",
    "name": "Odesa",
    "regionId": "europe",
    "countryCode": "UA",
    "lat": 46.48,
    "lon": 30.73,
    "type": "black-sea-port",
    "importance": 95,
    "aliases": [
      "Odesa",
      "Odessa"
    ],
    "exposures": [
      "grain",
      "Black Sea shipping"
    ],
    "monitorFor": [
      "attack",
      "port closure",
      "corridor"
    ]
  },
  {
    "id": "novorossiysk",
    "name": "Novorossiysk",
    "regionId": "russia-eurasia",
    "countryCode": "RU",
    "lat": 44.72,
    "lon": 37.77,
    "type": "energy-port",
    "importance": 98,
    "aliases": [
      "Novorossiysk"
    ],
    "exposures": [
      "Russian crude",
      "CPC crude",
      "Black Sea"
    ],
    "monitorFor": [
      "loading suspension",
      "drone attack",
      "storm closure"
    ]
  },
  {
    "id": "primorsk",
    "name": "Primorsk",
    "regionId": "russia-eurasia",
    "countryCode": "RU",
    "lat": 60.37,
    "lon": 28.61,
    "type": "energy-port",
    "importance": 92,
    "aliases": [
      "Primorsk"
    ],
    "exposures": [
      "Russian Baltic crude"
    ],
    "monitorFor": [
      "sanctions",
      "loading disruption"
    ]
  },
  {
    "id": "ust-luga",
    "name": "Ust-Luga",
    "regionId": "russia-eurasia",
    "countryCode": "RU",
    "lat": 59.67,
    "lon": 28.28,
    "type": "energy-port",
    "importance": 94,
    "aliases": [
      "Ust-Luga",
      "Ust Luga"
    ],
    "exposures": [
      "Russian oil products",
      "LNG",
      "Baltic shipping"
    ],
    "monitorFor": [
      "attack",
      "terminal outage",
      "sanctions"
    ]
  },
  {
    "id": "murmansk",
    "name": "Murmansk",
    "regionId": "russia-eurasia",
    "countryCode": "RU",
    "lat": 68.97,
    "lon": 33.08,
    "type": "arctic-port",
    "importance": 88,
    "aliases": [
      "Murmansk"
    ],
    "exposures": [
      "Arctic shipping",
      "military"
    ],
    "monitorFor": [
      "Northern Fleet",
      "port disruption"
    ]
  },
  {
    "id": "kaliningrad",
    "name": "Kaliningrad",
    "regionId": "russia-eurasia",
    "countryCode": "RU",
    "lat": 54.71,
    "lon": 20.51,
    "type": "military-enclave",
    "importance": 94,
    "aliases": [
      "Kaliningrad"
    ],
    "exposures": [
      "Baltic security"
    ],
    "monitorFor": [
      "military deployment",
      "transit restriction"
    ]
  },
  {
    "id": "suwalki",
    "name": "Suwalki Gap",
    "regionId": "europe",
    "countryCode": "PL",
    "lat": 54.1,
    "lon": 23.1,
    "type": "land-corridor",
    "importance": 97,
    "aliases": [
      "Suwalki Gap",
      "Suwałki Gap"
    ],
    "exposures": [
      "NATO Baltic access"
    ],
    "monitorFor": [
      "exercise",
      "border closure",
      "reinforcement"
    ]
  },
  {
    "id": "rotterdam",
    "name": "Port of Rotterdam",
    "regionId": "europe",
    "countryCode": "NL",
    "lat": 51.95,
    "lon": 4.14,
    "type": "mega-port",
    "importance": 94,
    "aliases": [
      "Rotterdam",
      "Port of Rotterdam"
    ],
    "exposures": [
      "European energy",
      "containers",
      "chemicals"
    ],
    "monitorFor": [
      "strike",
      "cyber",
      "Rhine disruption"
    ]
  },
  {
    "id": "antwerp",
    "name": "Port of Antwerp-Bruges",
    "regionId": "europe",
    "countryCode": "BE",
    "lat": 51.27,
    "lon": 4.4,
    "type": "mega-port",
    "importance": 91,
    "aliases": [
      "Antwerp",
      "Antwerp-Bruges"
    ],
    "exposures": [
      "European chemicals",
      "containers"
    ],
    "monitorFor": [
      "strike",
      "cyber",
      "congestion"
    ]
  },
  {
    "id": "druzhba",
    "name": "Druzhba Pipeline",
    "regionId": "europe",
    "countryCode": "PL",
    "lat": 52.0,
    "lon": 23.0,
    "type": "pipeline",
    "importance": 92,
    "aliases": [
      "Druzhba",
      "Druzhba pipeline"
    ],
    "exposures": [
      "Central European crude"
    ],
    "monitorFor": [
      "flow halt",
      "sanctions",
      "damage"
    ]
  },
  {
    "id": "yamal",
    "name": "Yamal LNG",
    "regionId": "russia-eurasia",
    "countryCode": "RU",
    "lat": 71.25,
    "lon": 72.1,
    "type": "lng-hub",
    "importance": 91,
    "aliases": [
      "Yamal LNG",
      "Sabetta"
    ],
    "exposures": [
      "LNG",
      "Arctic shipping"
    ],
    "monitorFor": [
      "sanctions",
      "ice route",
      "outage"
    ]
  },
  {
    "id": "hsinchu",
    "name": "Hsinchu Science Park",
    "regionId": "strategic-asia",
    "countryCode": "TW",
    "lat": 24.78,
    "lon": 121.0,
    "type": "semiconductor-cluster",
    "importance": 100,
    "aliases": [
      "Hsinchu",
      "Hsinchu Science Park"
    ],
    "exposures": [
      "advanced semiconductors"
    ],
    "monitorFor": [
      "power outage",
      "earthquake",
      "blockade",
      "water shortage"
    ]
  },
  {
    "id": "kaohsiung",
    "name": "Kaohsiung",
    "regionId": "strategic-asia",
    "countryCode": "TW",
    "lat": 22.62,
    "lon": 120.3,
    "type": "port-industrial",
    "importance": 94,
    "aliases": [
      "Kaohsiung"
    ],
    "exposures": [
      "Taiwan shipping",
      "petrochemicals"
    ],
    "monitorFor": [
      "port closure",
      "military exercise"
    ]
  },
  {
    "id": "keelung",
    "name": "Keelung",
    "regionId": "strategic-asia",
    "countryCode": "TW",
    "lat": 25.13,
    "lon": 121.74,
    "type": "port",
    "importance": 88,
    "aliases": [
      "Keelung"
    ],
    "exposures": [
      "Taiwan imports"
    ],
    "monitorFor": [
      "blockade",
      "port closure"
    ]
  },
  {
    "id": "okinawa",
    "name": "Okinawa/Ryukyu",
    "regionId": "strategic-asia",
    "countryCode": "JP",
    "lat": 26.33,
    "lon": 127.8,
    "type": "military-corridor",
    "importance": 96,
    "aliases": [
      "Okinawa",
      "Ryukyu"
    ],
    "exposures": [
      "US-Japan posture",
      "Taiwan contingency"
    ],
    "monitorFor": [
      "base alert",
      "missile deployment",
      "evacuation"
    ]
  },
  {
    "id": "yokosuka",
    "name": "Yokosuka",
    "regionId": "strategic-asia",
    "countryCode": "JP",
    "lat": 35.28,
    "lon": 139.67,
    "type": "naval-base",
    "importance": 95,
    "aliases": [
      "Yokosuka"
    ],
    "exposures": [
      "US Navy Japan"
    ],
    "monitorFor": [
      "carrier deployment",
      "base alert"
    ]
  },
  {
    "id": "busan",
    "name": "Busan",
    "regionId": "strategic-asia",
    "countryCode": "KR",
    "lat": 35.1,
    "lon": 129.04,
    "type": "mega-port",
    "importance": 91,
    "aliases": [
      "Busan"
    ],
    "exposures": [
      "Korean exports",
      "naval logistics"
    ],
    "monitorFor": [
      "port disruption",
      "military alert"
    ]
  },
  {
    "id": "pyeongtaek",
    "name": "Pyeongtaek/Camp Humphreys",
    "regionId": "strategic-asia",
    "countryCode": "KR",
    "lat": 36.96,
    "lon": 127.04,
    "type": "military-base",
    "importance": 94,
    "aliases": [
      "Camp Humphreys",
      "Pyeongtaek"
    ],
    "exposures": [
      "US-ROK posture"
    ],
    "monitorFor": [
      "alert",
      "deployment",
      "evacuation"
    ]
  },
  {
    "id": "dmz",
    "name": "Korean DMZ",
    "regionId": "strategic-asia",
    "countryCode": "KR",
    "lat": 38.0,
    "lon": 127.0,
    "type": "military-frontier",
    "importance": 100,
    "aliases": [
      "DMZ",
      "demilitarized zone",
      "demilitarised zone"
    ],
    "exposures": [
      "Korean security"
    ],
    "monitorFor": [
      "artillery",
      "incursion",
      "border closure"
    ]
  },
  {
    "id": "shanghai",
    "name": "Shanghai/Yangshan",
    "regionId": "strategic-asia",
    "countryCode": "CN",
    "lat": 31.1,
    "lon": 121.7,
    "type": "mega-port",
    "importance": 96,
    "aliases": [
      "Shanghai port",
      "Yangshan"
    ],
    "exposures": [
      "global containers",
      "China exports"
    ],
    "monitorFor": [
      "closure",
      "typhoon",
      "strike",
      "lockdown"
    ]
  },
  {
    "id": "ningbo",
    "name": "Ningbo-Zhoushan",
    "regionId": "strategic-asia",
    "countryCode": "CN",
    "lat": 29.9,
    "lon": 121.9,
    "type": "mega-port",
    "importance": 95,
    "aliases": [
      "Ningbo",
      "Zhoushan"
    ],
    "exposures": [
      "containers",
      "oil",
      "China exports"
    ],
    "monitorFor": [
      "closure",
      "terminal outage"
    ]
  },
  {
    "id": "shenzhen",
    "name": "Shenzhen/Yantian",
    "regionId": "strategic-asia",
    "countryCode": "CN",
    "lat": 22.58,
    "lon": 114.27,
    "type": "mega-port-tech",
    "importance": 94,
    "aliases": [
      "Shenzhen",
      "Yantian"
    ],
    "exposures": [
      "electronics",
      "containers"
    ],
    "monitorFor": [
      "port disruption",
      "export control"
    ]
  },
  {
    "id": "hainan",
    "name": "Hainan",
    "regionId": "strategic-asia",
    "countryCode": "CN",
    "lat": 19.2,
    "lon": 109.7,
    "type": "military-island",
    "importance": 91,
    "aliases": [
      "Hainan"
    ],
    "exposures": [
      "South China Sea posture"
    ],
    "monitorFor": [
      "naval deployment",
      "exercise"
    ]
  },
  {
    "id": "luzon",
    "name": "Luzon Strait",
    "regionId": "strategic-asia",
    "countryCode": "PH",
    "lat": 20.0,
    "lon": 121.0,
    "type": "chokepoint",
    "importance": 96,
    "aliases": [
      "Luzon Strait",
      "Bashi Channel"
    ],
    "exposures": [
      "Taiwan shipping",
      "submarine routes",
      "cables"
    ],
    "monitorFor": [
      "exercise",
      "cable disruption",
      "blockade"
    ]
  },
  {
    "id": "second-thomas",
    "name": "Second Thomas Shoal",
    "regionId": "strategic-asia",
    "countryCode": "PH",
    "lat": 9.75,
    "lon": 115.85,
    "type": "dispute-zone",
    "importance": 92,
    "aliases": [
      "Second Thomas Shoal",
      "Ayungin Shoal"
    ],
    "exposures": [
      "South China Sea security"
    ],
    "monitorFor": [
      "collision",
      "water cannon",
      "blockade"
    ]
  },
  {
    "id": "scarborough",
    "name": "Scarborough Shoal",
    "regionId": "strategic-asia",
    "countryCode": "PH",
    "lat": 15.15,
    "lon": 117.75,
    "type": "dispute-zone",
    "importance": 90,
    "aliases": [
      "Scarborough Shoal"
    ],
    "exposures": [
      "South China Sea security"
    ],
    "monitorFor": [
      "coast guard confrontation",
      "exclusion"
    ]
  },
  {
    "id": "houston",
    "name": "Houston Ship Channel",
    "regionId": "north-america",
    "countryCode": "US",
    "lat": 29.73,
    "lon": -95.1,
    "type": "energy-port",
    "importance": 96,
    "aliases": [
      "Houston Ship Channel",
      "Houston port"
    ],
    "exposures": [
      "US refining",
      "petrochemicals",
      "exports"
    ],
    "monitorFor": [
      "hurricane",
      "closure",
      "cyber",
      "collision"
    ]
  },
  {
    "id": "cushing",
    "name": "Cushing Oklahoma",
    "regionId": "north-america",
    "countryCode": "US",
    "lat": 35.98,
    "lon": -96.77,
    "type": "oil-storage",
    "importance": 91,
    "aliases": [
      "Cushing"
    ],
    "exposures": [
      "WTI",
      "US crude inventories"
    ],
    "monitorFor": [
      "storage constraint",
      "pipeline outage"
    ]
  },
  {
    "id": "freeport-lng",
    "name": "Freeport LNG",
    "regionId": "north-america",
    "countryCode": "US",
    "lat": 28.94,
    "lon": -95.32,
    "type": "lng-hub",
    "importance": 94,
    "aliases": [
      "Freeport LNG"
    ],
    "exposures": [
      "US LNG",
      "European gas"
    ],
    "monitorFor": [
      "outage",
      "restart",
      "force majeure"
    ]
  },
  {
    "id": "sabine-pass",
    "name": "Sabine Pass LNG",
    "regionId": "north-america",
    "countryCode": "US",
    "lat": 29.73,
    "lon": -93.87,
    "type": "lng-hub",
    "importance": 93,
    "aliases": [
      "Sabine Pass"
    ],
    "exposures": [
      "US LNG"
    ],
    "monitorFor": [
      "outage",
      "shipping restriction"
    ]
  },
  {
    "id": "la-longbeach",
    "name": "Los Angeles / Long Beach",
    "regionId": "north-america",
    "countryCode": "US",
    "lat": 33.74,
    "lon": -118.24,
    "type": "mega-port",
    "importance": 95,
    "aliases": [
      "Port of Los Angeles",
      "Long Beach port",
      "Los Angeles port"
    ],
    "exposures": [
      "US-Asia containers"
    ],
    "monitorFor": [
      "strike",
      "congestion",
      "tariffs"
    ]
  },
  {
    "id": "ny-finance",
    "name": "New York financial system",
    "regionId": "north-america",
    "countryCode": "US",
    "lat": 40.71,
    "lon": -74.0,
    "type": "financial-center",
    "importance": 94,
    "aliases": [
      "Wall Street",
      "New York financial system"
    ],
    "exposures": [
      "USD markets",
      "banks",
      "equities"
    ],
    "monitorFor": [
      "market closure",
      "cyber",
      "liquidity stress"
    ]
  },
  {
    "id": "washington",
    "name": "Washington policy center",
    "regionId": "north-america",
    "countryCode": "US",
    "lat": 38.9,
    "lon": -77.04,
    "type": "policy-center",
    "importance": 95,
    "aliases": [
      "Washington DC",
      "White House",
      "Capitol Hill"
    ],
    "exposures": [
      "sanctions",
      "tariffs",
      "defence",
      "fiscal"
    ],
    "monitorFor": [
      "executive order",
      "sanctions",
      "tariff",
      "military authorization"
    ]
  }
]);
