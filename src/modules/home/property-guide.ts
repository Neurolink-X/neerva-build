export const propertySources=[
 {label:"India Code · Real Estate Act, 2016",url:"https://www.indiacode.nic.in/indiacode/handle/123456789/2158?view_type=browse"},
 {label:"Uttar Pradesh RERA · project search",url:"https://up-rera.in/index"},
 {label:"Uttar Pradesh · stamp and registration",url:"https://igrsup.gov.in/"},
 {label:"Uttar Pradesh · Bhulekh land records",url:"https://upbhulekh.gov.in/bhulekh/"},
 {label:"Department of Land Resources · state land record portals",url:"https://www.dilrmp.gov.in/dilrmpold/State-RoR-Web"}
] as const;
export const propertyGuides=[
 {id:"buy",title:"Buying a house, flat or plot",hi:"घर, फ्लैट या प्लॉट खरीदना",image:"buy",intro:"Do not pay a token just because a listing looks attractive. Verify the property, the seller and the total cost independently.",introHi:"केवल आकर्षक विज्ञापन देखकर बयाना न दें। संपत्ति, विक्रेता और कुल खर्च की स्वतंत्र जांच कराएं।",checks:[
 ["Ask a property lawyer to check who owns the property, how they got it, who can sell it, and whether any loan or dispute is pending.","स्थानीय वकील से मालिकाना हक, पुराने दस्तावेज, सह-मालिक, ऋण, विवाद और कब्जे की जांच कराएं।"],
 ["Buying from a builder? Check the exact project on your state RERA portal where applicable. Match the approved plan, promised completion date and usable carpet area.","बिल्डर प्रोजेक्ट में लागू RERA पंजीकरण, स्वीकृत नक्शा, पूर्णता की तारीख और कारपेट क्षेत्र देखें।"],
 ["Buying a ready home? Check applicable completion and occupancy certificates, unpaid dues and the actual condition of the house.","तैयार घर में लागू पूर्णता और अधिभोग प्रमाणपत्र, बकाया और स्वतंत्र निरीक्षण देखें।"],
 ["Compare total price including registration, stamp duty, applicable taxes, maintenance, financing and repairs. Verify the payee before any transfer.","रजिस्ट्री, स्टाम्प शुल्क, लागू कर, रखरखाव, ऋण और मरम्मत समेत कुल खर्च देखें। भुगतान से पहले खाते की पुष्टि करें।"]
 ],redFlag:"Pressure to pay before checking title, mismatched survey or flat number, or a promise to regularise unauthorised construction later.",redFlagHi:"हक की जांच से पहले भुगतान का दबाव, गलत प्लॉट नंबर या बाद में अवैध निर्माण को नियमित कराने का वादा।"},
 {id:"sell",title:"Selling your existing home",hi:"अपना घर बेचना",image:"sell",intro:"Prepare accurate information before inviting buyers. Use local comparable transactions and a qualified valuation where needed; an advertised asking price is not a verified market value.",introHi:"खरीदारों से मिलने से पहले सही जानकारी तैयार करें। स्थानीय तुलनीय बिक्री और जरूरत पर विशेषज्ञ मूल्यांकन लें।",checks:[
 ["Confirm that every required owner or authorised representative can sign; have succession or power-of-attorney documents checked where relevant.","सभी जरूरी मालिकों की सहमति लें और लागू उत्तराधिकार या पावर ऑफ अटॉर्नी की जांच कराएं।"],
 ["Collect title records, sanctioned drawings, applicable completion certificates, loan details, tax receipts and society dues. Disclose known defects or disputes.","हक के कागज, स्वीकृत नक्शे, लागू प्रमाणपत्र, ऋण, कर और बकाया तैयार रखें। ज्ञात दोष या विवाद बताएं।"],
 ["Have a lawyer review the sale agreement, payment milestones, possession date, fixtures included and cancellation terms. Ask a tax professional about applicable tax and withholding.","बिक्री समझौता, भुगतान, कब्जे की तारीख और रद्द करने की शर्तें वकील से जांचें। लागू कर पर विशेषज्ञ की सलाह लें।"],
 ["Keep payment receipts. Register the sale through the official process, confirm any loan release, and record keys, meter readings and possession handover.","लिखित भुगतान और सत्यापित रजिस्ट्री प्रक्रिया अपनाएं। ऋण मुक्ति, चाबी, मीटर रीडिंग और रसीदें संभालें।"]
 ],redFlag:"A buyer asks for an OTP, UPI PIN, upfront refund or public upload of identity papers; stop and verify independently.",redFlagHi:"खरीदार OTP, UPI PIN, पहले रिफंड या पहचान पत्र सार्वजनिक करने को कहे तो रुकें और जांचें।"},
 {id:"build",title:"Buying land to build a home",hi:"घर बनाने के लिए जमीन खरीदना",image:"build",intro:"Ownership alone does not establish the right to construct the home you want. Check legal use and actual site constraints before design or procurement.",introHi:"सिर्फ जमीन का मालिक होना मनचाहा निर्माण करने की अनुमति नहीं है। डिजाइन से पहले भूमि उपयोग और स्थल की सीमाएं जांचें।",checks:[
 ["Get a surveyor to match the plot boundaries, road access, measurements and any shared access rights with the records. Check for encroachment.","सर्वेयर से सीमा, रास्ता, माप, सड़क और अतिक्रमण की जांच कराएं।"],
 ["Ask the local authority whether a home can legally be built there. Check permission, required open space around the house, height and road access.","स्थानीय प्राधिकरण से भूमि उपयोग, जरूरत पर परिवर्तन, खुली जगह, ऊंचाई और निर्माण अनुमति जांचें।"],
 ["Before digging, get the soil checked and the architect and engineer to prepare the house and structural drawings. Agree on the work in writing.","खुदाई से पहले मिट्टी जांच, वास्तु व संरचना नक्शा, सेवा योजना और लिखित कार्य विवरण लें।"],
 ["Keep approved drawings, inspection reports, material invoices, test results, warranties and required completion records together.","स्वीकृत नक्शे, निरीक्षण रिपोर्ट, सामग्री बिल, परीक्षण, वारंटी और पूर्णता रिकॉर्ड सुरक्षित रखें।"]
 ],redFlag:"A cheap agricultural or restricted-use plot is advertised as ready for residential construction without verified permission.",redFlagHi:"बिना प्रमाणित अनुमति कृषि या प्रतिबंधित भूमि को आवासीय निर्माण योग्य बताना।"}
] as const;
export const documentGuide=[
 ["Title deed and prior deeds","मालिकाना व पुराने दस्तावेज","Shows how the property changed hands. Ask a lawyer to check the full history; registration alone does not guarantee ownership."],
 ["Encumbrance record and loan release","भार-मुक्ति रिकॉर्ड और ऋण मुक्ति","Helps find recorded mortgages or charges. Ask the lender for proof of release if a loan was cleared. A clear search is not proof that no dispute exists."],
 ["Revenue record, khatauni and mutation","राजस्व रिकॉर्ड, खतौनी और नामांतरण","Khatauni records land details; mutation updates the recorded name. Neither alone proves ownership."],
 ["Sanctioned plan, land use and permission","स्वीकृत नक्शा, भूमि उपयोग और अनुमति","Check authorised construction with the applicable local authority."],
 ["RERA project record, if applicable","लागू होने पर RERA रिकॉर्ड","Check the exact project or phase, disclosures and status; registration is not a guarantee of title or delivery."],
 ["Completion / occupancy documents, if applicable","लागू पूर्णता / अधिभोग प्रमाणपत्र","Check with the issuing authority rather than relying on a brochure."],
 ["Tax receipts, association and utility dues","कर रसीदें, सोसायटी और सेवा बकाया","Check liabilities and handover amounts; receipts do not establish title."],
 ["Agreement for sale and registered conveyance","बिक्री समझौता और पंजीकृत हस्तांतरण","A sale agreement sets the price and conditions. A registered sale deed transfers rights according to applicable law."]
] as const;
