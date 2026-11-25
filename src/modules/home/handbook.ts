/** Versioned editorial registry. Stable IDs are public URL and checklist contracts. No review is implied by authoring. */
export const sourceDirectory={bis:{label:"Bureau of Indian Standards — current standards and amendments",url:"https://www.bis.gov.in/"},cpwd:{label:"CPWD — specifications and publications",url:"https://cpwd.gov.in/"},local:{label:"Local authority — identify the applicable city building rules and approvals",url:null},cea:{label:"Central Electricity Authority — applicable electrical safety regulations",url:"https://cea.nic.in/"},bee:{label:"Bureau of Energy Efficiency — building energy resources",url:"https://www.beeindia.gov.in/show_content.php?lang=1&level=2&lid=328&ls_id=202"}} as const;
export type SourceId=keyof typeof sourceDirectory;
export type Chapter={id:string;title:string;hi:string;kicker:string;intro:string;introHi:string;lessons:readonly string[];sources:readonly SourceId[];principles:readonly string[];checks:readonly string[];risks:readonly string[];example:{en:string;hi:string};keywords:string;tool:string;revision:number;updated:string;reviewDue:string;reviewStatus:"editorial-draft"|"professionally-reviewed";scope:string};
export const chapters:readonly Chapter[]=[
  {
    "id": "planning",
    "title": "Planning & approvals",
    "hi": "योजना और मंजूरी",
    "kicker": "Before spending on a building",
    "intro": "A good brief turns family needs, plot dimensions, budget and site limits into decisions a designer can verify. Buying materials before a coordinated plan often creates avoidable rework.",
    "introHi": "परिवार की जरूरत, प्लॉट के माप, बजट और स्थानीय नियम तय करके ही नक्शा और खरीदारी शुरू करें।",
    "lessons": [
      "spatial-thinking",
      "house-budget",
      "digital-models"
    ],
    "sources": [
      "local",
      "bis"
    ],
    "principles": [
      "Measure actual boundaries and road access; distinguish plot, usable and total built-up areas.",
      "List present and future occupants, accessibility, parking, light, ventilation and service needs.",
      "Ask a qualified designer to check local approvals, setbacks, height, coverage and fire requirements as applicable."
    ],
    "checks": [
      "Prepare a measured survey and a written family brief.",
      "Get coordinated architectural and structural drawings and a scope-based quotation.",
      "Confirm the approvals applicable to the location before site work."
    ],
    "risks": [
      "A beautiful facade is not evidence of buildability.",
      "Do not assume the same rules apply in every Indian municipality."
    ],
    "example": {
      "en": "A measured plot of 18 × 50 ft has 900 sq ft land area. Two floors each with 650 sq ft of constructed area total 1,300 sq ft under that assumed area definition; local approval limits still apply.",
      "hi": "18 × 50 फीट का प्लॉट 900 वर्ग फीट है। दो मंजिलों का वास्तविक निर्मित क्षेत्र अलग जोड़ें।"
    },
    "keywords": "Plot geometry, local approvals, accessibility, family brief",
    "tool": "/design-studio",
    "revision": 1,
    "updated": "2026-11-25",
    "reviewDue": "2027-05-25",
    "reviewStatus": "editorial-draft",
    "scope": "India; project-specific requirements vary"
  },
  {
    "id": "ground",
    "title": "Soil, foundations & underground",
    "hi": "मिट्टी, नींव और भूमिगत काम",
    "kicker": "Understand what you cannot see later",
    "intro": "Ground conditions and the building's loads determine foundation choices. Underground work is hard to inspect or repair after covering, so records matter.",
    "introHi": "मिट्टी, भूजल और भवन के भार के अनुसार नींव डिजाइन होती है। ढकने से पहले जांच और रिकॉर्ड जरूरी हैं।",
    "lessons": [
      "site-soil",
      "underground-work"
    ],
    "sources": [
      "bis",
      "cpwd",
      "local"
    ],
    "principles": [
      "A soil report helps identify settlement and groundwater risks; appearance alone cannot establish bearing capacity.",
      "Excavation safety and adjacent properties need a competent temporary works plan.",
      "Foundation, plinth and damp protection details must follow approved drawings; coordinate underground drains and sleeves."
    ],
    "checks": [
      "Confirm the geotechnical report, foundation drawing and excavation safety plan.",
      "Record bearing level, reinforcement and pre-pour inspections with the responsible professional.",
      "Test concealed drains and record routes before approved backfill."
    ],
    "risks": [
      "Do not copy footing dimensions from another plot.",
      "Stop and escalate unexpected water, unstable excavation or movement in neighbouring structures."
    ],
    "example": {
      "en": "A drain crossing a proposed footing should be coordinated before the concrete pour. Moving it later may require expensive redesign; never cut a structural member without approval.",
      "hi": "फुटिंग के पास पाइप की जगह पहले तय करें; बाद में बिना अनुमति कंक्रीट न काटें।"
    },
    "keywords": "soil investigation, PCC, footing, plinth, DPC, drainage",
    "tool": "/build-iq/underground-work",
    "revision": 1,
    "updated": "2026-11-25",
    "reviewDue": "2027-05-25",
    "reviewStatus": "editorial-draft",
    "scope": "India; project-specific requirements vary"
  },
  {
    "id": "structure",
    "title": "RCC, steel & structural systems",
    "hi": "आरसीसी और संरचना",
    "kicker": "Follow the load path",
    "intro": "Floors transfer loads through the structural system to the ground. A drawing establishes dimensions and reinforcement; a calculator measures specified work, not its safety.",
    "introHi": "छत और मंजिलों का भार संरचना से जमीन तक जाता है। माप और सरिया इंजीनियर के डिजाइन से ही तय करें।",
    "lessons": [
      "cement-mix",
      "steel-quantity",
      "site-errors"
    ],
    "sources": [
      "bis",
      "cpwd"
    ],
    "principles": [
      "Concrete, steel, formwork and curing work together; material grade alone does not guarantee performance.",
      "The bar bending schedule identifies diameter, shape and scheduled length. Estimate mass from that schedule.",
      "Keep concrete batch, workability and test records as specified. Alterations to structural members require approval."
    ],
    "checks": [
      "Check drawing revisions and the approved concrete mix and reinforcement schedule.",
      "Arrange qualified inspection before concrete placement.",
      "Keep test and curing records and resolve deviations before progressing."
    ],
    "risks": [
      "Do not choose bar spacing, cover, member sizes or mix based only on internet examples.",
      "Never treat an unapproved opening or added floor as a cosmetic change."
    ],
    "example": {
      "en": "A 12 mm bar has an estimated unit mass of about 0.888 kg/m at density 7,850 kg/m³. A scheduled total of 1,000 m is about 888 kg before allowance, not a recommendation for a house.",
      "hi": "12 mm सरिये का लगभग वजन 0.888 kg/m है; कुल स्वीकृत लंबाई से वजन निकालें।"
    },
    "keywords": "RCC, slab, beam, column, BBS, concrete mix, testing",
    "tool": "/build-iq#build-workbench-title",
    "revision": 1,
    "updated": "2026-11-25",
    "reviewDue": "2027-05-25",
    "reviewStatus": "editorial-draft",
    "scope": "India; project-specific requirements vary"
  },
  {
    "id": "masonry",
    "title": "Bricks, blocks & walls",
    "hi": "ईंट, ब्लॉक और दीवार",
    "kicker": "Choose a wall system, not just a brick",
    "intro": "Wall units vary in size, strength, moisture behaviour and mortar requirements. Installed cost includes mortar, labour, finishes and waste, not just piece price.",
    "introHi": "ईंट या ब्लॉक का चुनाव उपयोग, मजबूती, माप, नमी और कुल दीवार लागत से करें।",
    "lessons": [
      "brick-types",
      "brick-count",
      "materials-engineering"
    ],
    "sources": [
      "bis",
      "cpwd"
    ],
    "principles": [
      "Common Indian options include clay bricks, fly ash bricks, concrete blocks and AAC. Verify the specified unit and mortar system.",
      "Separate structural masonry from non-load-bearing partitions. Do not substitute without approval.",
      "Net area excludes openings; actual bond and modular dimensions affect unit counts. Account for separate lintel and service details."
    ],
    "checks": [
      "Check unit measurements, documented strength and product specification.",
      "Confirm openings, wall position and interfaces with the structural drawings.",
      "Inspect work before plastering and address defects with the contractor."
    ],
    "risks": [
      "Do not compare blocks and bricks by quantity alone.",
      "Do not chase or remove load-bearing walls without approved design."
    ],
    "example": {
      "en": "A 10 × 10 ft wall with 200 mm modular thickness and 190 × 90 × 90 mm bricks with 10 mm joints has about 929 units before waste, or 976 with 5% allowance. Verify the actual bond.",
      "hi": "10 × 10 फीट की उदाहरण दीवार में 200 mm मोटाई पर लगभग 929 ईंटें; 5% जोड़कर 976।"
    },
    "keywords": "brick, AAC, fly ash, wall thickness, mortar, openings",
    "tool": "/build-iq#build-workbench-title",
    "revision": 1,
    "updated": "2026-11-25",
    "reviewDue": "2027-05-25",
    "reviewStatus": "editorial-draft",
    "scope": "India; project-specific requirements vary"
  },
  {
    "id": "envelope",
    "title": "Roof, waterproofing & monsoon",
    "hi": "छत, सीलन और वॉटरप्रूफिंग",
    "kicker": "Control water before it becomes damage",
    "intro": "Water follows gravity, gaps and moisture pathways. Long-lived homes combine suitable drainage, surface details and compatible waterproofing systems with inspection access.",
    "introHi": "पानी की निकासी, जोड़ और वॉटरप्रूफिंग की सही योजना से सीलन का जोखिम घटता है।",
    "lessons": [
      "waterproofing",
      "heat-comfort"
    ],
    "sources": [
      "bis",
      "cpwd"
    ],
    "principles": [
      "Roof slopes and outlets must be coordinated with the building design and rainfall context.",
      "Wet areas need specified waterproofing details, compatible substrates and proper interfaces at drains and penetrations.",
      "Identify moisture sources before repairs; internal paint alone cannot resolve an active leak."
    ],
    "checks": [
      "Inspect drainage and waterproofing details before finishing.",
      "Arrange the specified tests and record any repairs.",
      "Maintain access to outlets, joints and service connections."
    ],
    "risks": [
      "Do not apply an incompatible membrane or coating over a wet or defective substrate.",
      "Investigate recurring dampness rather than repainting repeatedly."
    ],
    "example": {
      "en": "A ceiling damp patch can originate at a roof penetration some distance from the stain. Trace the water path and record observations before selecting a repair.",
      "hi": "छत की सीलन का कारण दाग की जगह से दूर भी हो सकता है; पहले स्रोत खोजें।"
    },
    "keywords": "waterproofing, roof, seepage, drainage, wet areas",
    "tool": "/build-iq/waterproofing",
    "revision": 1,
    "updated": "2026-11-25",
    "reviewDue": "2027-05-25",
    "reviewStatus": "editorial-draft",
    "scope": "India; project-specific requirements vary"
  },
  {
    "id": "services",
    "title": "Electrical, plumbing & ventilation",
    "hi": "बिजली, पाइपलाइन और वेंटिलेशन",
    "kicker": "Design services before finishes",
    "intro": "Services influence daily comfort and safety for decades. Coordinate routing, inspection access and future maintenance before finishes hide the work.",
    "introHi": "पाइप, वायरिंग, हवा और रखरखाव की जगह पहले तय करें; बाद में तोड़फोड़ कम होगी।",
    "lessons": [
      "services-coordination",
      "materials-engineering"
    ],
    "sources": [
      "bis",
      "cea",
      "local"
    ],
    "principles": [
      "Qualified electrical design must address loads, protection, earthing and applicable rules.",
      "Pipe systems have distinct pressure, drainage and temperature requirements; verify compatibility and support details.",
      "Coordinate service shafts, outlets, isolation points and ventilation without compromising structural elements."
    ],
    "checks": [
      "Review coordinated services drawings and approved equipment specifications.",
      "Obtain appropriate electrical and plumbing test records before concealment or commissioning.",
      "Document isolation locations and as-built routes for repairs."
    ],
    "risks": [
      "Never improvise electrical protection or work on live circuits.",
      "Never cut a beam or slab for a service without structural approval."
    ],
    "example": {
      "en": "If a bathroom outlet is relocated, confirm drainage routing, access, waterproofing interfaces and floor levels before tiling.",
      "hi": "बाथरूम का आउटलेट बदलने से पहले ढलान, पाइप, वॉटरप्रूफिंग और रखरखाव जांचें।"
    },
    "keywords": "MEP, plumbing, wiring, earthing, drainage, ventilation",
    "tool": "/build-iq/services-coordination",
    "revision": 1,
    "updated": "2026-11-25",
    "reviewDue": "2027-05-25",
    "reviewStatus": "editorial-draft",
    "scope": "India; project-specific requirements vary"
  },
  {
    "id": "finishes",
    "title": "Tiles, plaster, paint & interiors",
    "hi": "टाइल, प्लास्टर, पेंट और इंटीरियर",
    "kicker": "Choose finishes for everyday use",
    "intro": "A durable finish depends on substrate preparation, product suitability, installation and maintenance. Colours and textures are design choices; slip and moisture performance require evidence.",
    "introHi": "फिनिश की टिकाऊ गुणवत्ता सतह की तैयारी, सही उत्पाद, इंस्टॉलेशन और देखभाल पर निर्भर है।",
    "lessons": [
      "colour-light",
      "materials-engineering",
      "spatial-thinking"
    ],
    "sources": [
      "bis",
      "cpwd"
    ],
    "principles": [
      "Check intended tile use, relevant slip performance, dimensions, batch and installation system.",
      "Paint coverage depends on surface, preparation, product and coat count; use the manufacturer data.",
      "Use physical swatches under real lighting. Design circulation and cleaning access around furniture."
    ],
    "checks": [
      "Prepare a physical finish board with approved samples.",
      "Confirm surface condition and specified application method.",
      "Inspect joints, alignment and defects before final acceptance."
    ],
    "risks": [
      "Do not rely on a screen to guarantee exact colour.",
      "Do not install wet-area flooring solely because it looks attractive."
    ],
    "example": {
      "en": "For 100 m² wall area, two coats at an illustrative 10 m²/L per coat require 20 L before allowance. Use the actual product coverage and surface condition.",
      "hi": "100 m² पर दो कोट और उदाहरण कवरेज 10 m²/L हो तो 20 लीटर, बर्बादी अलग।"
    },
    "keywords": "tiles, paint, plaster, colour, flooring, room design",
    "tool": "/room-lab",
    "revision": 1,
    "updated": "2026-11-25",
    "reviewDue": "2027-05-25",
    "reviewStatus": "editorial-draft",
    "scope": "India; project-specific requirements vary"
  },
  {
    "id": "procurement",
    "title": "Materials, BOQ & procurement",
    "hi": "मटेरियल, मात्रा और खरीदारी",
    "kicker": "Make every purchase traceable",
    "intro": "A bill of quantities connects measured scope to materials and work. Compare like units, approved specifications and total delivered costs rather than a headline price.",
    "introHi": "माप, स्पेसिफिकेशन और कुल डिलीवरी लागत के आधार पर खरीदारी करें।",
    "lessons": [
      "brick-count",
      "steel-quantity",
      "money-literacy",
      "digital-trust"
    ],
    "sources": [
      "bis",
      "cpwd"
    ],
    "principles": [
      "Distinguish measured work quantities from purchase quantities, allowances and supplier pack sizes.",
      "Compare brand, grade, size, delivery, taxes, storage and return terms for the same requirement.",
      "Keep written approval for substitutions and record delivered quantities and batch details."
    ],
    "checks": [
      "Create separate measured lines for concrete, masonry, reinforcement, finishes and services.",
      "Request itemised quotations and compare identical scope and units.",
      "Reconcile received stock, installed quantity and remaining balance."
    ],
    "risks": [
      "Do not assume a fixed material factor per square foot applies to all homes.",
      "Do not combine different units or count wastage twice."
    ],
    "example": {
      "en": "For an approved batch requiring 350 kg cement per m³, 2 m³ needs 700 kg or 14 bags of 50 kg before allowance. Mortar, plaster and other cement uses must be measured separately.",
      "hi": "स्वीकृत उदाहरण मिक्स में 2 m³ के लिए 14 बैग; प्लास्टर और मसाले की मात्रा अलग निकालें।"
    },
    "keywords": "BOQ, cement bags, steel tonnes, estimates, taxes, quotes",
    "tool": "/build-iq#quantity-sheet",
    "revision": 1,
    "updated": "2026-11-25",
    "reviewDue": "2027-05-25",
    "reviewStatus": "editorial-draft",
    "scope": "India; project-specific requirements vary"
  },
  {
    "id": "quality",
    "title": "Site execution, defects & safety",
    "hi": "साइट गुणवत्ता, गलतियां और सुरक्षा",
    "kicker": "Catch defects while they are still visible",
    "intro": "Quality is a sequence of inspections, records and corrective actions, not a final photo. Safety and structural decisions belong to competent professionals.",
    "introHi": "काम ढकने से पहले जांच, टेस्ट और सुधार करें। संरचना और सुरक्षा का निर्णय योग्य विशेषज्ञ करें।",
    "lessons": [
      "site-errors",
      "underground-work",
      "waterproofing"
    ],
    "sources": [
      "cpwd",
      "bis",
      "local"
    ],
    "principles": [
      "Use the current approved drawing and make revisions visible to the contractor.",
      "Identify hold points before covering reinforcement, plumbing, waterproofing and electrical services.",
      "Document defects and get appropriate professional decisions before continuing affected work."
    ],
    "checks": [
      "Maintain a daily site log with dates, locations, photographs and decisions.",
      "Use a qualified person to inspect and record safety-critical work.",
      "Track defect resolution before acceptance and keep evidence."
    ],
    "risks": [
      "Do not conceal unresolved defects.",
      "Escalate structural cracks, movement, unsafe excavation or electrical hazards immediately to qualified professionals."
    ],
    "example": {
      "en": "A pipe leak detected before tile installation can avoid demolition later. Record the test result and repair, then retest according to the specification.",
      "hi": "टाइल लगने से पहले पाइप टेस्ट में लीकेज मिले तो सुधार और दोबारा टेस्ट दर्ज करें।"
    },
    "keywords": "inspection, checklist, cracks, defects, testing, site safety",
    "tool": "/my-project",
    "revision": 1,
    "updated": "2026-11-25",
    "reviewDue": "2027-05-25",
    "reviewStatus": "editorial-draft",
    "scope": "India; project-specific requirements vary"
  },
  {
    "id": "climate",
    "title": "Climate, energy & resilient homes",
    "hi": "जलवायु, ऊर्जा और टिकाऊ घर",
    "kicker": "Build for local conditions and future comfort",
    "intro": "Durability and comfort depend on climate, orientation, materials, maintenance and energy use. Technology changes, but evaluating whole-life trade-offs remains useful.",
    "introHi": "स्थानीय गर्मी, बारिश, धूप, हवा और देखभाल को ध्यान में रखकर घर बनाएं।",
    "lessons": [
      "heat-comfort",
      "sustainable-thinking"
    ],
    "sources": [
      "bee",
      "bis",
      "local"
    ],
    "principles": [
      "Study solar exposure, shading, ventilation, roof performance and rain protection together.",
      "Evaluate water efficiency, maintenance, replacement costs and service life using project evidence.",
      "Check emerging technologies against documented performance and local suitability; do not treat a trend as proof."
    ],
    "checks": [
      "Map sun, wind and rain exposure for the actual plot.",
      "Compare comfort and maintenance implications of alternative finishes and systems.",
      "Ask a designer to evaluate energy and water opportunities for the location."
    ],
    "risks": [
      "Avoid unsupported green claims or one-size-fits-all climate advice.",
      "Do not assume rooftop equipment or rainwater systems are suitable without site and structural checks."
    ],
    "example": {
      "en": "A west-facing opening may benefit from a different shading solution than a north-facing opening. Compare actual seasonal sun and ventilation, not an image alone.",
      "hi": "पश्चिम और उत्तर दिशा की खिड़की में धूप का व्यवहार अलग है; स्थानीय मौसम के अनुसार योजना बनाएं।"
    },
    "keywords": "passive design, heat, energy, rainwater, sustainability",
    "tool": "/build-iq/heat-comfort",
    "revision": 1,
    "updated": "2026-11-25",
    "reviewDue": "2027-05-25",
    "reviewStatus": "editorial-draft",
    "scope": "India; project-specific requirements vary"
  },
  {
    "id": "handover",
    "title": "Handover, maintenance & renovation",
    "hi": "हैंडओवर, देखभाल और नवीनीकरण",
    "kicker": "A home is a decades-long asset",
    "intro": "Keep a usable record of what was built and what needs maintenance. Future repairs are easier when drawings, warranties, product details and inspection results survive.",
    "introHi": "घर की अस-बिल्ट ड्रॉइंग, बिल, वारंटी और रखरखाव रिकॉर्ड संभालकर रखें।",
    "lessons": [
      "site-errors",
      "sustainable-thinking",
      "digital-trust"
    ],
    "sources": [
      "bis",
      "cpwd",
      "local"
    ],
    "principles": [
      "Handover records should identify service routes, isolation points, installed products and relevant approvals.",
      "Follow manufacturer maintenance instructions and inspect moisture, drainage and visible damage periodically.",
      "Renovations and new loads may require updated structural, electrical or local approval checks."
    ],
    "checks": [
      "Collect as-built drawings, test records, warranties, invoices and contact details.",
      "List defects, owners and agreed resolution dates before final acceptance.",
      "Record maintenance tasks and any later alterations."
    ],
    "risks": [
      "Do not drill or demolish without checking concealed services and structural requirements.",
      "Do not delay professional assessment of signs of structural movement."
    ],
    "example": {
      "en": "A family planning a kitchen renovation years later can use the concealed plumbing and electrical records to coordinate the new work without guessing service routes.",
      "hi": "कई साल बाद रसोई बदलते समय पुराने पाइप और वायरिंग के रिकॉर्ड मदद करेंगे।"
    },
    "keywords": "maintenance, renovation, as-built, warranty, handover",
    "tool": "/my-project",
    "revision": 1,
    "updated": "2026-11-25",
    "reviewDue": "2027-05-25",
    "reviewStatus": "editorial-draft",
    "scope": "India; project-specific requirements vary"
  },
  {
    "id": "careers",
    "title": "Skills, digital construction & careers",
    "hi": "कौशल, डिजिटल निर्माण और करियर",
    "kicker": "Learn how to reason, not just memorise",
    "intro": "Young learners can practise measurement, design, estimation, evidence review and communication. These skills survive changes in software, trends and tools.",
    "introHi": "माप, डिजाइन, अनुमान, प्रमाण और फैसले समझने की क्षमता किसी भी सॉफ्टवेयर से ज्यादा टिकाऊ है।",
    "lessons": [
      "digital-models",
      "career-skills",
      "digital-trust"
    ],
    "sources": [
      "bis",
      "cpwd"
    ],
    "principles": [
      "Distinguish measured 2D/3D geometry from inspiration and simulation; a model is not an approval.",
      "Build a portfolio showing constraints, alternatives, assumptions and evidence rather than only polished images.",
      "Evaluate AI outputs and digital tools against primary documentation and real measurements."
    ],
    "checks": [
      "Pick a measured room and make two alternative layouts.",
      "Compare the layouts using space, use, maintenance and known constraints.",
      "Document decisions and remaining questions; seek feedback from a qualified mentor."
    ],
    "risks": [
      "Do not claim a conceptual rendering is a completed project.",
      "Never trust generated technical specifications without verification."
    ],
    "example": {
      "en": "Two alternative room plans can have equal area but different circulation and furniture fit. A portfolio should explain the trade-off rather than just show the prettier model.",
      "hi": "दो नक्शों का क्षेत्र बराबर हो सकता है, लेकिन उपयोग अलग; कारण और सीमाएं लिखें।"
    },
    "keywords": "BIM, AI, digital twin, portfolio, youth, career",
    "tool": "/room-lab",
    "revision": 1,
    "updated": "2026-11-25",
    "reviewDue": "2027-05-25",
    "reviewStatus": "editorial-draft",
    "scope": "India; project-specific requirements vary"
  }
];
export function chapterById(id:string){return chapters.find(c=>c.id===id)}
export function findChapters(query:string){const words=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean).slice(0,12);return chapters.filter(c=>words.every(w=>[c.title,c.hi,c.intro,c.introHi,c.keywords,...c.principles].join(" ").toLocaleLowerCase().includes(w)))}
export function reviewState(c:Chapter,asOf:string){return asOf>=c.reviewDue?"review-due":c.reviewStatus}
