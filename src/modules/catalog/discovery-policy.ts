// Curate discovery without deleting SKUs, orders or direct routes.
const accessories=new Set(["wood-adhesive","fevikwik-203","tile-grout-sponge","masking-tape","roff-tile-spacers","taparia-two-in-one","taparia-long-nose","taparia-side-cutter","cabinet-knob","cabinet-magnetic-catch","window-weather-strip","fitting-ptfe","fitting-gasket","fitting-grommet","fitting-hose-collar","fitting-tank-lid","fitting-base-pad","fitting-gland-seal","fitting-pump-cable"]);
export function isPublicConstructionProduct(p:{category:string;slug:string}){
 return !((p.category==="hardware"||p.category==="plumbing")&&accessories.has(p.slug));
}
