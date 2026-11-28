import type {PhotoMask} from "./facade-paint.ts";
import type {MaskCorner} from "./mask-editor.ts";
/** Original AI-generated room, 1536×1024, compressed to 800×533 for web.
 * Masks reviewed on the original photo; conservative 2–4px insets avoid ceiling,
 * skirting and sofa pixels. Each wall uses its own plane, not a shared rectangle. */
export const cornerRoomAsset={src:"/images/studio/corner-living-room.webp",width:800,height:533,bytes:10700,blobSha:"9f9c697a73aa1cc6a9958bf84832fd3b29b31cfc"} as const;
const ring=(coords:number[][])=>coords.map(([x,y])=>[x/1536,y/1024]);
const corners=(coords:number[][]):MaskCorner[]=>ring(coords).map(([x,y])=>({x,y}));
type RoomWall={label:string;points:MaskCorner[];mask:PhotoMask};
export const cornerRoomWalls:readonly RoomWall[]=[
 {label:"Sofa wall",points:corners([[3,12],[941,162],[941,756],[3,811]]),mask:{outline:ring([[3,12],[941,162],[941,756],[660,781],[660,687],[655,682],[641,678],[606,671],[554,668],[532,668],[532,649],[527,637],[518,634],[488,634],[482,627],[461,633],[388,630],[375,628],[356,633],[353,620],[342,625],[310,631],[261,625],[254,629],[254,634],[99,633],[93,619],[86,618],[56,628],[26,631],[3,626]])}},
 {label:"Side wall",points:corners([[946,162],[1533,20],[1533,835],[946,756]]),mask:{outline:ring([[946,162],[1533,20],[1533,835],[946,756]])}}
];
export function cornerRoomInitialWalls(colour:string){return cornerRoomWalls.map(w=>({points:w.points,mask:w.mask,colour,accent:"#c4925f",pattern:"plain" as const,opacity:.78}));}
