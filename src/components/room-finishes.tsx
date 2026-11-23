"use client";
import type {Room} from "@/modules/studio/layout";
import {baseline,defaultFinish,roomModel,type Finish,type Shade} from "@/modules/studio/room";
export function ShadeSelect({label,value,onChange,shades=baseline}:{label:string;value:string;onChange:(value:string)=>void;shades?:Shade[]}){
 return <label>{label}<select value={shades.some(s=>s.id===value)?value:shades[0]?.id||""} onChange={e=>onChange(e.target.value)}>{shades.map(s=><option key={s.id} value={s.id}>{s.name} · {s.tier??"Emulsion"}</option>)}</select></label>;
}
export function RoomFinishes({room,finish=defaultFinish,onChange,shades=baseline}:{room:Room;finish?:Finish;onChange:(next:Finish)=>void;shades?:Shade[]}){
 const area=roomModel(room).netWalls;
 const set=(key:keyof Finish,value:string)=>onChange({...finish,[key]:value});
 return <div className="neerva-studio-palette"><h3>Customize {room.name}</h3><p>{area.toFixed(1)} m² net wall surface excluding modeled openings.</p>
  <ShadeSelect label="Main wall" value={finish.wall} onChange={v=>set("wall",v)} shades={shades}/>
  <ShadeSelect label="Accent wall" value={finish.accent} onChange={v=>set("accent",v)} shades={shades}/>
  <ShadeSelect label="Ceiling" value={finish.ceiling} onChange={v=>set("ceiling",v)} shades={shades}/>
  <label>Accent surface<select value={finish.accentWall} onChange={e=>set("accentWall",e.target.value)}>{["rear","right","front","left"].map(w=><option key={w} value={w}>{w}</option>)}</select></label>
  <label>Floor finish<select value={finish.floor} onChange={e=>set("floor",e.target.value)}>{["tile","wood","marble"].map(w=><option key={w}>{w}</option>)}</select></label>
  <p style={{fontSize:12}}>Screen colour is approximate. Verify a physical shade card with the dealer before purchasing paint.</p>
 </div>;
}
