export const propertySources=[
 {label:"MoHUA · RERA Act and policy",url:"https://www.mohua.gov.in/documents/acts-and-policies/rera-YDM4EzMtQWa"},
 {label:"Haryana RERA · text of the Act (Section 13)",url:"https://www.haryanarera.gov.in/admincontrol/acts"},
 {label:"Uttar Pradesh RERA · project search",url:"https://www.up-rera.in/"},
 {label:"Uttar Pradesh · stamp and registration",url:"https://igrsup.gov.in/"},
 {label:"Uttar Pradesh · Bhulekh land records",url:"https://upbhulekh.gov.in/bhulekh/"},
 {label:"Department of Land Resources · state land record portals",url:"https://www.dilrmp.gov.in/dilrmpold/State-RoR-Web"}
] as const;
export const propertyGuides=[
 {id:"buy",title:"Buying a house, flat or plot",hi:"घर, फ्लैट या प्लॉट खरीदना",image:"buy",intro:"Do not pay a token just because a listing looks attractive. Verify the property, the seller and the total cost independently.",introHi:"केवल आकर्षक विज्ञापन देखकर बयाना न दें। संपत्ति, विक्रेता और कुल खर्च की स्वतंत्र जांच कराएं।",checks:[
 ["Confirm ownership and the chain of title with a local property lawyer; check co-owners, authority to sell, mortgages, disputes and possession.","स्थानीय वकील से मालिकाना हक, पुराने दस्तावेज, सह-मालिक, ऋण, विवाद और कब्जे की जांच कराएं।"],
 ["For a developer project, check applicable RERA registration, sanctioned plans, disclosed completion date and carpet area on the relevant state portal.","बिल्डर प्रोजेक्ट में लागू RERA पंजीकरण, स्वीकृत नक्शा, पूर्णता की तारीख और कारपेट क्षेत्र देखें।"],
 ["For a ready home, ask for applicable completion and occupancy certificates, association or authority dues, and independent condition inspection.","तैयार घर में लागू पूर्णता और अधिभोग प्रमाणपत्र, बकाया और स्वतंत्र निरीक्षण देखें।"],
 ["Compare total price including registration, stamp duty, applicable taxes, maintenance, financing and repairs. Verify the payee before any transfer.","रजिस्ट्री, स्टाम्प शुल्क, लागू कर, रखरखाव, ऋण और मरम्मत समेत कुल खर्च देखें। भुगतान से पहले खाते की पुष्टि करें।"]
 ],redFlag:"Pressure to pay before checking title, mismatched survey or flat number, or a promise to regularise unauthorised construction later.",redFlagHi:"हक की जांच से पहले भुगतान का दबाव, गलत प्लॉट नंबर या बाद में अवैध निर्माण को नियमित कराने का वादा।"},
 {id:"sell",title:"Selling your existing home",hi:"अपना घर बेचना",image:"sell",intro:"Prepare accurate information before inviting buyers. Use local comparable transactions and a qualified valuation where needed; an advertised asking price is not a verified market value.",introHi:"खरीदारों से मिलने से पहले सही जानकारी तैयार करें। स्थानीय तुलनीय बिक्री और जरूरत पर विशेषज्ञ मूल्यांकन लें।",checks:[
 ["Confirm that every required owner or authorised representative can sign; have succession or power-of-attorney documents checked where relevant.","सभी जरूरी मालिकों की सहमति लें और लागू उत्तराधिकार या पावर ऑफ अटॉर्नी की जांच कराएं।"],
 ["Collect title records, sanctioned drawings, applicable completion certificates, loan details, tax receipts and society dues. Disclose known defects or disputes.","हक के कागज, स्वीकृत नक्शे, लागू प्रमाणपत्र, ऋण, कर और बकाया तैयार रखें। ज्ञात दोष या विवाद बताएं।"],
 ["Have a lawyer review the sale agreement, payment milestones, possession date, fixtures included and cancellation terms. Ask a tax professional about applicable tax and withholding.","बिक्री समझौता, भुगतान, कब्जे की तारीख और रद्द करने की शर्तें वकील से जांचें। लागू कर पर विशेषज्ञ की सलाह लें।"],
 ["Use documented payments and a verified registration process. Coordinate loan release, key handover, meter readings and acknowledgements.","लिखित भुगतान और सत्यापित रजिस्ट्री प्रक्रिया अपनाएं। ऋण मुक्ति, चाबी, मीटर रीडिंग और रसीदें संभालें।"]
 ],redFlag:"A buyer asks for an OTP, UPI PIN, upfront refund or public upload of identity papers; stop and verify independently.",redFlagHi:"खरीदार OTP, UPI PIN, पहले रिफंड या पहचान पत्र सार्वजनिक करने को कहे तो रुकें और जांचें।"},
 {id:"build",title:"Buying land to build a home",hi:"घर बनाने के लिए जमीन खरीदना",image:"build",intro:"Ownership alone does not establish the right to construct the home you want. Check legal use and actual site constraints before design or procurement.",introHi:"सिर्फ जमीन का मालिक होना मनचाहा निर्माण करने की अनुमति नहीं है। डिजाइन से पहले भूमि उपयोग और स्थल की सीमाएं जांचें।",checks:[
 ["Have a surveyor confirm plot boundaries, access, dimensions, road width and any easements or encroachment against records.","सर्वेयर से सीमा, रास्ता, माप, सड़क और अतिक्रमण की जांच कराएं।"],
 ["Ask the local authority about permitted land use, conversion if needed, setbacks, height, access and required building permission.","स्थानीय प्राधिकरण से भूमि उपयोग, जरूरत पर परिवर्तन, खुली जगह, ऊंचाई और निर्माण अनुमति जांचें।"],
 ["Arrange site and soil assessment, architectural and structural design, service coordination and a written scope before excavation.","खुदाई से पहले मिट्टी जांच, वास्तु व संरचना नक्शा, सेवा योजना और लिखित कार्य विवरण लें।"],
 ["Keep approved drawings, inspection reports, material invoices, test results, warranties and required completion records together.","स्वीकृत नक्शे, निरीक्षण रिपोर्ट, सामग्री बिल, परीक्षण, वारंटी और पूर्णता रिकॉर्ड सुरक्षित रखें।"]
 ],redFlag:"A cheap agricultural or restricted-use plot is advertised as ready for residential construction without verified permission.",redFlagHi:"बिना प्रमाणित अनुमति कृषि या प्रतिबंधित भूमि को आवासीय निर्माण योग्य बताना।"}
] as const;
export const documentGuide=[
 ["Title deed and prior deeds","मालिकाना व पुराने दस्तावेज","Evidence for a lawyer to trace how ownership passed; a registered deed alone is not a title guarantee."],
 ["Encumbrance record and loan release","भार-मुक्ति रिकॉर्ड और ऋण मुक्ति","Check recorded transactions and mortgage status; an empty search does not rule out every claim or dispute."],
 ["Revenue record, khatauni and mutation","राजस्व रिकॉर्ड, खतौनी और नामांतरण","Match the parcel and recorded holder. Mutation or a revenue entry is not conclusive ownership proof."],
 ["Sanctioned plan, land use and permission","स्वीकृत नक्शा, भूमि उपयोग और अनुमति","Check authorised construction with the applicable local authority."],
 ["RERA project record, if applicable","लागू होने पर RERA रिकॉर्ड","Check the exact project or phase, disclosures and status; registration is not a guarantee of title or delivery."],
 ["Completion / occupancy documents, if applicable","लागू पूर्णता / अधिभोग प्रमाणपत्र","Check with the issuing authority rather than relying on a brochure."],
 ["Tax receipts, association and utility dues","कर रसीदें, सोसायटी और सेवा बकाया","Check liabilities and handover amounts; receipts do not establish title."],
 ["Agreement for sale and registered conveyance","बिक्री समझौता और पंजीकृत हस्तांतरण","Different purposes: a contract sets terms; the conveyance transfers rights according to applicable law."]
] as const;
