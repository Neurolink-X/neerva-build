"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export type FloorRoom = { id: string; name: string; x: number; y: number; w: number; h: number; type: "room" | "open" | "parking" | "service" };
type Plot = { label: string; w: number; d: number };

const colours: Record<FloorRoom["type"], string> = { room: "#e9eadf", open: "#e2ebdc", parking: "#e1e9e7", service: "#dce8e6" };
function overlaps(a: FloorRoom, b: FloorRoom) { return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }

export function FloorPlanEditor({ plot, title, summary, rooms: initialRooms, onSave }: { plot: Plot; title: string; summary: string; rooms: FloorRoom[]; onSave: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragStart = useRef<FloorRoom[] | null>(null);
  const [rooms, setRooms] = useState(initialRooms);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<FloorRoom[][]>([]);
  const [future, setFuture] = useState<FloorRoom[][]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const selectedRoom = rooms.find((item) => item.id === selected);

  function point(event: ReactPointerEvent<SVGElement>) {
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return { x: ((event.clientX-bounds.left)/bounds.width)*100, y: ((event.clientY-bounds.top)/bounds.height)*100 };
  }
  function commit(next: FloorRoom[]) { setHistory((prev) => [...prev.slice(-19), rooms]); setFuture([]); setRooms(next); setSavedAt(null); }
  function onMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!drag) return;
    const p = point(event); const original = rooms.find((item) => item.id === drag.id); if (!original) return;
    const moved = { ...original, x: Math.max(5, Math.min(95-original.w, Math.round((p.x-drag.dx)/2)*2)), y: Math.max(5, Math.min(95-original.h, Math.round((p.y-drag.dy)/2)*2)) };
    const next = rooms.map((item) => item.id === moved.id ? moved : item);
    if (!next.some((item) => item.id !== moved.id && overlaps(moved,item))) setRooms(next);
  }
  function endMove() {
    if (drag && dragStart.current) {
      const before = dragStart.current;
      if (JSON.stringify(before) !== JSON.stringify(rooms)) {
        setHistory((prev) => [...prev.slice(-19), before]);
        setFuture([]);
        setSavedAt(null);
      }
    }
    dragStart.current = null;
    setDrag(null);
  }
  function moveBy(id: string, dx: number, dy: number) { const moved = rooms.find((item) => item.id===id); if (!moved) return; const nextRoom={...moved,x:Math.max(5,Math.min(95-moved.w,moved.x+dx)),y:Math.max(5,Math.min(95-moved.h,moved.y+dy))}; const next=rooms.map((item)=>item.id===id?nextRoom:item); if (!next.some((item)=>item.id!==id&&overlaps(nextRoom,item))) commit(next); }
  function resize(id: string, dw: number, dh: number) { const old=rooms.find((item)=>item.id===id); if(!old)return; const size={...old,w:Math.max(10,Math.min(85,old.w+dw)),h:Math.max(10,Math.min(85,old.h+dh))}; const next=rooms.map((item)=>item.id===id?size:item); if(!next.some((item)=>item.id!==id&&overlaps(size,item))) commit(next); }
  function undo() { const previous=history.at(-1); if(!previous)return; setFuture((items)=>[rooms,...items]); setRooms(previous); setHistory((items)=>items.slice(0,-1)); setSavedAt(null); }
  function redo() { const next=future[0]; if(!next)return; setHistory((items)=>[...items,rooms]); setRooms(next); setFuture((items)=>items.slice(1)); setSavedAt(null); }
  function save() { try { const versions=JSON.parse(localStorage.getItem("neerva-design-versions")||"[]") as { id:string; title:string; savedAt:string; plot:Plot; rooms:FloorRoom[] }[]; const savedAtNow=new Date().toISOString(); versions.unshift({ id:crypto.randomUUID(), title, savedAt:savedAtNow, plot, rooms }); localStorage.setItem("neerva-design-versions",JSON.stringify(versions.slice(0,5))); setSavedAt(savedAtNow); onSave(); } catch { setSavedAt(null); } }
  const width=selectedRoom?Math.max(4,Math.round(plot.w*selectedRoom.w/100)):0;
  const depth=selectedRoom?Math.max(5,Math.round(plot.d*selectedRoom.h/100)):0;
  return <section className="plan-editor" aria-label="Interactive conceptual floor plan editor">
    <div className="plan-editor-heading"><div><span className="eyebrow">{plot.label.toUpperCase()} · CONCEPT PLAN</span><h1>{title}</h1><p>{summary}</p></div><div className="zoom-tools"><button aria-label="Zoom out" onClick={()=>setZoom((value)=>Math.max(.75,value-.1))}>−</button><span>{Math.round(zoom*100)}%</span><button aria-label="Zoom in" onClick={()=>setZoom((value)=>Math.min(1.25,value+.1))}>+</button></div></div>
    <div className="plan-canvas-wrap"><svg ref={svgRef} className="plan-canvas" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`${title}, ${plot.label}, conceptual plan`} onPointerMove={onMove} onPointerUp={endMove} onPointerCancel={endMove} onPointerLeave={endMove} style={{ transform:`scale(${zoom})` }}>
      <defs><pattern id="plan-grid" width="2" height="2" patternUnits="userSpaceOnUse"><path d="M2 0L0 0 0 2" fill="none" stroke="#d8ded6" strokeWidth=".12"/></pattern></defs>
      <rect width="100" height="100" fill="url(#plan-grid)"/><rect x="4" y="4" width="92" height="92" rx=".5" fill="#fffdf8" stroke="#25372d" strokeWidth=".9"/>
      <text x="50" y="2.3" textAnchor="middle" className="plan-dimension">ROAD · {plot.w} FT FRONTAGE</text><text x="98" y="50" textAnchor="middle" transform="rotate(90 98 50)" className="plan-dimension">{plot.d} FT DEPTH</text>
      {rooms.map((item)=>{const roomWidth=Math.max(4,Math.round(plot.w*item.w/100));const roomDepth=Math.max(5,Math.round(plot.d*item.h/100)); return <g key={item.id} className={`plan-room ${selected===item.id?"selected":""}`} role="button" tabIndex={0} aria-label={`${item.name}, ${roomWidth} by ${roomDepth} feet. Drag or use arrow keys to move.`} onClick={()=>setSelected(item.id)} onKeyDown={(event)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();setSelected(item.id);}if(selected===item.id&&event.key.startsWith("Arrow")){event.preventDefault();moveBy(item.id,event.key==="ArrowLeft"?-2:event.key==="ArrowRight"?2:0,event.key==="ArrowUp"?-2:event.key==="ArrowDown"?2:0);}}} onPointerDown={(event)=>{event.stopPropagation();svgRef.current?.setPointerCapture(event.pointerId);const p=point(event);dragStart.current=rooms.map((room)=>({...room}));setSelected(item.id);setDrag({id:item.id,dx:p.x-item.x,dy:p.y-item.y});}}>
        <rect x={item.x} y={item.y} width={item.w} height={item.h} fill={colours[item.type]} stroke={selected===item.id?"#d55d36":"#34473a"} strokeWidth={selected===item.id?".8":".42"} vectorEffect="non-scaling-stroke"/>
        <path d={`M ${item.x+item.w*.15} ${item.y+item.h} v -${Math.min(3,item.h*.18)} a ${Math.min(3,item.h*.18)} ${Math.min(3,item.h*.18)} 0 0 1 ${Math.min(3,item.h*.18)} ${Math.min(3,item.h*.18)}`} fill="none" stroke="#a85f43" strokeWidth=".35"/>
        <path d={`M ${item.x+item.w*.3} ${item.y} h ${Math.min(6,item.w*.25)}`} stroke="#71818a" strokeWidth=".8"/>
        <text x={item.x+item.w/2} y={item.y+item.h/2-.5} textAnchor="middle" className="plan-room-label">{item.name.toUpperCase()}</text><text x={item.x+item.w/2} y={item.y+item.h/2+2.6} textAnchor="middle" className="plan-room-dim">{roomWidth}′ × {roomDepth}′ approx.</text>
        {item.type==="parking"&&<g><path d={`M${item.x+item.w*.28} ${item.y+item.h*.32} h${item.w*.44} v${item.h*.38} h-${item.w*.44} z`} fill="#cbd7d3" stroke="#728078" strokeWidth=".3"/><text x={item.x+item.w/2} y={item.y+item.h*.59} textAnchor="middle" className="plan-room-dim">CAR</text></g>}
      </g>;})}
    </svg></div>
    <div className="plan-legend"><span><i className="legend-home"/>Room</span><span><i className="legend-service"/>Bathroom / stairs</span><span><i className="legend-open"/>Open area / balcony</span><span><i className="legend-parking"/>Parking</span><span><i className="legend-window"/>Window</span></div>
    <div className="plan-editor-actions"><button className="button button-outline button-small" onClick={undo} disabled={!history.length}>Undo</button><button className="button button-outline button-small" onClick={redo} disabled={!future.length}>Redo</button><button className="button button-dark button-small" onClick={save}>{savedAt?"Saved on this device ✓":"Save draft"}</button><button className="button button-orange button-small" onClick={()=>window.print()}>Export / print</button></div>
    <div className="selected-room-info">{selectedRoom?<><strong>{selectedRoom.name} · approx. {width} × {depth} ft</strong><span>Drag to reposition. Changes that overlap another room are blocked. Arrow keys also move the selected room.</span><div className="room-resize-tools"><span>Room block size:</span><button onClick={()=>resize(selectedRoom.id,-2,0)}>− width</button><button onClick={()=>resize(selectedRoom.id,2,0)}>+ width</button><button onClick={()=>resize(selectedRoom.id,0,-2)}>− depth</button><button onClick={()=>resize(selectedRoom.id,0,2)}>+ depth</button></div></>:<><strong>Select a room to edit</strong><span>Tap or click any labeled room to see its approximate dimensions and adjustment controls.</span></>}</div>
    {savedAt&&<p className="studio-small studio-saved-note" role="status">Draft saved to this browser at {new Date(savedAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}. It is not synced to an account.</p>}
  </section>;
}
