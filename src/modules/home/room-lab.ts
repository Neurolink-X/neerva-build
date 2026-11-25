export const furniture=[
 {kind:"sofa",label:"Sofa",w:7,d:3,colour:"#8c9e8d"},
 {kind:"bed",label:"Double bed",w:5,d:6.5,colour:"#c2a788"},
 {kind:"table",label:"Dining table",w:4,d:3,colour:"#ac8059"},
 {kind:"desk",label:"Desk",w:4,d:2,colour:"#b3a38a"},
 {kind:"wardrobe",label:"Wardrobe",w:4,d:2,colour:"#776657"},
 {kind:"chair",label:"Chair",w:2,d:2,colour:"#a8b8b7"}
] as const;
export type Kind=typeof furniture[number]["kind"];
export type Piece={id:number;kind:Kind;x:number;y:number;rotated:boolean};
export type RoomLab={width:number;depth:number;wall:string;floor:string;pieces:Piece[]};
export const labKey="neerva-room-lab-v1",maxPieces=12;
export const defaultLab:RoomLab={width:12,depth:14,wall:"#dbe4d1",floor:"#cdbca4",pieces:[]};
export const wallColours=["#dbe4d1","#f1e7d5","#e6edf0","#f4dfc7","#e9e8e3"];
export const floorColours=["#cdbca4","#a89882","#e4ddd0","#a5aaa6"];
export function dimensions(p:Piece){const f=furniture.find(f=>f.kind===p.kind)!;return p.rotated?{w:f.d,d:f.w}:{w:f.w,d:f.d}}
export function fits(room:RoomLab,p:Piece){const {w,d}=dimensions(p);return Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x+w<=room.width&&p.y+d<=room.depth&&!room.pieces.some(q=>{if(q.id===p.id)return false;const s=dimensions(q);return p.x<q.x+s.w&&p.x+w>q.x&&p.y<q.y+s.d&&p.y+d>q.y})}
export function parseLab(raw:unknown):RoomLab{const r=raw&&typeof raw==="object"?raw as Partial<RoomLab>:{};const size=(v:unknown,f:number)=>typeof v==="number"&&Number.isFinite(v)&&v>=8&&v<=30?Math.round(v*2)/2:f;const room:RoomLab={width:size(r.width,12),depth:size(r.depth,14),wall:wallColours.includes(r.wall??"")?r.wall!:defaultLab.wall,floor:floorColours.includes(r.floor??"")?r.floor!:defaultLab.floor,pieces:[]};if(Array.isArray(r.pieces))for(const p of r.pieces.slice(0,maxPieces)){if(!p||!Number.isInteger(p.id)||p.id<1||p.id>1000000||room.pieces.some(q=>q.id===p.id)||!furniture.some(f=>f.kind===p.kind)||typeof p.rotated!=="boolean")continue;const item:Piece={id:p.id,kind:p.kind,x:p.x,y:p.y,rotated:p.rotated};if(fits(room,item))room.pieces.push(item)}return room}
export function readLab(raw:string|null){try{return parseLab(raw&&raw.length<=4096?JSON.parse(raw):null)}catch{return parseLab(null)}}
export function addFurniture(room:RoomLab,kind:Kind):RoomLab{if(room.pieces.length>=maxPieces||!furniture.some(f=>f.kind===kind))return room;const id=Array.from({length:maxPieces+1},(_,i)=>i+1).find(id=>!room.pieces.some(p=>p.id===id))!;for(const rotated of [false,true])for(let y=0;y<room.depth;y+=.5)for(let x=0;x<room.width;x+=.5){const p={id,kind,x,y,rotated};if(fits(room,p))return {...room,pieces:[...room.pieces,p]}}return room}
export function movePiece(room:RoomLab,id:number,patch:Partial<Pick<Piece,"x"|"y"|"rotated">>):RoomLab{const p=room.pieces.find(p=>p.id===id);if(!p)return room;const next={...p,...patch};return fits(room,next)?{...room,pieces:room.pieces.map(q=>q.id===id?next:q)}:room}
export function occupiedArea(room:RoomLab){return room.pieces.reduce((n,p)=>{const d=dimensions(p);return n+d.w*d.d},0)}
