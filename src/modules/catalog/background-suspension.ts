/** Keep brief app switches cheap, but release optional realtime work in prolonged background. */
export const BACKGROUND_GRACE_MS=15000;
export function createBackgroundSuspension(suspend:()=>void,isHidden:()=>boolean){
 let timer:ReturnType<typeof setTimeout>|undefined;
 function cancel(){clearTimeout(timer);timer=undefined}
 function schedule(){
  if(timer!==undefined)return;
  timer=setTimeout(()=>{timer=undefined;if(isHidden())suspend()},BACKGROUND_GRACE_MS);
 }
 return {schedule,cancel};
}
