export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; title: string; text: string };

export type BlogSection = { id: string; heading: string; blocks: BlogBlock[] };

export type BlogArticle = {
  slug: string;
  category: string;
  readMinutes: number;
  publishedAt: string;
  updatedAt: string;
  title: string;
  titleHi: string;
  excerpt: string;
  excerptHi: string;
  sections: BlogSection[];
  sectionsHi: BlogSection[];
  sources: Array<{ label: string; href: string }>;
};

export const articles: BlogArticle[] = [
{
  "slug": "neerva-build-smarter-construction-viksit-bharat",
  "category": "Platform guide",
  "readMinutes": 7,
  "publishedAt": "2026-11-25",
  "updatedAt": "2026-11-25",
  "title": "Neerva Build: From your first material to your dream home — building a smarter India",
  "titleHi": "नीर्वा बिल्ड: पहली निर्माण सामग्री से अपने सपनों के घर तक — एक स्मार्ट विकसित भारत की ओर",
  "excerpt": "Learn how to explore construction materials, plan your home in 2D and 3D, try wall colours, request delivered prices and track orders. Discover Neerva's vision for a more connected Indian construction market.",
  "excerptHi": "निर्माण सामग्री चुनें, 2D और 3D में घर का प्लान देखें, दीवारों के रंग आज़माएँ, डिलीवरी सहित कीमत माँगें और ऑर्डर की स्थिति देखें। जानिए भारत के निर्माण क्षेत्र को अधिक डिजिटल और जुड़ा बनाने का नीर्वा का लक्ष्य।",
  "sections": [
    {
      "id": "vision",
      "heading": "A simpler way to build in India",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Building a home should begin with clear decisions, not scattered quotations and confusing specifications. Neerva Build brings material discovery, home planning and purchase requests into one place. We aim to connect homeowners, contractors and local dealers through more transparent digital workflows."
        },
        {
          "type": "paragraph",
          "text": "Our vision supports the spirit of a developed India (Viksit Bharat): stronger local businesses, informed customers, accessible technology and better use of resources. Neerva is an independent private initiative, not a government programme or official government partner."
        }
      ]
    },
    {
      "id": "materials",
      "heading": "1. Explore the material catalog",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Open Materials and browse cement, TMT steel, bricks and blocks, sand and aggregates, plumbing, electrical supplies, tiles, paints and hardware. Search by brand, grade or product name. Open the product page, read the specifications and choose the quantity and unit."
        },
        {
          "type": "callout",
          "title": "Check the exact product",
          "text": "A reference photo is not proof of an exact SKU, grade, colour or stock. Where an exact seller photograph is unavailable, request one before confirming the purchase. Bulk material may need a private quote."
        }
      ]
    },
    {
      "id": "studio",
      "heading": "2. Plan and visualise your home",
      "blocks": [
        {
          "type": "paragraph",
          "text": "In Design Studio, enter the plot width and depth, road side, bedrooms, floors and parking needs. Explore suitable concept layouts and their corresponding 2D and 3D views. Compare room positions and circulation before discussing the design with your architect."
        },
        {
          "type": "paragraph",
          "text": "Use the colour visualizer to try shades and patterns on sample rooms or your own photo. Check a physical paint sample because lighting and displays can change the perceived colour."
        },
        {
          "type": "callout",
          "title": "Concept, not construction approval",
          "text": "A generated plan is a starting point for professional review. A licensed architect or engineer must check actual site boundaries, setbacks, structure and local permissions."
        }
      ]
    },
    {
      "id": "order",
      "heading": "3. How to order materials",
      "blocks": [
        {
          "type": "list",
          "items": [
            "Open a material product page and choose the correct quantity and unit.",
            "Select Place order or Add to order cart. Review the selected items and open checkout.",
            "Sign in if prompted. Enter your actual delivery address, city, pincode and contact details. Review the request and submit.",
            "Check the recorded order in My Orders. Neerva or the eligible dealer must confirm availability, delivered price and schedule before fulfillment.",
            "Review the final amount and terms before approving any purchase. Keep the order reference for support."
          ]
        },
        {
          "type": "paragraph",
          "text": "For a project with multiple specifications, use the material planning list or prepare a private quotation instead. A submitted request is not a guarantee of stock, delivery or an automatic payment."
        }
      ]
    },
    {
      "id": "quotes",
      "heading": "4. Compare quotations, not just prices",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Use your delivery pincode to prepare an enquiry. Where dealer offers are available, open My Quotes and compare itemised quantity, grade, tax, freight, unloading, validity and delivery terms. Accept only the offer that matches your requirement. If no eligible dealer is available, the platform may review the sourcing request; supply is not guaranteed."
        },
        {
          "type": "paragraph",
          "text": "Keep payment and communication within the approved process. Studio features may have separate free or paid access settings; check the displayed terms and never assume a material order has been paid."
        }
      ]
    },
    {
      "id": "local",
      "heading": "5. Empowering local dealers and building responsibly",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Our goal is to help eligible local suppliers reach digital customers, record clear quotations and manage service areas. Dealer onboarding, approval and verified product information are essential to trust. Technology can reduce unnecessary travel and repeated calls, but quality, safe construction and reliable fulfillment still depend on people and processes."
        },
        {
          "type": "paragraph",
          "text": "We aspire to expand responsibly as verified supply coverage grows. Availability depends on location and operational readiness; nationwide instant delivery is not promised."
        }
      ]
    },
    {
      "id": "start",
      "heading": "Start building with clarity",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Start with one material, a home concept or a complete project enquiry. Compare specifications, ask questions and confirm the delivered cost. Better-informed decisions are the foundation of better buildings. Build better. Buy smarter. Build India forward."
        }
      ]
    }
  ],
  "sectionsHi": [
    {
      "id": "vision",
      "heading": "भारत में निर्माण को आसान बनाने की पहल",
      "blocks": [
        {
          "type": "paragraph",
          "text": "घर बनाने की शुरुआत स्पष्ट जानकारी से होनी चाहिए, बिखरे कोटेशन और उलझे स्पेसिफिकेशन से नहीं। नीर्वा बिल्ड सामग्री खोजने, घर की योजना बनाने और खरीद अनुरोध को एक जगह लाने की पहल है। हमारा उद्देश्य घर बनाने वालों, ठेकेदारों और स्थानीय डीलरों को अधिक पारदर्शी डिजिटल प्रक्रिया से जोड़ना है।"
        },
        {
          "type": "paragraph",
          "text": "हमारा लक्ष्य विकसित भारत की भावना के अनुरूप स्थानीय कारोबार, जागरूक ग्राहकों, सुलभ तकनीक और संसाधनों के बेहतर उपयोग को बढ़ावा देना है। नीर्वा एक स्वतंत्र निजी पहल है, सरकारी योजना या आधिकारिक सरकारी भागीदार नहीं।"
        }
      ]
    },
    {
      "id": "materials",
      "heading": "1. निर्माण सामग्री का कैटलॉग देखें",
      "blocks": [
        {
          "type": "paragraph",
          "text": "मटेरियल्स खोलकर सीमेंट, सरिया, ईंट और ब्लॉक, बालू-मौरंग-गिट्टी, पाइप और फिटिंग, इलेक्ट्रिकल, टाइल्स, पेंट और हार्डवेयर देखें। ब्रांड, ग्रेड या नाम से खोजें। उत्पाद का पेज खोलें, स्पेसिफिकेशन पढ़ें और मात्रा व यूनिट चुनें।"
        },
        {
          "type": "callout",
          "title": "सही उत्पाद की पुष्टि करें",
          "text": "संदर्भ फोटो किसी सटीक SKU, ग्रेड, रंग या स्टॉक का प्रमाण नहीं है। यदि विक्रेता का असली फोटो उपलब्ध नहीं है तो खरीद पक्की करने से पहले माँगें। थोक सामग्री के लिए निजी कोटेशन लग सकता है।"
        }
      ]
    },
    {
      "id": "studio",
      "heading": "2. अपने घर का नक्शा और रूप देखें",
      "blocks": [
        {
          "type": "paragraph",
          "text": "डिज़ाइन स्टूडियो में प्लॉट की चौड़ाई, गहराई, सड़क की दिशा, बेडरूम, मंज़िल और पार्किंग की ज़रूरत भरें। उपयुक्त कॉन्सेप्ट नक्शे और उनके 2D व 3D दृश्य देखें। आर्किटेक्ट से चर्चा से पहले कमरों और रास्तों की तुलना करें।"
        },
        {
          "type": "paragraph",
          "text": "कलर विज़ुअलाइज़र में उपलब्ध कमरे या अपनी फोटो पर रंग और पैटर्न आज़माएँ। रोशनी और स्क्रीन रंग बदलकर दिखा सकती हैं, इसलिए असली पेंट सैंपल देखें।"
        },
        {
          "type": "callout",
          "title": "कॉन्सेप्ट, निर्माण की अनुमति नहीं",
          "text": "नक्शा पेशेवर समीक्षा की शुरुआत है। वास्तविक सीमा, सेटबैक, संरचना और स्थानीय अनुमति की जाँच योग्य आर्किटेक्ट या इंजीनियर से कराएँ।"
        }
      ]
    },
    {
      "id": "order",
      "heading": "3. सामग्री का ऑर्डर कैसे करें",
      "blocks": [
        {
          "type": "list",
          "items": [
            "उत्पाद का पेज खोलें और सही मात्रा तथा यूनिट चुनें।",
            "Place order या Add to order cart चुनें। चुनी हुई सामग्री की जाँच कर चेकआउट खोलें।",
            "ज़रूरत पड़ने पर साइन इन करें। सही डिलीवरी पता, शहर, पिनकोड और संपर्क विवरण भरें। अनुरोध देखकर सबमिट करें।",
            "My Orders में दर्ज ऑर्डर देखें। पूर्ति से पहले नीर्वा या योग्य डीलर स्टॉक, डिलीवरी सहित कीमत और समय की पुष्टि करेगा।",
            "खरीद स्वीकार करने से पहले अंतिम राशि और शर्तें पढ़ें। सहायता के लिए ऑर्डर नंबर रखें।"
          ]
        },
        {
          "type": "paragraph",
          "text": "कई तरह की सामग्री वाले प्रोजेक्ट के लिए प्लानिंग लिस्ट या निजी कोटेशन का इस्तेमाल करें। अनुरोध जमा होने का मतलब स्टॉक, डिलीवरी या भुगतान की गारंटी नहीं है।"
        }
      ]
    },
    {
      "id": "quotes",
      "heading": "4. सिर्फ कीमत नहीं, पूरे कोटेशन की तुलना करें",
      "blocks": [
        {
          "type": "paragraph",
          "text": "डिलीवरी पिनकोड डालकर कोटेशन तैयार करें। जहाँ डीलर ऑफर उपलब्ध हों, My Quotes में मात्रा, ग्रेड, टैक्स, भाड़ा, उतराई, वैधता और डिलीवरी शर्तों की तुलना करें। वही ऑफर स्वीकार करें जो आपकी ज़रूरत से मेल खाता हो। योग्य डीलर उपलब्ध न होने पर प्लेटफ़ॉर्म अनुरोध की समीक्षा कर सकता है; सप्लाई की गारंटी नहीं है।"
        },
        {
          "type": "paragraph",
          "text": "भुगतान और बातचीत स्वीकृत प्रक्रिया से करें। स्टूडियो फीचर में अलग मुफ्त या भुगतान वाले विकल्प हो सकते हैं; प्रदर्शित शर्तें देखें। सामग्री का भुगतान अपने आप हुआ न मानें।"
        }
      ]
    },
    {
      "id": "local",
      "heading": "5. स्थानीय डीलरों को सशक्त बनाना",
      "blocks": [
        {
          "type": "paragraph",
          "text": "हमारा लक्ष्य योग्य स्थानीय विक्रेताओं को डिजिटल ग्राहकों तक पहुँचने, स्पष्ट कोटेशन दर्ज करने और सेवा क्षेत्र संभालने में मदद करना है। डीलर की स्वीकृति और सत्यापित उत्पाद जानकारी भरोसे के लिए ज़रूरी हैं। तकनीक अनावश्यक यात्राएँ और बार-बार फोन कम कर सकती है, लेकिन गुणवत्ता, सुरक्षित निर्माण और भरोसेमंद सप्लाई लोगों व प्रक्रियाओं पर निर्भर हैं।"
        },
        {
          "type": "paragraph",
          "text": "सत्यापित सप्लाई क्षेत्र बढ़ने के साथ जिम्मेदारी से विस्तार करना हमारा लक्ष्य है। उपलब्धता स्थान और संचालन की तैयारी पर निर्भर है; पूरे देश में तुरंत डिलीवरी का वादा नहीं है।"
        }
      ]
    },
    {
      "id": "start",
      "heading": "स्पष्ट जानकारी के साथ निर्माण शुरू करें",
      "blocks": [
        {
          "type": "paragraph",
          "text": "एक सामग्री, घर के कॉन्सेप्ट या पूरे प्रोजेक्ट के अनुरोध से शुरुआत करें। स्पेसिफिकेशन की तुलना करें, सवाल पूछें और डिलीवरी सहित राशि की पुष्टि करें। बेहतर जानकारी से बेहतर निर्माण की नींव बनती है। समझदारी से खरीदें, बेहतर बनाएँ, भारत को आगे बढ़ाएँ।"
        }
      ]
    }
  ],
  "sources": [
    {
      "label": "Explore Neerva materials",
      "href": "/materials"
    },
    {
      "label": "Neerva Design Studio",
      "href": "/design-studio"
    },
    {
      "label": "Neerva material quote guide",
      "href": "/blog/how-to-compare-construction-material-quotes"
    }
  ]
},
  {
    slug: "how-to-compare-construction-material-quotes",
    category: "Buying guide",
    readMinutes: 6,
    publishedAt: "2026-11-22",
    updatedAt: "2026-11-22",
    title: "How to compare a construction material quote before you accept",
    titleHi: "निर्माण सामग्री का कोटेशन स्वीकार करने से पहले कैसे जाँचें",
    excerpt: "Compare specifications, quantity, delivery and the complete payable amount—not just the first number on a quote.",
    excerptHi: "सिर्फ शुरुआती कीमत नहीं—स्पेसिफिकेशन, मात्रा, डिलीवरी और कुल देय राशि की तुलना करें।",
    sections: [
      {
        id: "match-the-material",
        heading: "1. Match the material and specification",
        blocks: [
          { type: "paragraph", text: "Before comparing amounts, check that every offer describes the material you actually asked for. Record the product name, brand or make, grade or type, size, finish and any required certificate. Ask the seller to write down every proposed substitute." },
          { type: "callout", title: "Do not compare unlike items", text: "A lower amount is not a saving if the grade, size, brand, packing or specification is different." },
        ],
      },
      {
        id: "check-units",
        heading: "2. Check quantity and unit carefully",
        blocks: [
          { type: "paragraph", text: "Confirm whether the quoted rate is per piece, bag, kilogram, quintal, tonne, cubic foot, cubic metre or another unit. For bulk material, ask how the delivered quantity will be measured and recorded. Do not treat a theoretical weight or calculator estimate as a weighbridge reading." },
          { type: "list", items: ["Write the requested quantity and unit on the same line.", "Ask how shortages, breakage or damaged packing are reported.", "For conversions, confirm the conversion basis with the seller before payment."] },
        ],
      },
      {
        id: "compare-total",
        heading: "3. Compare the full delivered amount",
        blocks: [
          { type: "paragraph", text: "Ask for an itemized offer: material subtotal, applicable tax, freight, unloading and any other charge. Ask what is included, what is excluded and whether the total can change. A quote should not leave transport or unloading costs to be disclosed after the order." },
          { type: "callout", title: "For sand, morang and aggregates", text: "Treat these as quotation-only when configured that way. Confirm the final approved amount, delivery location, vehicle or quantity basis, schedule and applicable transport documents before accepting." },
        ],
      },
      {
        id: "availability-delivery",
        heading: "4. Confirm stock and delivery terms",
        blocks: [
          { type: "paragraph", text: "Ask whether the quantity is available now or needs sourcing. Get the delivery date or time window, unloading responsibility, site access assumptions and the process for a delay. A seller should confirm the schedule; do not rely on an unverified platform estimate." },
        ],
      },
      {
        id: "validity-records",
        heading: "5. Check validity, seller details and documents",
        blocks: [
          { type: "paragraph", text: "Check the quote date, expiry, seller name, contact details and payment recipient. Where applicable, verify the seller's GST registration through the official GST portal and check invoice details against the transaction. Certification requirements depend on the product: when a product carries an ISI mark, BIS says its CARE app can verify licence details. Ask for relevant product and transport documents for the material and location." },
          { type: "list", items: ["Save the written quote and all revisions.", "Keep the accepted quantity, unit, total, delivery terms and validity together.", "Before unloading is complete, record visible damage or shortage and notify the seller using the agreed process."] },
        ],
      },
      {
        id: "before-accepting",
        heading: "A simple checklist before accepting",
        blocks: [
          { type: "list", items: ["Is it the same material and specification I requested?", "Are quantity and unit explicit?", "Are tax, freight, unloading and other charges itemized?", "Is stock and delivery timing confirmed?", "Are quote expiry, payment recipient and shortage terms clear?", "Do I have the final amount in writing before paying?"] },
        ],
      },
    ],
    sectionsHi: [
      {
        id: "match-the-material",
        heading: "1. सामग्री और स्पेसिफिकेशन मिलाएँ",
        blocks: [
          { type: "paragraph", text: "कीमत की तुलना से पहले देखें कि हर ऑफर में वही सामग्री लिखी है जो आपने माँगी थी। उत्पाद का नाम, ब्रांड या मेक, ग्रेड या प्रकार, आकार, फिनिश और आवश्यक प्रमाणपत्र दर्ज करें। कोई विकल्प सुझाया गया हो तो उसे लिखित में लें।" },
          { type: "callout", title: "अलग चीज़ों की तुलना न करें", text: "कम कीमत बचत नहीं है अगर ग्रेड, आकार, ब्रांड, पैकिंग या स्पेसिफिकेशन अलग है।" },
        ],
      },
      {
        id: "check-units",
        heading: "2. मात्रा और यूनिट ध्यान से जाँचें",
        blocks: [
          { type: "paragraph", text: "पुष्टि करें कि दर प्रति पीस, बैग, किलोग्राम, क्विंटल, टन, घन फुट, घन मीटर या किसी दूसरी यूनिट के हिसाब से है। थोक सामग्री में पूछें कि डिलीवर हुई मात्रा कैसे मापी और दर्ज की जाएगी। अनुमानित वजन को वास्तविक वे-ब्रिज रीडिंग न मानें।" },
          { type: "list", items: ["माँगी गई मात्रा और यूनिट एक ही लाइन में लिखवाएँ।", "कमी, टूट-फूट या खराब पैकिंग की रिपोर्ट कैसे होगी, पूछें।", "कन्वर्ज़न से पहले उसका आधार विक्रेता से पुष्टि करें।"] },
        ],
      },
      {
        id: "compare-total",
        heading: "3. डिलीवरी सहित पूरी राशि की तुलना करें",
        blocks: [
          { type: "paragraph", text: "आइटम-वाइज ऑफर माँगें: सामग्री का सबटोटल, लागू टैक्स, भाड़ा, उतराई और अन्य शुल्क। पूछें कि क्या शामिल है, क्या अलग है और कुल राशि बदल सकती है या नहीं। ऑर्डर के बाद परिवहन या उतराई शुल्क बताना स्वीकार न करें।" },
          { type: "callout", title: "बालू, मौरंग और एग्रीगेट के लिए", text: "जहाँ इन्हें कोटेशन-ओनली रखा गया है, वहाँ सार्वजनिक तय कीमत न मानें। स्वीकार करने से पहले अंतिम राशि, डिलीवरी लोकेशन, वाहन/मात्रा का आधार, समय और लागू ट्रांसपोर्ट दस्तावेज़ की पुष्टि करें।" },
        ],
      },
      {
        id: "availability-delivery",
        heading: "4. स्टॉक और डिलीवरी की शर्तें पक्की करें",
        blocks: [
          { type: "paragraph", text: "पूछें कि मात्रा अभी उपलब्ध है या मँगानी पड़ेगी। डिलीवरी की तारीख या समय-सीमा, उतराई की ज़िम्मेदारी, साइट तक पहुँच की शर्तें और देरी होने पर प्रक्रिया लिखित में लें। विक्रेता से समय की पुष्टि लें; बिना सत्यापन वाले प्लेटफ़ॉर्म अनुमान पर निर्भर न रहें।" },
        ],
      },
      {
        id: "validity-records",
        heading: "5. वैधता, विक्रेता और दस्तावेज़ जाँचें",
        blocks: [
          { type: "paragraph", text: "कोटेशन की तारीख, समाप्ति, विक्रेता का नाम, संपर्क और भुगतान पाने वाले का नाम जाँचें। जहाँ लागू हो, आधिकारिक GST पोर्टल पर पंजीकरण देखें और इनवॉइस का लेन-देन से मिलान करें। प्रमाणन की शर्त उत्पाद पर निर्भर है: ISI मार्क वाले उत्पाद के लिए BIS अपने CARE ऐप से लाइसेंस विवरण जाँचने की सुविधा बताता है। सामग्री और लोकेशन के अनुसार ज़रूरी उत्पाद व परिवहन दस्तावेज़ माँगें।" },
          { type: "list", items: ["लिखित कोटेशन और उसके सभी बदलाव सुरक्षित रखें।", "स्वीकृत मात्रा, यूनिट, कुल राशि, डिलीवरी शर्तें और वैधता साथ में रखें।", "उताराई पूरी होने से पहले दिखने वाली टूट-फूट या कमी दर्ज करें और तय प्रक्रिया से विक्रेता को बताएँ।"] },
        ],
      },
      {
        id: "before-accepting",
        heading: "स्वीकार करने से पहले छोटी चेकलिस्ट",
        blocks: [
          { type: "list", items: ["क्या सामग्री और स्पेसिफिकेशन वही हैं जो मैंने माँगे?", "क्या मात्रा और यूनिट साफ लिखी है?", "क्या टैक्स, भाड़ा, उतराई और दूसरे शुल्क अलग दिखाए हैं?", "क्या स्टॉक और डिलीवरी समय पक्का है?", "क्या कोटेशन की वैधता, भुगतान पाने वाला और कमी की शर्तें स्पष्ट हैं?", "क्या भुगतान से पहले अंतिम राशि लिखित में मिली है?"] },
        ],
      },
    ],
    sources: [
      { label: "Bureau of Indian Standards: BIS CARE app and licence verification", href: "https://www.bis.gov.in/bis-apps/?lang=en" },
      { label: "GST Portal: Search taxpayer by GSTIN/UIN", href: "https://tutorial.gst.gov.in/userguide/taxpayersdashboard/Search_Taxpayer_manual.htm" },
      { label: "CBIC: GST invoice rules", href: "https://cbic-gst.gov.in/gst-invoice-rules.html" },
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
