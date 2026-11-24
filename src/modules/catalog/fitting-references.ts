import type {DemoProduct} from "./marketplace.ts";
export type FittingRef={slug:string;name:string;hi:string;group:"tank"|"pump";material:string;sizes:string[];use:string;compat:string;price:number|null;priceSize:string|null;source:string|null;image?:string;imageSource?:string;legacy?:string;brand?:string;legacySlug?:string;aliases?:string[];priceMarket?:string};
export const fittingReferences:FittingRef[]=[
  {
    "slug": "fitting-tank-nipple",
    "name": "Threaded tank nipple / bulkhead fitting",
    "hi": "टंकी निप्पल",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Connect tank outlet to distribution pipe",
    "compat": "Match gasket, tank opening and thread",
    "price": 52,
    "priceSize": "¾ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "image": "https://www.ashirvad.com/wp-content/uploads/2025/10/Ashirvad_CPVC_Fitting_Tank-nipple-with-one-side-pipe-fitment.png",
    "aliases": [
      "tank connector",
      "bulkhead tank fitting"
    ],
    "brand": "Ashirvad",
    "imageSource": "https://www.ashirvad.com/solution/ashirvad-flowguard-plus-cpvc-piping-system/"
  },
  {
    "slug": "fitting-elbow90",
    "name": "90° elbow",
    "hi": "एल्बो",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Turn pipe 90°",
    "compat": "Match pipe series and socket",
    "price": 16,
    "priceSize": "½ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "image": "https://www.ashirvad.com/wp-content/uploads/2025/10/Ashirvad_CPVC_Fitting_Elbow-90%E2%81%B0.png",
    "legacy": "generic-plumbing-fitting",
    "brand": "Ashirvad",
    "imageSource": "https://www.ashirvad.com/solution/ashirvad-flowguard-plus-cpvc-piping-system/"
  },
  {
    "slug": "fitting-tee",
    "name": "Equal tee",
    "hi": "टी फिटिंग",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Branch equal-size pipes",
    "compat": "Match all socket sizes",
    "price": 23,
    "priceSize": "½ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "legacy": "generic-tee",
    "brand": "Ashirvad"
  },
  {
    "slug": "fitting-socket",
    "name": "Coupler / socket",
    "hi": "सॉकेट",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Join straight pipe ends",
    "compat": "Match pipe series",
    "price": 13,
    "priceSize": "½ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "legacy": "generic-coupler",
    "brand": "Ashirvad"
  },
  {
    "slug": "fitting-reducer",
    "name": "Reducer coupler",
    "hi": "रिड्यूसर सॉकेट",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "¾ × ½ inch",
      "1 × ½ inch",
      "1 × ¾ inch"
    ],
    "use": "Join different sizes",
    "compat": "Check both diameters",
    "price": 24,
    "priceSize": "¾ × ½ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "legacy": "generic-reducer",
    "brand": "Ashirvad"
  },
  {
    "slug": "fitting-union",
    "name": "Detachable union",
    "hi": "यूनियन",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Disconnect pipe for service",
    "compat": "Match sealing face and pressure",
    "price": 54,
    "priceSize": "½ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "legacy": "generic-union",
    "aliases": [
      "PVC CPVC tank union"
    ],
    "brand": "Ashirvad"
  },
  {
    "slug": "fitting-ball-valve",
    "name": "Ball valve",
    "hi": "बॉल वाल्व",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Isolate water supply",
    "compat": "Match pressure, temperature and connection",
    "price": 97,
    "priceSize": "½ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "image": "https://www.ashirvad.com/wp-content/uploads/2025/10/Ashirvad_CPVC_Fitting_Ball-Valve.png",
    "legacy": "generic-ball-valve",
    "brand": "Ashirvad",
    "imageSource": "https://www.ashirvad.com/solution/ashirvad-flowguard-plus-cpvc-piping-system/"
  },
  {
    "slug": "fitting-pipe-strap",
    "name": "Metal pipe clamp / strap",
    "hi": "पाइप क्लैंप",
    "group": "tank",
    "material": "Metal",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Support pipe",
    "compat": "Match outside diameter and support spacing",
    "price": 8,
    "priceSize": "½ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "image": "https://www.ashirvad.com/wp-content/uploads/2025/10/Ashirvad_CPVC_Fitting_Powder-coated-clamp.png",
    "legacy": "generic-pipe-clamp",
    "brand": "Ashirvad",
    "imageSource": "https://www.ashirvad.com/solution/ashirvad-flowguard-plus-cpvc-piping-system/"
  },
  {
    "slug": "fitting-solvent",
    "name": "CPVC solvent cement",
    "hi": "सीपीवीसी सॉल्वेंट",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "Pack to confirm"
    ],
    "use": "Join compatible solvent fittings",
    "compat": "Check approved cement and instructions",
    "price": null,
    "priceSize": null,
    "source": "https://home-run.co/collections/plumbing",
    "image": "https://www.ashirvad.com/wp-content/uploads/2025/10/1-Step-CPVC-Solvent-Cement-Yellow-Coloured.png",
    "legacy": "generic-solvent",
    "brand": "Ashirvad",
    "imageSource": "https://www.ashirvad.com/solution/ashirvad-flowguard-plus-cpvc-piping-system/"
  },
  {
    "slug": "fitting-ptfe",
    "name": "PTFE thread seal tape",
    "hi": "टेफ्लॉन टेप",
    "group": "tank",
    "material": "PTFE",
    "sizes": [
      "12 mm × 10 m"
    ],
    "use": "Seal compatible threads",
    "compat": "Check water and thread suitability",
    "price": 30,
    "priceSize": "12 mm × 10 m",
    "source": "https://home-run.co/collections/plumbing",
    "aliases": [
      "thread seal tape",
      "teflon tape"
    ],
    "brand": "Viking"
  },
  {
    "slug": "fitting-reducer-tee",
    "name": "Reducer tee",
    "hi": "रिड्यूसर टी",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "¾ × ¾ × ½ inch",
      "1 × 1 × ½ inch",
      "1 × 1 × ¾ inch"
    ],
    "use": "Branch smaller pipe",
    "compat": "Match three socket sizes",
    "price": 48,
    "priceSize": "¾ × ¾ × ½ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "image": "https://www.ashirvad.com/wp-content/uploads/2025/10/Reducer-TEE.png",
    "brand": "Ashirvad",
    "imageSource": "https://www.ashirvad.com/solution/ashirvad-flowguard-plus-cpvc-piping-system/"
  },
  {
    "slug": "fitting-end-cap",
    "name": "End cap",
    "hi": "एंड कैप",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Close pipe end",
    "compat": "Match pressure class",
    "price": 11,
    "priceSize": "½ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "brand": "Ashirvad"
  },
  {
    "slug": "fitting-brass-elbow",
    "name": "Brass threaded elbow",
    "hi": "ब्रास एल्बो",
    "group": "tank",
    "material": "CPVC / Brass",
    "sizes": [
      "½ × ½ inch",
      "¾ × ½ inch",
      "¾ × ¾ inch"
    ],
    "use": "Connect threaded fixture at bend",
    "compat": "Check insert and thread",
    "price": 69,
    "priceSize": "½ × ½ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "brand": "Ashirvad"
  },
  {
    "slug": "fitting-sweep",
    "name": "Long-radius sweep bend",
    "hi": "लॉन्ग बेंड",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Change direction gradually",
    "compat": "Confirm available space",
    "price": 46,
    "priceSize": "¾ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "image": "https://www.ashirvad.com/wp-content/uploads/2025/10/Ashirvad_CPVC_Fitting_Sweep-bend-Socket-at-both-sides.png",
    "brand": "Ashirvad",
    "imageSource": "https://www.ashirvad.com/solution/ashirvad-flowguard-plus-cpvc-piping-system/"
  },
  {
    "slug": "fitting-plug",
    "name": "Threaded end plug",
    "hi": "थ्रेड प्लग",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "½ inch",
      "¾ inch"
    ],
    "use": "Close threaded port",
    "compat": "Match thread",
    "price": 8,
    "priceSize": "½ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "image": "https://www.ashirvad.com/wp-content/uploads/2025/10/Ashirvad_CP-Valves-_-Accessories_Spare_Concealed-valve_Threaded-end-plug.png",
    "brand": "Ashirvad",
    "imageSource": "https://www.ashirvad.com/solution/ashirvad-flowguard-plus-cpvc-piping-system/"
  },
  {
    "slug": "fitting-male-brass",
    "name": "Male brass threaded adapter (MABT)",
    "hi": "मेल ब्रास अडैप्टर",
    "group": "tank",
    "material": "CPVC / Brass",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Connect socket to male thread",
    "compat": "Match thread standard",
    "price": 160,
    "priceSize": "½ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "image": "https://www.ashirvad.com/wp-content/uploads/2025/10/Ashirvad_CPVC_Fitting_MABT.png",
    "brand": "Ashirvad",
    "imageSource": "https://www.ashirvad.com/solution/ashirvad-flowguard-plus-cpvc-piping-system/"
  },
  {
    "slug": "fitting-male-plastic",
    "name": "Male plastic threaded adapter (MAPT)",
    "hi": "मेल अडैप्टर",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Convert socket to male thread",
    "compat": "Match pipe series and thread",
    "price": 23,
    "priceSize": "¾ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "image": "https://www.ashirvad.com/wp-content/uploads/2025/10/Male-Adaptor-Plastic-Threaded.png",
    "aliases": [
      "MTA",
      "male threaded adaptor"
    ],
    "brand": "Ashirvad",
    "imageSource": "https://www.ashirvad.com/solution/ashirvad-flowguard-plus-cpvc-piping-system/"
  },
  {
    "slug": "fitting-female-plastic",
    "name": "Female plastic threaded adapter (FAPT)",
    "hi": "फीमेल अडैप्टर",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Convert socket to female thread",
    "compat": "Match thread standard",
    "price": 20,
    "priceSize": "½ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "image": "https://www.ashirvad.com/wp-content/uploads/2025/10/Female-Adaptor-Plastic-Threaded-FAPT.png",
    "aliases": [
      "FTA",
      "female threaded adaptor"
    ],
    "brand": "Ashirvad",
    "imageSource": "https://www.ashirvad.com/solution/ashirvad-flowguard-plus-cpvc-piping-system/"
  },
  {
    "slug": "fitting-float-valve",
    "name": "Mechanical float valve / ball cock",
    "hi": "टंकी फ्लोट वाल्व",
    "group": "tank",
    "material": "Brass / PVC",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch"
    ],
    "use": "Stop tank inlet when full",
    "compat": "Match inlet thread and pressure",
    "price": null,
    "priceSize": null,
    "source": "https://www.bajajvalve.com/float-valve.html"
  },
  {
    "slug": "fitting-overflow",
    "name": "Tank overflow connector / screen",
    "hi": "ओवरफ्लो फिटिंग",
    "group": "tank",
    "material": "uPVC",
    "sizes": [
      "1 inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Route overflow",
    "compat": "Size to inlet flow and opening",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-gasket",
    "name": "Tank connector gasket",
    "hi": "टंकी रबर वॉशर",
    "group": "tank",
    "material": "Rubber",
    "sizes": [
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Seal tank wall penetration",
    "compat": "Match gasket dimensions and water compatibility",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-cross",
    "name": "Four-way cross fitting",
    "hi": "क्रॉस फिटिंग",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "½ inch",
      "¾ inch"
    ],
    "use": "Join four lines",
    "compat": "Match pressure and pipe series",
    "price": null,
    "priceSize": null,
    "source": null,
    "image": "https://www.ashirvad.com/wp-content/uploads/2025/10/Ashirvad_CPVC_Fitting_Cross-Tee-1.png",
    "brand": "Ashirvad",
    "imageSource": "https://www.ashirvad.com/solution/ashirvad-flowguard-plus-cpvc-piping-system/"
  },
  {
    "slug": "fitting-gate-valve",
    "name": "Gate valve",
    "hi": "गेट वाल्व",
    "group": "tank",
    "material": "Brass / GI",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Isolate water supply",
    "compat": "Match pressure and connection",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-angle-valve",
    "name": "Angle stop valve",
    "hi": "एंगल वाल्व",
    "group": "tank",
    "material": "Brass",
    "sizes": [
      "½ inch",
      "¾ inch"
    ],
    "use": "Isolate fixture",
    "compat": "Match inlet and outlet",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-bib-cock",
    "name": "Bib cock / tap",
    "hi": "टोंटी",
    "group": "tank",
    "material": "Brass / PVC",
    "sizes": [
      "½ inch",
      "¾ inch"
    ],
    "use": "Water draw-off",
    "compat": "Match thread and pressure",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-saddle",
    "name": "Service saddle",
    "hi": "सर्विस सैडल",
    "group": "tank",
    "material": "HDPE / uPVC",
    "sizes": [
      "Size to confirm"
    ],
    "use": "Branch from compatible main",
    "compat": "Match pipe outside diameter",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-grommet",
    "name": "Pipe penetration grommet",
    "hi": "रबर ग्रोमेट",
    "group": "tank",
    "material": "Rubber",
    "sizes": [
      "Size to confirm"
    ],
    "use": "Protect pipe penetration",
    "compat": "Not a pressure seal unless rated",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-nrv",
    "name": "Inline non-return valve (NRV)",
    "hi": "नॉन रिटर्न वाल्व",
    "group": "pump",
    "material": "CPVC",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Prevent backflow",
    "compat": "Match direction, pressure and connection",
    "price": null,
    "priceSize": null,
    "source": null,
    "aliases": [
      "check valve",
      "non return valve"
    ],
    "image": "https://www.ashirvad.com/wp-content/uploads/2025/10/Ashirvad_CPVC_Fitting_Non-Return-Valve.png",
    "brand": "Ashirvad",
    "imageSource": "https://www.ashirvad.com/solution/ashirvad-flowguard-plus-cpvc-piping-system/"
  },
  {
    "slug": "fitting-foot-valve",
    "name": "Foot valve with strainer",
    "hi": "फुट वाल्व जाली सहित",
    "group": "pump",
    "material": "Brass / GI / uPVC",
    "sizes": [
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Retain pump prime and screen debris",
    "compat": "Match pump suction size",
    "price": null,
    "priceSize": null,
    "source": "https://www.industrybuying.com/pumps-1160/pump-fittings-accessories-4002",
    "aliases": [
      "foot valve",
      "foot valve with strainer"
    ]
  },
  {
    "slug": "fitting-delivery-hose",
    "name": "Pressure-rated delivery hose",
    "hi": "डिलीवरी होज़",
    "group": "pump",
    "material": "PVC / Rubber",
    "sizes": [
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Carry pump discharge",
    "compat": "Match working pressure and bore",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-hose-clamp",
    "name": "Worm-drive hose clamp",
    "hi": "होज़ क्लैंप",
    "group": "pump",
    "material": "SS",
    "sizes": [
      "Size to confirm"
    ],
    "use": "Secure hose",
    "compat": "Match hose outside diameter",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-brass-nipple",
    "name": "Brass threaded nipple",
    "hi": "पीतल निप्पल",
    "group": "pump",
    "material": "Brass",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Join female ports",
    "compat": "Match thread and length",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-gi-nipple",
    "name": "GI threaded nipple",
    "hi": "जीआई निप्पल",
    "group": "pump",
    "material": "GI",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Join GI ports",
    "compat": "Check thread and coating",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-pressure-gauge",
    "name": "Water pressure gauge",
    "hi": "प्रेशर गेज",
    "group": "pump",
    "material": "Brass / SS",
    "sizes": [
      "¼ inch",
      "½ inch"
    ],
    "use": "Read water pressure",
    "compat": "Match range and connection",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-pressure-switch",
    "name": "Pump pressure switch",
    "hi": "प्रेशर स्विच",
    "group": "pump",
    "material": "Electrical",
    "sizes": [
      "Rating to confirm"
    ],
    "use": "Control compatible pressure pump",
    "compat": "Electrician to verify motor rating and controller",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-float-switch",
    "name": "Electrical tank float switch",
    "hi": "फ्लोट स्विच",
    "group": "pump",
    "material": "Electrical",
    "sizes": [
      "Cable length to confirm"
    ],
    "use": "Signal water level",
    "compat": "Electrician to verify control rating",
    "price": null,
    "priceSize": null,
    "source": "https://www.moglix.com/damor-float-switch-with-2m-pvc-cable/mp/msn457mwmz2q9j"
  },
  {
    "slug": "fitting-pump-union",
    "name": "Threaded pump union",
    "hi": "पंप यूनियन",
    "group": "pump",
    "material": "Brass / GI",
    "sizes": [
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Disconnect pump piping",
    "compat": "Match thread and seal",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-hose-barb",
    "name": "Hose barb adapter",
    "hi": "होज़ अडैप्टर",
    "group": "pump",
    "material": "Brass / PVC",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Connect hose to fitting",
    "compat": "Match bore and clamp",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-mechanical-seal",
    "name": "Pump mechanical seal",
    "hi": "मैकेनिकल सील",
    "group": "pump",
    "material": "Model-specific",
    "sizes": [
      "Model to confirm"
    ],
    "use": "Replace compatible shaft seal",
    "compat": "Match pump model and shaft diameter",
    "price": null,
    "priceSize": null,
    "source": null,
    "aliases": [
      "shaft seal"
    ]
  },
  {
    "slug": "fitting-impeller",
    "name": "Pump impeller spare",
    "hi": "इम्पेलर",
    "group": "pump",
    "material": "Model-specific",
    "sizes": [
      "Model to confirm"
    ],
    "use": "Replace worn impeller",
    "compat": "Match model and rotation",
    "price": null,
    "priceSize": null,
    "source": null,
    "aliases": [
      "impeller spare"
    ]
  },
  {
    "slug": "fitting-suction-hose",
    "name": "Vacuum-rated suction hose",
    "hi": "सक्शन होज़",
    "group": "pump",
    "material": "PVC / Rubber",
    "sizes": [
      "25 mm",
      "32 mm",
      "50 mm"
    ],
    "use": "Carry pump suction water",
    "compat": "Match vacuum rating and bore",
    "price": null,
    "priceSize": null,
    "source": null,
    "legacy": "generic-suction-hose"
  },
  {
    "slug": "fitting-strainer",
    "name": "Separate suction strainer",
    "hi": "सक्शन जाली",
    "group": "pump",
    "material": "SS / PVC",
    "sizes": [
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Screen inlet debris",
    "compat": "Not a non-return valve",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-tank-lid",
    "name": "Tank lid clamp / retaining accessory",
    "hi": "टंकी ढक्कन क्लैंप",
    "group": "tank",
    "material": "Plastic / SS",
    "sizes": [
      "Model to confirm"
    ],
    "use": "Secure compatible tank cover",
    "compat": "Match manufacturer lid profile and attachment; do not drill tank without approval",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-tank-inlet",
    "name": "Tank inlet adapter",
    "hi": "टंकी इनलेट अडैप्टर",
    "group": "tank",
    "material": "PVC / uPVC / Brass",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch"
    ],
    "use": "Connect fill line to tank inlet",
    "compat": "Match tank port, thread and float valve",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-tank-outlet",
    "name": "Tank outlet adapter",
    "hi": "टंकी आउटलेट अडैप्टर",
    "group": "tank",
    "material": "PVC / uPVC / Brass",
    "sizes": [
      "¾ inch",
      "1 inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Connect outlet to distribution line",
    "compat": "Match tank connector and outlet thread; not the tank-wall bulkhead itself",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-tank-drain",
    "name": "Tank cleaning drain fitting",
    "hi": "टंकी सफाई ड्रेन",
    "group": "tank",
    "material": "PVC / uPVC",
    "sizes": [
      "1 inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Drain tank for cleaning",
    "compat": "Confirm designated drain port, valve and discharge route",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-threaded-reducer",
    "name": "Threaded reducing bush",
    "hi": "थ्रेड रिड्यूसर बुश",
    "group": "tank",
    "material": "Brass / PVC / CPVC",
    "sizes": [
      "¾ × ½ inch",
      "1 × ¾ inch",
      "1½ × 1 inch"
    ],
    "use": "Reduce a threaded outlet",
    "compat": "Match male and female thread standard; not a solvent reducer coupler",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-saddle-clamp",
    "name": "Saddle pipe support clamp",
    "hi": "सैडल क्लैंप",
    "group": "tank",
    "material": "SS / PVC",
    "sizes": [
      "20 mm",
      "25 mm",
      "32 mm",
      "50 mm"
    ],
    "use": "Support pipe against a surface",
    "compat": "Match outside diameter; not a tapping service saddle",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-u-clamp",
    "name": "U-shaped pipe support clamp",
    "hi": "यू क्लैंप",
    "group": "tank",
    "material": "GI / SS",
    "sizes": [
      "25 mm",
      "32 mm",
      "50 mm"
    ],
    "use": "Support pipe on bracket",
    "compat": "Match outside diameter and load",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-flex-connector",
    "name": "Flexible braided water connector",
    "hi": "फ्लेक्सिबल कनेक्टर",
    "group": "tank",
    "material": "SS / Rubber",
    "sizes": [
      "½ inch",
      "¾ inch"
    ],
    "use": "Connect compatible fixture or supply",
    "compat": "Match end thread, pressure and temperature",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-pump-adapter",
    "name": "Pump threaded pipe adapter",
    "hi": "पंप अडैप्टर",
    "group": "pump",
    "material": "Brass / GI / uPVC",
    "sizes": [
      "¾ inch",
      "1 inch",
      "1¼ inch",
      "1½ inch",
      "2 inch"
    ],
    "use": "Adapt pump port to compatible pipe",
    "compat": "Match pump inlet or outlet thread and pressure",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-motor-starter",
    "name": "Pump motor starter / overload protection",
    "hi": "मोटर स्टार्टर",
    "group": "pump",
    "material": "Electrical",
    "sizes": [
      "Rating to confirm"
    ],
    "use": "Switch and protect motor",
    "compat": "Qualified electrician must match supply, motor nameplate and protection",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-pump-cable",
    "name": "Pump cable joint connector kit",
    "hi": "पंप केबल जॉइंट",
    "group": "pump",
    "material": "Electrical",
    "sizes": [
      "Rating to confirm"
    ],
    "use": "Connect compatible pump cable",
    "compat": "Qualified electrician must match cable, voltage, immersion rating and approved joint system",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-anti-vibration",
    "name": "Flexible pump anti-vibration connector",
    "hi": "वाइब्रेशन कनेक्टर",
    "group": "pump",
    "material": "Rubber / SS",
    "sizes": [
      "Size to confirm"
    ],
    "use": "Reduce transmitted vibration",
    "compat": "Match pressure, movement and connection; not a structural support",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-base-pad",
    "name": "Pump anti-vibration mounting pad",
    "hi": "मोटर रबर पैड",
    "group": "pump",
    "material": "Rubber",
    "sizes": [
      "Size to confirm"
    ],
    "use": "Isolate pump base vibration",
    "compat": "Match load and mounting design",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-gland-seal",
    "name": "Pump gland packing / seal",
    "hi": "ग्लैंड पैकिंग",
    "group": "pump",
    "material": "Model-specific",
    "sizes": [
      "Model to confirm"
    ],
    "use": "Replace packing on compatible gland-type pump",
    "compat": "Confirm pump uses packed gland rather than mechanical seal",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-hose-collar",
    "name": "Hose ferrule / crimp collar",
    "hi": "होज़ कॉलर",
    "group": "pump",
    "material": "SS / Metal",
    "sizes": [
      "Size to confirm"
    ],
    "use": "Retain hose on matching crimp fitting",
    "compat": "Match hose, ferrule and rated crimp system; not a worm-drive clamp",
    "price": null,
    "priceSize": null,
    "source": null
  },
  {
    "slug": "fitting-elbow45",
    "name": "45° elbow",
    "hi": "45 डिग्री एल्बो",
    "group": "tank",
    "material": "CPVC",
    "sizes": [
      "½ inch",
      "¾ inch",
      "1 inch"
    ],
    "use": "Change direction by 45 degrees",
    "compat": "Match pipe series and socket",
    "price": 19,
    "priceSize": "½ inch",
    "source": "https://home-run.co/pages/price-list/pipes-plumbing",
    "image": "/images/catalog/reference/ashirvad-elbow.webp",
    "brand": "Ashirvad",
    "legacySlug": "ashirvad-elbow-half"
  }
];
export const fittingReference=(slug:string)=>fittingReferences.find(r=>r.slug===slug);
export const fittingProducts:DemoProduct[]=fittingReferences.map(r=>({slug:r.slug,category:"plumbing",brand:r.brand??(r.image?(r.slug==="fitting-ptfe"?"Viking":"Ashirvad"):"Local supplier"),name:(r.brand?r.brand+" ":r.image?(r.slug==="fitting-ptfe"?"Viking ":"Ashirvad "):"")+r.name,verification:"reference",description:r.use+". "+r.compat+". Confirm actual supplier variant.",...(r.source?{referenceSource:r.source}:{}),specifications:[{label:"Hindi name",value:r.hi},{label:"Material / options",value:r.material},{label:"Requested sizes",value:r.sizes.join(", ")},{label:"Application",value:r.use},{label:"Compatibility",value:r.compat}]}));
export function fittingPrice(slug:string){const r=fittingReference(slug);return r?.price&&r.priceSize&&r.source?{rupees:r.price,size:r.priceSize,source:r.source,market:r.priceMarket??"Bengaluru historical retailer reference"}:null;}
export function isLegacyFitting(p:DemoProduct){return p.category==="plumbing"&&fittingReferences.some(r=>r.legacySlug===p.slug||Boolean(p.familyKey&&r.legacy===p.familyKey));}
