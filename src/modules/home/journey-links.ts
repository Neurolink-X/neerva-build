import type {StageId} from "./project-planner.ts";
export const stageHandbook:Record<StageId,readonly string[]>={planning:["planning"],foundation:["ground"],structure:["structure","masonry"],services:["services"],finishes:["finishes","quality","handover"]};
export const journeyLinks=[
 {href:"/design-studio",label:"Plan your home",hi:"घर की योजना"},
 {href:"/design-studio/visualizer",label:"Preview colours",hi:"रंग आज़माएं"},
 {href:"/calculators",label:"Estimate materials",hi:"सामग्री का अनुमान"},
 {href:"/build-iq",label:"Learn with Academy",hi:"अकादमी में सीखें"},
 {href:"/basket?view=planner",label:"Prepare material list",hi:"सामग्री की सूची"},
 {href:"/account/quotes",label:"My quotations",hi:"मेरे कोटेशन"},
 {href:"/account/orders",label:"My orders",hi:"मेरे ऑर्डर"},
 {href:"/support",label:"Get help",hi:"सहायता"}
] as const;
