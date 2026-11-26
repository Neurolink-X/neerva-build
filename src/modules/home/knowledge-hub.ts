// Original decision guides. External references support the method, not specific site approval.
export const knowledgeSources=[
  {
    "label": "BIS · Homeowner guides",
    "url": "https://www.bis.gov.in/guide-for-homeowners-and-homebuyers/?lang=en"
  },
  {
    "label": "BEE · residential energy code",
    "url": "https://beeindia.gov.in/show_content.php?level=2&lid=328&ls_id=202"
  },
  {
    "label": "Singapore BCA · DfMA",
    "url": "https://www1.bca.gov.sg/growth-and-transformation/productivity/design-for-manufacturing-and-assembly-dfma/"
  },
  {
    "label": "Japan MLIT · home maintenance",
    "url": "https://www.mlit.go.jp/sumai_literacy_pf/knowledge03/0001/"
  },
  {
    "label": "US DOE · solar-ready homes",
    "url": "https://www.energy.gov/cmei/systems/solar-energy-guide-homebuilders"
  },
  {
    "label": "CERT-In · phishing and payment fraud",
    "url": "https://www.cert-in.org.in/s2cMainServlet?VLCODE=CIAD-2024-0050&pageid=PUBVLNOTES02"
  },
  {
    "label": "NASA · Mars Dune Alpha / CHAPEA habitat",
    "url": "https://www.nasa.gov/humans-in-space/chapea/habitat/"
  },
  {
    "label": "NASA · robotic construction for Moon and Mars",
    "url": "https://www.nasa.gov/directorates/stmd/nasa-enables-construction-technology-for-moon-and-mars-exploration/"
  },
  {
    "label": "NASA · MOXIE Mars experiment completed",
    "url": "https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/"
  },
  {
    "label": "ESA · interlocking space bricks experiment",
    "url": "https://blogs.esa.int/exploration/lego-bricks-from-space-dust/"
  },
  {
    "label": "NASA · MMPACT technology development",
    "url": "https://techport.nasa.gov/projects/116319"
  }
] as const;
export const knowledgePaths=[
  {
    "id": "site",
    "title": "Plan before buying",
    "hi": "पहले योजना बनाएं",
    "intro": "Make decisions before money is committed.",
    "guides": [
      {
        "id": "measure",
        "title": "Measure the actual plot, not the listing",
        "hi": "प्लॉट की सही नाप",
        "example": "A 100 gaj plot can be 18×50 ft or 20×45 ft; equal area does not mean equal rooms.",
        "steps": "Record all boundaries and road edge; have survey and ownership checked; ask architect to confirm setbacks and usable area.",
        "warning": "Mismatch between drawing and surveyed land, or an unverified road width.",
        "practice": "Compare both dimensions in Home Studio and take the result to an architect.",
        "href": "/design-studio",
        "cta": "Open Home Studio",
        "source": 0
      },
      {
        "id": "brief",
        "title": "Write a family brief before drawing",
        "hi": "परिवार की जरूरतें",
        "example": "A parent who cannot climb stairs needs different circulation from a family that wants rental access.",
        "steps": "List bedroom needs, accessibility, storage, parking and future floors; rank must-have versus optional; walk through a furniture layout.",
        "warning": "A plan that relies on removing walls later or adds a future floor without structural design.",
        "practice": "Use a taped furniture outline on the floor to test movement; request an engineer-approved plan.",
        "href": "/room-lab",
        "cta": "Try Room Lab",
        "source": 0
      }
    ]
  },
  {
    "id": "money",
    "title": "Spend with control",
    "hi": "बजट और खरीदारी",
    "intro": "Compare scope, cash flow and evidence instead of the lowest headline price.",
    "guides": [
      {
        "id": "quotes",
        "title": "Compare like-for-like quotations",
        "hi": "कोटेशन की सही तुलना",
        "example": "Quote A: ₹50,000 + ₹3,000 delivery; quote B: ₹52,000 including delivery. B is ₹1,000 lower in this hypothetical example.",
        "steps": "Write brand, grade, unit, quantity, tax, freight, unloading, lead time and return terms on one sheet; confirm totals and availability in writing.",
        "warning": "Unspecified grade, quantity or extra cash requested outside an agreed quote.",
        "practice": "Use the quote builder to prepare a common scope for dealers; do not assume a price is verified.",
        "href": "/quotes",
        "cta": "Prepare a quote",
        "source": 0
      },
      {
        "id": "budget",
        "title": "Stage payments against evidence",
        "hi": "भुगतान और बजट",
        "example": "A low initial quotation can become expensive if services, testing or finishing are excluded.",
        "steps": "Record baseline cost and contingency; require written variations with cost and schedule impact; release agreed payments after evidence and review.",
        "warning": "Full advance without verified identity, written contract, or receipts.",
        "practice": "Use My Project to track agreed milestones, invoices and outstanding commitments.",
        "href": "/my-project",
        "cta": "Open project planner",
        "source": 0
      }
    ]
  },
  {
    "id": "quality",
    "title": "Workmanship & site quality",
    "hi": "साइट पर गुणवत्ता",
    "intro": "Use inspection hold points rather than trying to repair hidden defects.",
    "guides": [
      {
        "id": "holdpoints",
        "title": "Inspect before work gets covered",
        "hi": "काम ढकने से पहले जांच",
        "example": "A pipe joint or reinforcement detail is much harder to inspect after concealment.",
        "steps": "Agree inspection stages with engineer; photograph dated work before covering; retain approved drawings and inspection records; ask the professional to sign off.",
        "warning": "Pouring concrete or closing a wall while required inspection is unresolved.",
        "practice": "Ask your site engineer for the hold-point checklist and record closure before work resumes.",
        "href": "/build-iq/site-practice",
        "cta": "Practice identifying defects",
        "source": 0
      },
      {
        "id": "delivery",
        "title": "Verify each material delivery",
        "hi": "सामग्री की डिलीवरी जांचें",
        "example": "A different grade or batch may look identical after unloading.",
        "steps": "Match product, grade and quantity to purchase order; photograph labels and damage; request test documents where specified; segregate disputed goods.",
        "warning": "Missing identification, damaged packaging or substitutions without approval.",
        "practice": "Compare specifications, then obtain professional acceptance where required.",
        "href": "/materials",
        "cta": "Explore material specifications",
        "source": 0
      }
    ]
  },
  {
    "id": "world",
    "title": "Global methods, Indian adaptation",
    "hi": "दुनिया से सीखें",
    "intro": "Adopt principles, not overseas specifications copied blindly.",
    "guides": [
      {
        "id": "singapore",
        "title": "Singapore: coordinate before construction",
        "hi": "सिंगापुर: पहले समन्वय",
        "example": "DfMA promotes coordinated design and assembly rather than resolving every clash on site.",
        "steps": "For a small Indian home, align wet areas and service routes early; coordinate drawings among trades; use repeated openings only if professionally approved.",
        "warning": "Ordering prefabricated components before verifying dimensions, transport, lifting or connections.",
        "practice": "Make a coordination drawing with architect and contractors before placing orders.",
        "href": "/build-iq",
        "cta": "Explore practical Academy lessons",
        "source": 2
      },
      {
        "id": "japan",
        "title": "Japan: build a maintainable home",
        "hi": "जापान: लंबे समय तक उपयोग",
        "example": "Maintenance records and timely inspection help owners address deterioration before it becomes a larger repair.",
        "steps": "Keep shutoff points accessible; label circuits and valves; store handover drawings and warranties; schedule professional roof, plumbing and structural checks.",
        "warning": "Sealing away access to essential valves, or ignoring new cracks and damp patches.",
        "practice": "Create a dated maintenance log and reserve repair funds.",
        "href": "/my-project",
        "cta": "Create a maintenance record",
        "source": 3
      },
      {
        "id": "passive",
        "title": "US and Indian passive-design principles",
        "hi": "गर्मी कम करने की योजना",
        "example": "Shading and window design can reduce unwanted heat gain, but the right solution depends on local climate and orientation.",
        "steps": "Observe afternoon sun; compare external shade options; ask for a climate-specific ventilation and envelope assessment; measure comfort after changes.",
        "warning": "Copying cold-climate glazing choices to a hot Indian location without review.",
        "practice": "Compare designs with BEE residential guidance; don't claim a savings percentage without measurement.",
        "href": "/design-studio",
        "cta": "Review your home concept",
        "source": 1
      }
    ]
  },
  {
    "id": "future",
    "title": "Future-ready utilities",
    "hi": "भविष्य के लिए घर",
    "intro": "Make low-regret provisions while walls and roofs are still accessible.",
    "guides": [
      {
        "id": "solar",
        "title": "Prepare a roof for future solar",
        "hi": "सौर ऊर्जा की तैयारी",
        "example": "A roof crowded with equipment can limit useful panel space.",
        "steps": "Ask a structural engineer about loads, wind and waterproofing; keep service routes and safe access in drawings; get an electrician to plan compatible wiring and protection.",
        "warning": "Unapproved roof drilling, unsafe electrical work or assuming battery backup comes with every solar system.",
        "practice": "Collect roof dimensions and power bills before requesting a professional assessment.",
        "href": "/my-project",
        "cta": "Record roof and service needs",
        "source": 4
      },
      {
        "id": "water",
        "title": "Plan water security and leak access",
        "hi": "पानी और लीकेज",
        "example": "A hidden leak may waste water before residents see dampness.",
        "steps": "Mark isolation valves and service routes; have drainage and rainwater options assessed for local rules and soil; record tank maintenance and water quality needs.",
        "warning": "Cross-connecting potable and non-potable lines or concealing an untested pipe.",
        "practice": "Ask a qualified plumber for pressure test and a handover diagram.",
        "href": "/build-iq/handbook/services",
        "cta": "Learn services and waterproofing",
        "source": 0
      },
      {
        "id": "heat",
        "title": "Plan comfort before buying appliances",
        "hi": "गर्मी से बचाव",
        "example": "A shaded window and a useful cross-ventilation path may improve comfort without adding machinery.",
        "steps": "Record which rooms overheat and when; ask about roof insulation, shade and ventilation; compare lifetime energy use alongside purchase cost.",
        "warning": "Blocking escape routes or installing ventilation openings that compromise privacy or safety.",
        "practice": "Use BEE residential guidance and compare a professionally reviewed design.",
        "href": "/build-iq",
        "cta": "Explore Future Home Lab",
        "source": 1
      }
    ]
  },
  {
    "id": "living",
    "title": "Safer everyday living",
    "hi": "सुरक्षित जीवन",
    "intro": "Useful home knowledge extends beyond materials.",
    "guides": [
      {
        "id": "access",
        "title": "Design for children and older adults",
        "hi": "बच्चे और बुजुर्ग",
        "example": "A threshold that is trivial today can become an obstacle after an injury.",
        "steps": "Discuss a step-free approach where feasible, lighting, slip resistance and reachable storage; ask a designer to verify circulation and accessible bathroom details.",
        "warning": "Unprotected stairs, slippery wet floors or inaccessible emergency exits.",
        "practice": "Walk the intended route with household members before finalising rooms.",
        "href": "/room-lab",
        "cta": "Test furniture and space",
        "source": 0
      },
      {
        "id": "handover",
        "title": "Make a home handover file",
        "hi": "घर का रिकॉर्ड",
        "example": "If a hidden pipe leaks after possession, a dated service drawing is more useful than a marketing brochure.",
        "steps": "Collect approved drawings, invoices, warranty details, test reports and emergency contacts; keep secure copies; record unresolved defects.",
        "warning": "Accepting keys without written status of outstanding work and required approvals.",
        "practice": "Make a handover list and confirm completion with qualified professionals.",
        "href": "/my-project",
        "cta": "Organise your records",
        "source": 0
      }
    ]
  },
  {
    "id": "trust",
    "title": "Digital safety & responsible buying",
    "hi": "ऑनलाइन सुरक्षा",
    "intro": "Protect project money and documents, not just physical materials.",
    "guides": [
      {
        "id": "fraud",
        "title": "Recognise a fake payment request",
        "hi": "फर्जी भुगतान अनुरोध",
        "example": "A message claims a refund is waiting and asks for your UPI PIN. Receiving money does not require a PIN or OTP.",
        "steps": "Verify seller identity independently; compare beneficiary with written invoice; never share OTP or UPI PIN; avoid unknown APK links.",
        "warning": "Pressure to pay to a personal account, fake refund links or requests for remote-control apps.",
        "practice": "For suspected financial fraud contact the bank immediately and report on cybercrime.gov.in or 1930.",
        "href": "/support",
        "cta": "Find Neerva support",
        "source": 5
      },
      {
        "id": "privacy",
        "title": "Keep home and identity documents private",
        "hi": "दस्तावेज सुरक्षित रखें",
        "example": "An address, signed plan and ID scan together reveal more than a product enquiry needs.",
        "steps": "Share only necessary fields with verified parties; redact irrelevant identifiers; keep private originals backed up; check permissions before forwarding.",
        "warning": "A seller demands unrelated identification or public upload of signed plans.",
        "practice": "Use private platform account tools where available and verify the request purpose.",
        "href": "/account",
        "cta": "Open account tools",
        "source": 5
      }
    ]
  },
  {
    "id": "space",
    "title": "Beyond Earth: Moon & Mars engineering",
    "hi": "पृथ्वी से परे निर्माण",
    "intro": "No crewed Mars building has been constructed. Separate real Mars experiments, Earth-based demonstrations, and proposed extraterrestrial infrastructure. Learn what extreme-environment engineering can teach Indian home builders.",
    "guides": [
      {
        "id": "mars-habitat",
        "title": "Mars Dune Alpha: test the habitat before the mission",
        "hi": "मंगल आवास का पृथ्वी पर परीक्षण",
        "example": "Earth demonstration: NASA's roughly 1,700 sq ft 3D-printed Mars Dune Alpha at Johnson Space Center is a simulated habitat, not a building on Mars.",
        "steps": "Study how sleeping, food, work, sanitation and maintenance share limited space; separate noisy and private areas; mock up service access and test daily routines before finalising your home",
        "warning": "A successful Earth analogue does not prove that the same structure can contain pressure or withstand radiation on Mars.",
        "practice": "Draw a one-room emergency shelter layout; identify the exit, sleeping space, water, ventilation and repair access; try a household-scale layout in Room Lab.",
        "href": "/room-lab",
        "cta": "Experiment with space planning",
        "source": 6
      },
      {
        "id": "regolith-printing",
        "title": "Robot-built Moon and Mars infrastructure",
        "hi": "रोबोट से चंद्रमा और मंगल पर निर्माण",
        "example": "Research and Earth prototypes: NASA's MMPACT explores robotic additive construction using local surface material, or regolith, for potential pads, barriers and shelters. Operational off-Earth buildings are not yet demonstrated by this programme.",
        "steps": "Compare material transport cost with local processing and testing; consider power, dust and maintenance constraints; plan modular equipment access before making a design",
        "warning": "Regolith is not interchangeable with ordinary soil or concrete. Printed material is not automatically airtight, radiation-safe or structurally certified.",
        "practice": "For an Indian site, compare transporting every component against using certified local materials; record transport distance, inspection needs, waste and repairability.",
        "href": "/build-iq/material-atlas",
        "cta": "Compare material systems",
        "source": 7
      },
      {
        "id": "moxie-isru",
        "title": "MOXIE: make useful resources where you need them",
        "hi": "स्थानीय संसाधनों से ऑक्सीजन बनाना",
        "example": "Actual Mars experiment: Perseverance's MOXIE produced a total of 122 grams of oxygen from the Martian atmosphere during its completed demonstration. It was not a full life-support system.",
        "steps": "Distinguish resource input, energy required and useful output; calculate operating and maintenance requirements; identify backup supplies if equipment fails",
        "warning": "An experimental oxygen generator does not make outdoor Martian air breathable or establish an inhabited settlement.",
        "practice": "Apply resource accounting at home: estimate daily water demand, available rainwater and storage; check water quality and local rules with a qualified professional.",
        "href": "/my-project",
        "cta": "Record resource needs",
        "source": 8
      },
      {
        "id": "moon-bricks",
        "title": "ESA space bricks: interlocking and repairable systems",
        "hi": "अंतरिक्ष ईंटों से मॉड्यूलर निर्माण",
        "example": "Earth demonstration: ESA's team printed small interlocking bricks using material including meteorite dust as a research concept for future lunar construction.",
        "steps": "Compare standardised modules with individually cut pieces; study how joints transfer loads and permit replacement; ask for tested material specifications and professional approval",
        "warning": "A small interlocking brick demonstration is not evidence of a certified full-scale lunar wall or a safe structural block for your house.",
        "practice": "Use cardboard blocks to compare repeatable room modules; count offcuts and damaged components, then ask a designer how actual connections would be verified.",
        "href": "/build-iq",
        "cta": "Explore construction experiments",
        "source": 9
      },
      {
        "id": "off-earth-systems",
        "title": "Future settlement: build systems before people arrive",
        "hi": "भविष्य के अंतरिक्ष आवास की योजना",
        "example": "Proposed engineering sequence, not a committed mission timetable: survey a site, establish power and communications, test robotic construction and shielding, then verify a pressure-rated habitat and life-support systems before occupation.",
        "steps": "Identify failure modes such as dust, radiation, pressure loss and power interruption; design redundant critical supplies and accessible maintenance; test remotely before relying on the system",
        "warning": "Neither a concept drawing nor a proposed mission date proves that human settlements are ready. A habitat needs independent safety and engineering verification.",
        "practice": "Make a home resilience map: emergency water, safe electrical shutdown, escape route, repair access and outage plans. Ask qualified trades to verify them.",
        "href": "/my-project",
        "cta": "Plan home resilience",
        "source": 10
      }
    ]
  }
] as const;
