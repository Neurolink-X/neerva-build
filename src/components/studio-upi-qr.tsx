"use client";
import {upiQrSvgPath,UPI_QR_SIZE} from "@/modules/studio/upi-qr";
export function StudioUpiQr({uri,amount}:{uri:string;amount:string}){
 const path=upiQrSvgPath(uri);
 return <svg width="220" height="220" viewBox={`-4 -4 ${UPI_QR_SIZE+8} ${UPI_QR_SIZE+8}`}
  preserveAspectRatio="xMidYMid meet" role="img"
  aria-label={`Self-hosted UPI QR for ${amount}; verify beneficiary in your payment app`}
  style={{width:"min(100%,220px)",height:"auto",background:"#fff",shapeRendering:"crispEdges"}}>
  <rect x="-4" y="-4" width={UPI_QR_SIZE+8} height={UPI_QR_SIZE+8} fill="#fff"/>
  <path d={path} fill="#111"/>
 </svg>;
}
