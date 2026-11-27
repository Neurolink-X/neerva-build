/** Event-driven rendering: coalesce events, suspend hidden work, and cancel before disposal. */
export type FrameHost={request:(draw:()=>void)=>number;cancel:(id:number)=>void;hidden:()=>boolean};
export function createFrameScheduler(draw:()=>void,host:FrameHost){
 let frame:number|null=null,disposed=false;
 function cancel(){if(frame!==null){host.cancel(frame);frame=null;}}
 function schedule(){if(disposed||frame!==null||host.hidden())return;frame=host.request(()=>{frame=null;if(!disposed&&!host.hidden())draw();});}
 function visibility(){if(host.hidden())cancel();else schedule();}
 function dispose(){disposed=true;cancel();}
 return {schedule,visibility,dispose};
}
export function browserFrameScheduler(draw:()=>void){
 return createFrameScheduler(draw,{request:cb=>window.requestAnimationFrame(cb),cancel:id=>window.cancelAnimationFrame(id),hidden:()=>document.hidden});
}
