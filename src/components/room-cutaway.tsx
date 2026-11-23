import {roomModel,baseline,type Shade,type Finish} from "@/modules/studio/room";
import type {Room} from "@/modules/studio/layout";
type Props={room:Room;finish:Finish;shades:Shade[];split?:number};
function colour(id:string,shades:Shade[]){return shades.find(s=>s.id===id)?.hex??"#e4e3dc"}
export function RoomCutaway({room,finish,shades=baseline,split=0.5}:Props){
 const m=roomModel(room),main=colour(finish.wall,shades),accent=colour(finish.accent,shades),ceiling=colour(finish.ceiling,shades);
 const splitAt=Math.max(.05,Math.min(.95,split));
 const rear=finish.accentWall==="rear"?accent:main;
 const left=finish.accentWall==="left"?accent:main;
 return <svg viewBox="0 0 700 460" role="img" aria-label={"Conceptual cutaway view of "+room.name+" with "+m.openings.length+" modeled openings"} style={{width:"100%",maxHeight:480,borderRadius:12,background:"#ecf2ee"}}>
 <defs><linearGradient id="room-lit" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#ffffff" stopOpacity=".22"/><stop offset="1" stopColor="#1a2921" stopOpacity=".16"/></linearGradient></defs>
 <polygon points="110,145 415,75 615,140 310,212" fill={ceiling} opacity=".58"/>
 <polygon points="110,145 310,212 310,420 110,335" fill={left} stroke="#6b8070" strokeWidth="3"/>
 <polygon points="310,212 615,140 615,340 310,420" fill={rear} stroke="#637667" strokeWidth="3"/>
 <polygon points="110,335 310,420 615,340 415,268" fill={finish.floor==="wood"?"#b9a084":finish.floor==="marble"?"#d9d8d2":"#c9c3b4"} stroke="#59675d" strokeWidth="3"/>
 <path d="M140 200L250 239L250 340L140 297Z" fill="#99b6bf" stroke="#657e78" strokeWidth="9" opacity=".85"/>
 <path d="M410 230L520 201L520 295L410 325Z" fill="#a9c4c8" stroke="#697b72" strokeWidth="9"/>
 <rect x="0" y="0" width={700*splitAt} height="460" fill="#ffffff" opacity=".06"/>
 <text x="340" y="450" fill="#52685a" textAnchor="middle" fontSize="16">CONCEPT ROOM · FINISHES & SCALE APPROXIMATE</text>
 </svg>;
}
