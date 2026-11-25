
import {parseLab,type RoomLab} from "./room-lab.ts";
export type RoomSnapshot={id:string;name:string;room:RoomLab};
export const snapshotKey="neerva-room-snapshots-v1";
export const maxSnapshots=4;
export function readSnapshots(raw:string|null):RoomSnapshot[]{try{if(!raw||raw.length>24000)return [];const arr:unknown=JSON.parse(raw);if(!Array.isArray(arr))return [];const result:RoomSnapshot[]=[];for(const item of arr.slice(0,maxSnapshots)){if(!item||typeof item.id!=="string"||!(/^[a-z0-9-]{1,40}$/).test(item.id)||result.some(x=>x.id===item.id)||typeof item.name!=="string"||!item.name.trim()||!item.room||typeof item.room!=="object")continue;result.push({id:item.id,name:item.name.trim().slice(0,40),room:parseLab(item.room)})}return result}catch{return []}}

/** Versioned portable format, never replaces existing layouts without explicit user action. */
export function parseRoomExport(raw:string):RoomSnapshot[]|null{
 try{if(raw.length>26000)return null;const data:unknown=JSON.parse(raw);if(!data||typeof data!=="object")return null;const v=data as {format?:unknown;version?:unknown;rooms?:unknown};if(v.format!=="neerva-room-alternatives"||v.version!==1||!Array.isArray(v.rooms)||v.rooms.length>maxSnapshots)return null;const items=readSnapshots(JSON.stringify(v.rooms));return items.length===v.rooms.length?items:null}catch{return null}
}
