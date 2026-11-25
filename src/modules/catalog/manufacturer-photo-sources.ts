// Verified manufacturer product pages; links only, not permission to reproduce artwork.
const officialProductPages:Record<string,string>={
 "hardware:myk-335-white":"https://myklaticrete.com/products/tile-adhesive/polymer-modified-thin-set-adhesives/myk-laticrete-335-super-flex/",
};
export function manufacturerPhotoSource(category:string,slug:string):string|undefined{return officialProductPages[category+":"+slug];}
