/** Simulated Indian residential site scenarios; not actual customer incidents or professional sign-off. */
export const siteCases=[
  {
    "id": "quote-gap",
    "stage": "planning",
    "title": "Contractor gives a low square-foot rate",
    "hi": "ठेकेदार का सस्ता रेट",
    "situation": "Two contractors quote ₹1,800 and ₹2,000 per sq ft. The cheaper quote excludes electrical, plumbing, taxes and site clearance. Both use different area definitions.",
    "hindi": "कम रेट देखकर तुरंत एडवांस न दें। दोनों का क्षेत्रफल और काम का दायरा समान करके तुलना करें.",
    "actions": [
      "Ask both for the measured area, itemised scope, exclusions, tax and payment milestones.",
      "Compare identical scope and request a written variation process.",
      "Keep the accepted estimate with the drawings and contract."
    ],
    "evidence": [
      "Itemised quote",
      "Area measurement sheet",
      "Written scope and payment schedule"
    ],
    "script": "Sir, please provide the same scope and measurement basis, including exclusions and taxes, before I compare the rates.",
    "question": "Which is the sound next step?",
    "options": [
      "Choose the lower headline rate",
      "Compare written scope and delivered total",
      "Pay an advance to lock the rate"
    ],
    "correct": 1,
    "feedback": "The headline rate cannot establish the final cost; make scope and area comparable first."
  },
  {
    "id": "excavation-surprise",
    "stage": "ground",
    "title": "Water appears during excavation",
    "hi": "खुदाई में अचानक पानी",
    "situation": "The contractor discovers water and unexpected soft ground while excavating. A neighbour suggests simply making the footing deeper.",
    "hindi": "मिट्टी या पानी अलग निकले तो अंदाज से नींव न बदलें। प्रभावित काम रुकवाकर विशेषज्ञ को बुलाएं.",
    "actions": [
      "Keep people away from unsafe excavation; have the competent site team secure the area.",
      "Record observations from a safe location and notify the geotechnical and structural professionals.",
      "Obtain an approved revised detail and cost variation before affected work resumes."
    ],
    "evidence": [
      "Site observation record",
      "Geotechnical advice",
      "Approved drawing revision"
    ],
    "script": "The actual ground differs from our assumptions. Please arrange a professional review before we continue affected foundation work.",
    "question": "What should happen next?",
    "options": [
      "Copy a nearby house footing",
      "Continue with more cement",
      "Stop affected work and obtain qualified review"
    ],
    "correct": 2,
    "feedback": "Foundation changes require professional assessment; extra material alone does not establish safety."
  },
  {
    "id": "pre-pour",
    "stage": "structure",
    "title": "Concrete delivery is coming but inspection is missing",
    "hi": "कंक्रीट आने से पहले जांच बाकी",
    "situation": "A truck or mixer is due, but the team cannot show the current reinforcement drawing or the recorded pre-pour inspection.",
    "hindi": "जल्दी में ढलाई शुरू न करें। वर्तमान ड्रॉइंग और जिम्मेदार इंजीनियर की जांच पहले जरूरी है.",
    "actions": [
      "Notify the responsible site engineer and pause the affected pour until required checks are resolved.",
      "Ask for approved drawing revision, mix information and inspection record.",
      "Coordinate delivery changes and document the engineer's decision."
    ],
    "evidence": [
      "Current approved drawing",
      "Pre-pour inspection record",
      "Concrete delivery and test records"
    ],
    "script": "Please confirm the pre-pour inspection and drawing revision in writing before authorising placement.",
    "question": "What matters more than the delivery schedule?",
    "options": [
      "Required checks and qualified authorisation",
      "Adding extra reinforcement without approval",
      "Taking a photo after pouring"
    ],
    "correct": 0,
    "feedback": "Concealed work becomes harder to verify; a photo after placement cannot replace required inspection."
  },
  {
    "id": "brick-shortage",
    "stage": "masonry",
    "title": "Brick delivery count does not match invoice",
    "hi": "ईंटों की संख्या बिल से कम",
    "situation": "You ordered 2,000 bricks. The invoice states 2,000, but a documented count identifies 1,920 accepted units and 30 damaged units; 50 units are unaccounted for.",
    "hindi": "कुल बिल, सही ईंट, टूटी ईंट और कम आई ईंट अलग-अलग लिखें।",
    "actions": [
      "Count delivered and accepted units with the delivery representative; distinguish damaged from missing.",
      "Record the discrepancy on the delivery note, with dated evidence where safe.",
      "Request a written replacement, credit or resolution according to the purchase terms."
    ],
    "evidence": [
      "Purchase order",
      "Delivery note",
      "Count and damage record"
    ],
    "script": "We recorded 1,920 accepted, 30 damaged and 50 missing against 2,000 ordered. Please acknowledge and confirm the resolution.",
    "question": "How many ordered units are not accepted?",
    "options": [
      "30",
      "50",
      "80"
    ],
    "correct": 2,
    "feedback": "The 30 damaged plus 50 missing units total 80; record each separately."
  },
  {
    "id": "roof-leak",
    "stage": "envelope",
    "title": "Fresh paint cannot hide a recurring leak",
    "hi": "बार-बार छत में सीलन",
    "situation": "After rain a ceiling patch returns despite fresh paint. The leak may be coming from a different point on the roof.",
    "hindi": "सीलन पर बार-बार पेंट करने से कारण दूर नहीं होता। पहले पानी का रास्ता पता करें.",
    "actions": [
      "Record when the stain occurs and its location without accessing unsafe roof areas.",
      "Have a competent person assess drainage, penetrations, waterproofing and plumbing sources.",
      "Confirm the specified repair and test outcome before repainting."
    ],
    "evidence": [
      "Dated leak observations",
      "Repair specification",
      "Test and acceptance record"
    ],
    "script": "Please identify the moisture source and confirm the repair test before we spend on another coat of paint.",
    "question": "What is the best first expense?",
    "options": [
      "Another coat of paint",
      "Diagnosing the water source",
      "Replacing every tile immediately"
    ],
    "correct": 1,
    "feedback": "Diagnosis reduces unnecessary repairs; the visible stain is not necessarily the leak source."
  },
  {
    "id": "concealed-pipes",
    "stage": "services",
    "title": "Tiles are ready but plumbing has not been tested",
    "hi": "टाइल से पहले पाइप टेस्ट",
    "situation": "A bathroom team wants to close the wall because the tiler is available, but the specified plumbing test is not documented.",
    "hindi": "पाइप ढकने से पहले योग्य प्लंबर की जांच और रिकॉर्ड रखें.",
    "actions": [
      "Ask the responsible plumbing professional to perform the specified checks before concealment.",
      "Record actual routes and isolation points; resolve any defects and retest as required.",
      "Agree the handover record with the contractor before releasing the affected finishing work."
    ],
    "evidence": [
      "Service routing record",
      "Specified test results",
      "Defect resolution record"
    ],
    "script": "Please complete the specified plumbing checks and share the record before closing the wall.",
    "question": "Which avoids avoidable rework?",
    "options": [
      "Test and document before covering",
      "Tile first and test later",
      "Use extra grout instead of testing"
    ],
    "correct": 0,
    "feedback": "Testing before concealment can prevent avoidable demolition and repair."
  },
  {
    "id": "tile-mismatch",
    "stage": "finishes",
    "title": "Same tile name, different shade batch",
    "hi": "एक नाम की टाइल, अलग शेड",
    "situation": "The supplier delivers boxes with the same tile name but different batch/shade codes. The installer wants to mix them throughout the living room.",
    "hindi": "एक जैसा नाम होने पर भी शेड और बैच अलग हो सकता है। लगाने से पहले सैंपल मिलाएं.",
    "actions": [
      "Compare box labels, ordered specification, shade and calibre where applicable.",
      "Review a dry layout and accepted sample with the installer and supplier.",
      "Resolve unsuitable batches before permanent installation, according to agreed terms."
    ],
    "evidence": [
      "Approved sample",
      "Box labels and invoice",
      "Written acceptance or replacement"
    ],
    "script": "Please verify the shade and size batch against the approved sample before installation.",
    "question": "When is the easiest time to resolve a mismatch?",
    "options": [
      "After grouting",
      "Before permanent installation",
      "After moving in"
    ],
    "correct": 1,
    "feedback": "Reviewing before installation preserves more replacement options."
  },
  {
    "id": "freight-surprise",
    "stage": "procurement",
    "title": "Supplier price excludes freight and unloading",
    "hi": "मटेरियल के साथ छुपे खर्च",
    "situation": "Supplier A offers ₹10,000 plus ₹800 freight and ₹400 unloading. Supplier B offers ₹10,700 including both. Taxes and specifications are confirmed equal for this example.",
    "hindi": "मटेरियल का अंतिम खर्च डिलीवरी और उतारने की लागत सहित देखें.",
    "actions": [
      "Confirm equal quantity, specification, taxes, delivery point and unloading scope.",
      "Add each charge once and compare written delivered totals.",
      "Keep payment and delivery terms, including handling damage, in writing."
    ],
    "evidence": [
      "Comparable supplier quotes",
      "Delivery and unloading terms",
      "Payment record"
    ],
    "script": "Please confirm the final delivered amount and all charges before order confirmation.",
    "question": "Which delivered total is lower in this example?",
    "options": [
      "A: ₹11,200",
      "B: ₹10,700",
      "Both are equal"
    ],
    "correct": 1,
    "feedback": "B is ₹500 cheaper under the stated equal-scope assumptions."
  },
  {
    "id": "unapproved-change",
    "stage": "quality",
    "title": "Contractor suggests moving a column to fit a room",
    "hi": "कमरे के लिए कॉलम हटाने का सुझाव",
    "situation": "During layout, a column conflicts with furniture preferences. Someone proposes moving or cutting the member without revising the structural drawings.",
    "hindi": "कॉलम, बीम या स्लैब में बदलाव बिना स्ट्रक्चरल इंजीनियर की मंजूरी नहीं.",
    "actions": [
      "Do not authorise the proposed structural modification.",
      "Ask the architect and structural engineer to coordinate an approved alternative.",
      "Record revised drawings, costs and permissions before affected work proceeds."
    ],
    "evidence": [
      "Current drawings",
      "Approved revised drawings",
      "Variation record"
    ],
    "script": "Please stop this proposed change until the structural engineer and architect issue an approved solution.",
    "question": "What is a safe decision?",
    "options": [
      "Move it a little by eye",
      "Reduce the member size",
      "Seek an approved structural redesign"
    ],
    "correct": 2,
    "feedback": "Structural changes affect load paths and require qualified design."
  },
  {
    "id": "summer-room",
    "stage": "climate",
    "title": "Bedroom gets hot every afternoon",
    "hi": "दोपहर में कमरा बहुत गर्म",
    "situation": "A west-facing room is uncomfortable during summer. A seller recommends a single product as a guaranteed solution, without looking at the room.",
    "hindi": "गर्मी का कारण धूप, छत, हवा और खिड़की से जुड़ा हो सकता है। पहले वास्तविक स्थिति समझें.",
    "actions": [
      "Observe when the room heats up, sun exposure, ventilation and surrounding surfaces.",
      "Compare shading, roof or envelope improvements and ventilation with a qualified designer.",
      "Check costs, maintenance and actual performance evidence before purchase."
    ],
    "evidence": [
      "Time-of-day observations",
      "Site orientation",
      "Alternative options and evidence"
    ],
    "script": "Please compare options for this actual room, including maintenance and seasonal comfort, rather than a universal promise.",
    "question": "What is the strongest starting point?",
    "options": [
      "Measure and understand the room conditions",
      "Buy the most expensive coating",
      "Assume every house needs the same solution"
    ],
    "correct": 0,
    "feedback": "Site-specific observations help distinguish causes and compare appropriate options."
  },
  {
    "id": "handover-file",
    "stage": "handover",
    "title": "House is ready but concealed work records are missing",
    "hi": "घर तैयार लेकिन रिकॉर्ड नहीं",
    "situation": "The final payment is due and the finishes look complete. The owner has no as-built service routes, warranties or unresolved defect list.",
    "hindi": "घर की सुंदरता के साथ ड्रॉइंग, टेस्ट, वारंटी और बचे हुए काम का रिकॉर्ड लें.",
    "actions": [
      "Request a joint handover walkthrough and list unresolved defects.",
      "Collect available as-built drawings, test records, product documents, warranties and keys.",
      "Agree outstanding work and payment handling in accordance with the contract."
    ],
    "evidence": [
      "Handover inventory",
      "Defect list",
      "As-built drawings and warranties"
    ],
    "script": "Please share the handover records and outstanding work list so we can close the project according to our agreement.",
    "question": "What is valuable five years later?",
    "options": [
      "Only the final photographs",
      "Service routes and maintenance records",
      "The original advertisement"
    ],
    "correct": 1,
    "feedback": "Records help future diagnosis, maintenance and renovations."
  },
  {
    "id": "student-site",
    "stage": "careers",
    "title": "Student designs a room from a viral photo",
    "hi": "फोटो देखकर कमरे का डिजाइन",
    "situation": "A student copies a beautiful room reference without checking actual door positions, furniture dimensions or the user's budget.",
    "hindi": "पहले असली माप और जरूरत लें। फोटो सिर्फ प्रेरणा है, तैयार नक्शा नहीं.",
    "actions": [
      "Measure a permitted room safely and record door and window locations.",
      "Create two layouts using actual furniture footprints and discuss walking routes with the user.",
      "Present a decision note, assumptions and limitations instead of claiming construction readiness."
    ],
    "evidence": [
      "Measured sketch",
      "Two layout alternatives",
      "Decision and limitations note"
    ],
    "script": "Here are two concepts based on your measured room. Please review the trade-offs before we develop detailed drawings.",
    "question": "Which portfolio demonstrates real skill?",
    "options": [
      "Two measured options with a reasoned choice",
      "An image with no dimensions",
      "A copied render presented as built work"
    ],
    "correct": 0,
    "feedback": "Measured reasoning and honest limitations matter more than a polished copied image."
  }
] as const;
export type SiteCase=typeof siteCases[number];
export const practiceEdition={revision:1,updated:"2026-11-25",reviewDue:"2027-05-25",status:"Professional review pending"} as const;
export function findCases(query:string,stage:string){const words=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean).slice(0,12);return siteCases.filter(c=>(stage==="all"||c.stage===stage)&&words.every(w=>[c.title,c.hi,c.situation,c.hindi,c.stage,...c.actions].join(" ").toLocaleLowerCase().includes(w)))}

