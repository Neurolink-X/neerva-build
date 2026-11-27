import {facadeShade} from "@/modules/studio/core/elevation-appearance";
export function ElevationDefs({id,wall,accent,glass}:{id:string;wall:string;accent:string;glass:string}){
 return <defs>
  <linearGradient id={id+"sky"} x1="0%" y1="0%" x2="0%" y2="100%"><stop stopColor="#c8dce6"/><stop offset=".7" stopColor="#eaf0ed"/><stop offset="1" stopColor="#f7f4e9"/></linearGradient>
  <linearGradient id={id+"wall"} x1="0%" y1="0%" x2="100%" y2="100%"><stop stopColor={facadeShade(wall,1.10)}/><stop offset=".42" stopColor={wall}/><stop offset="1" stopColor={facadeShade(wall,.81)}/></linearGradient>
  <linearGradient id={id+"accent"} x1="0%" y1="0%" x2="0%" y2="100%"><stop stopColor={facadeShade(accent,1.15)}/><stop offset=".72" stopColor={accent}/><stop offset="1" stopColor={facadeShade(accent,.69)}/></linearGradient>
  <linearGradient id={id+"glass"} x1="0%" y1="0%" x2="85%" y2="100%"><stop stopColor={facadeShade(glass,1.32)}/><stop offset=".32" stopColor={glass}/><stop offset=".36" stopColor={facadeShade(glass,1.13)}/><stop offset=".70" stopColor={facadeShade(glass,.72)}/><stop offset="1" stopColor={facadeShade(glass,.46)}/></linearGradient>
  <linearGradient id={id+"ground"} x1="0%" y1="0%" x2="0%" y2="100%"><stop stopColor="#dad8cc"/><stop offset="1" stopColor="#929a96"/></linearGradient>
 </defs>;
}
