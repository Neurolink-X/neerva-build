"use client";
import {StudioPhotoPaint} from "@/components/studio-photo-paint";
export function PhotoPaint({colour="#efe6d6"}:{colour?:string}){return <div className="neerva-studio-photo"><StudioPhotoPaint colour={colour}/></div>}
export default PhotoPaint;