export const fieldRecordTemplates=[
 {id:"daily",title:"Daily site record",hi:"रोज का साइट रिकॉर्ड",fields:["Date / location / work stage","Drawing revision used","Work completed and measured quantity","Materials received and batch / invoice","Inspections and test records","Problems, responsible person and next action"]},
 {id:"delivery",title:"Material delivery discrepancy",hi:"मटेरियल डिलीवरी में कमी",fields:["Purchase order and invoice reference","Material specification and unit","Ordered quantity","Delivered quantity including rejected","Rejected / damaged quantity","Accepted quantity and discrepancy","Supplier acknowledgement and agreed resolution"]},
 {id:"variation",title:"Contractor change request",hi:"ठेकेदार के काम में बदलाव",fields:["Original drawing or agreed scope","Proposed change and reason","Professional approval if required","Measured quantity and written cost difference","Schedule effect and exclusions","Owner / contractor written decision before work"]},
 {id:"concealed",title:"Before covering work",hi:"काम ढकने से पहले रिकॉर्ड",fields:["Location and work to be covered","Current drawing / specification","Required inspections and test references","Outstanding defects and responsible person","Qualified professional's recorded decision","As-built record / photo reference (if safe and permitted)"]},
 {id:"handover",title:"Home handover and maintenance file",hi:"घर हैंडओवर और रखरखाव फाइल",fields:["Rooms and systems inspected","Outstanding defects and agreed resolution","As-built drawings and concealed service locations","Test / commissioning records","Product warranties and maintenance instructions","Keys, equipment manuals and contact references"]}
] as const;
export function fieldTemplateText(id:string){const t=fieldRecordTemplates.find(x=>x.id===id);return t?[t.title,t.hi,"Neerva Academy — editable record template, not an inspection or contractual approval.",...t.fields.map(x=>x+": ____________________")].join("\n\n"):null}
