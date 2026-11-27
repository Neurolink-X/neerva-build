"use client";
import {useState} from "react";
import Link from "./intent-link";
import {familyBudget} from "@/modules/home/family-budget";
import {projectKey,readProject,parseProject} from "@/modules/home/project-planner";
const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
export function FamilyBudgetPlanner({lang}:{lang:"en"|"hi"}){
 const t=(en:string,hi:string)=>lang==="hi"?hi:en;
 const [values,setValues]=useState({builtArea:"",rate:"",extras:"0",reservePercent:"10",budget:""});
 const [notice,setNotice]=useState("");
 const result=familyBudget({builtArea:Number(values.builtArea),rate:Number(values.rate),extras:Number(values.extras),reservePercent:values.reservePercent.trim()?Number(values.reservePercent):NaN,budget:Number(values.budget)});
 const update=(key:keyof typeof values,value:string)=>{setValues(v=>({...v,[key]:value}));setNotice("")};
 function save(){if(!result)return;try{
  const current=readProject(localStorage.getItem(projectKey)),budget=Number(values.budget)||result.total;
  if(current.budget&&current.budget!==budget&&!window.confirm(t("Replace the budget in your existing project planner? Your spending and checklist will be kept.","मौजूदा योजना का बजट बदलें? खर्च और चेकलिस्ट सुरक्षित रहेंगे।")))return;
  localStorage.setItem(projectKey,JSON.stringify(parseProject({...current,budget})));
  setNotice(t("Budget saved on this device. Your existing checklist and spending are unchanged.","बजट इस डिवाइस पर सुरक्षित है। पुरानी चेकलिस्ट और खर्च नहीं बदले हैं।"));
 }catch{setNotice(t("Budget could not be saved. You can still use the estimate.","बजट सुरक्षित नहीं हुआ। अनुमान अभी भी देख सकते हैं।"))}}
 return <section id="family-budget" className="family-budget" aria-labelledby="family-budget-title">
 <div><p className="nbh-eyebrow">{t("PLAN BEFORE YOU SPEND","खर्च से पहले योजना")}</p><h2 id="family-budget-title">{t("What can your budget cover?","आपके बजट में कितना निर्माण हो सकता है?")}</h2><p>{t("Use your contractor's written rate and the total planned built-up area of all floors, not the plot area. No assumed market price.","ठेकेदार की लिखित दर और सभी मंजिलों का कुल निर्मित क्षेत्र भरें, प्लॉट का क्षेत्र नहीं। कोई अनुमानित बाजार दर नहीं लगाई गई है।")}</p></div>
 <div className="family-budget-grid"><div className="family-budget-fields">
 {([["builtArea","Total built-up area (sq ft)","कुल निर्मित क्षेत्र (वर्ग फुट)",1,150000],["rate","Agreed construction rate (₹/sq ft)","निर्माण दर (₹/वर्ग फुट)",1,100000],["extras","Other costs not included (₹)","अन्य खर्च (₹)",0,1000000000],["reservePercent","Contingency (%)","अतिरिक्त खर्च हेतु राशि (%)",0,50],["budget","Available construction budget (₹, optional)","उपलब्ध निर्माण बजट (₹, वैकल्पिक)",0,1000000000]] as const).map(([key,en,hi,min,max])=><label key={key}>{t(en,hi)}<input type="number" inputMode="decimal" min={min} max={max} step="any" value={values[key]} placeholder={key==="builtArea"?"800":key==="rate"?t("Enter your rate","अपनी दर भरें"):undefined} onChange={e=>update(key,e.target.value)}/></label>)}
 <small>{t("Include approvals, professional fees, connections and other items only if excluded from your quoted rate. Land and finance costs are separate unless entered above.","अनुमति, विशेषज्ञ शुल्क और कनेक्शन का खर्च तभी जोड़ें जब वह दर में शामिल न हो। जमीन और ब्याज का खर्च अलग है।")}</small>
 </div><div className="family-budget-result" aria-live="polite"><h3>{t("Your planning estimate","आपका बजट अनुमान")}</h3>{result?<><dl><div><dt>{t("Construction","निर्माण")}</dt><dd>{money(result.construction)}</dd></div><div><dt>{t("Other costs","अन्य खर्च")}</dt><dd>{money(result.extras)}</dd></div><div><dt>{t("Contingency","अतिरिक्त राशि")}</dt><dd>{money(result.reserve)}</dd></div><div className="family-budget-total"><dt>{t("Total estimate","कुल अनुमान")}</dt><dd>{money(result.total)}</dd></div>{result.balance!==null&&<div><dt>{result.balance<0?t("Budget shortfall","बजट में कमी"):t("Budget remaining","शेष बजट")}</dt><dd>{money(Math.abs(result.balance))}</dd></div>}</dl><button type="button" className="button button-dark" onClick={save}>{t("Save budget to my project","मेरी योजना में बजट सुरक्षित करें")}</button><Link href="/my-project" prefetch={false}>{t("Open my project planner →","मेरी निर्माण योजना खोलें →")}</Link></>:<p>{t("Enter valid area, rate and other costs to see your estimate.","अनुमान के लिए सही क्षेत्रफल, दर और खर्च भरें।")}</p>}<p role="status">{notice}</p><small>{t("Planning estimate only, not a supplier quotation or construction guarantee.","यह केवल योजना का अनुमान है, कोटेशन या निर्माण की गारंटी नहीं।")}</small></div></div></section>
}
