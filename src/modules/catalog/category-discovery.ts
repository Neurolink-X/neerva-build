/** Customer-facing shortcuts use existing catalog routes, not invented inventory. */
export const categoryChoices:Record<string,readonly {en:string;hi:string;slug:string}[]>={
 "bricks-blocks":[{en:"Red clay brick (Lal eent)",hi:"लाल ईंट",slug:"red-clay-brick"},{en:"Fly ash brick",hi:"फ्लाई ऐश ईंट",slug:"generic-fly-ash-standard"},{en:"AAC block",hi:"AAC ब्लॉक",slug:"aac-block-600x200"},{en:"Hollow block",hi:"खोखला ब्लॉक",slug:"generic-hollow-100mm"}],
 plumbing:[{en:"CPVC",hi:"CPVC",slug:"generic-cpvc-20mm"},{en:"uPVC / SWR",hi:"uPVC / SWR",slug:"generic-upvc-110mm"},{en:"HDPE",hi:"HDPE",slug:"generic-hdpe-32mm"},{en:"Borewell",hi:"बोरवेल",slug:"generic-column-32mm"},{en:"PVC elbow",hi:"PVC एल्बो",slug:"generic-pvc-elbow90-25mm"},{en:"Tank valve",hi:"टंकी वाल्व",slug:"fitting-float-valve"}],
 tiles:[{en:"Floor tile",hi:"फर्श टाइल",slug:"vitrified-tile-600x600"},{en:"Wall tile",hi:"दीवार टाइल",slug:"wall-tile-300x600"},{en:"Marble look",hi:"मार्बल लुक",slug:"orientbell-calacatta-marble"},{en:"Wood look",hi:"वुड लुक",slug:"orientbell-lumber-oak"},{en:"Bathroom tile",hi:"बाथरूम टाइल",slug:"orientbell-safegrip-creama"}],
 hardware:[{en:"Tile adhesive",hi:"टाइल एडहेसिव",slug:"roff-t01-nca"},{en:"Grout",hi:"ग्राउट",slug:"myk-sp100-grout"},{en:"Block adhesive",hi:"ब्लॉक एडहेसिव",slug:"jsw-aac-block-adhesive-block-grip-40-kg-bag-1"},{en:"Door lock",hi:"दरवाज़े का लॉक",slug:"door-mortise-lock"},{en:"Hinges",hi:"कब्जे",slug:"ss-butt-hinge-3in"},{en:"Site tools",hi:"औज़ार",slug:"notched-trowel"}]
};
export const categoryGuidance:Record<string,{en:string;hi:string}>={
 "bricks-blocks":{en:"Choose brick type, dimensions and quantity in pieces.",hi:"ईंट का प्रकार, नाप और संख्या चुनें।"},
 plumbing:{en:"Choose pipe material, diameter, application and matching fittings.",hi:"पाइप का प्रकार, नाप, उपयोग और फिटिंग चुनें।"},
 tiles:{en:"Choose floor or wall, finish, size and area.",hi:"फर्श या दीवार, फिनिश, नाप और क्षेत्रफल चुनें।"},
 hardware:{en:"Choose application, pack, size and compatibility.",hi:"उपयोग, पैक, नाप और फिटिंग की जानकारी चुनें।"}
};
/** Category-only montage: never used as the photograph of an individual SKU. */
export const categorySecondaryImages:Record<string,readonly string[]>={
 plumbing:["/images/catalog/approved/6162d659d451abcad4e54c55.webp","/images/catalog/approved/03b503783fe52f8e5345acf9.webp"],
 tiles:["/images/catalog/reference/orientbell-star.webp","/images/catalog/reference/orientbell-opal.webp"],
 hardware:["/images/catalog/approved/24463c3c61ce5e4917195b30.webp","/images/catalog/approved/b13185127f5c233b4d08cf36.webp"]
};
export function categoryChoiceHref(category:string,slug:string){return "/materials/"+category+"/"+slug;}

/** Visible source attribution for the reused Commons category previews. */
export const categoryPreviewCredits:Record<string,readonly {author:string;source:string;license:string;licenseUrl:string}[]>={
 plumbing:[{author:"REisemann3937",source:"https://commons.wikimedia.org/wiki/File:PvcElbows.JPG",license:"CC BY-SA 3.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/3.0/"},{author:"Nandhp",source:"https://commons.wikimedia.org/wiki/File:Garden_hose.jpg",license:"CC BY-SA 3.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/3.0/"}],
 hardware:[{author:"Frank C. Müller",source:"https://commons.wikimedia.org/wiki/File:Silikonpistole_(fcm).jpg",license:"CC BY-SA 3.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/3.0/"},{author:"Carolin Heuckmann",source:"https://commons.wikimedia.org/wiki/File:Knickzahnkelle.JPG",license:"CC BY-SA 3.0 DE",licenseUrl:"https://creativecommons.org/licenses/by-sa/3.0/de/"},{author:"Evan-Amos",source:"https://commons.wikimedia.org/wiki/File:Tool-level.jpg",license:"Public domain",licenseUrl:"https://commons.wikimedia.org/wiki/File:Tool-level.jpg"}]
};
