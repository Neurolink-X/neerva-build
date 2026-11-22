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
