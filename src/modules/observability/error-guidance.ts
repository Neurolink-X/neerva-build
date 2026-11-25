type Guidance={title:string;message:string;hi:string};
export function httpGuidance(status:number,method="GET"):Guidance{
 const write=!["GET","HEAD"].includes(method.toUpperCase());
 const verify=write?" Check the current order, payment or saved record before submitting again.":" Try again in a moment.";
 const hi=write?" दोबारा भेजने से पहले ऑर्डर, भुगतान या रिकॉर्ड की स्थिति जांचें।":" थोड़ी देर बाद फिर कोशिश करें।";
 if(status===0)return {title:"Connection interrupted",message:"We could not reach or verify the service. Check your connection."+verify,hi:"सेवा से संपर्क नहीं हो पाया। इंटरनेट जांचें।"+hi};
 if(status===401)return {title:"Sign in required",message:"Your session could not be verified. Sign in again through Neerva."+ (write?verify:""),hi:"अपना खाता फिर से सत्यापित करें।"+(write?hi:"")};
 if(status===403)return {title:"Access restricted",message:"This action is not permitted for your account. Contact support if you believe access is incorrect.",hi:"आपके खाते को इस काम की अनुमति नहीं है।"};
 if(status===404)return {title:"Not found",message:"This page or record is no longer available, or you cannot access it. Return to the relevant list.",hi:"यह पेज या रिकॉर्ड उपलब्ध नहीं है। सूची पर वापस जाएं।"};
 if(status===409)return {title:"Information has changed",message:"Refresh the current record before continuing."+ (write?verify:""),hi:"जानकारी बदल गई है। पहले नया रिकॉर्ड देखें।"};
 if(status===429)return {title:"Too many requests",message:"Please wait before trying again. Repeated requests may delay access."+ (write?verify:""),hi:"बहुत अधिक अनुरोध हैं। थोड़ी देर रुकें।"+(write?hi:"")};
 if(status===402)return {title:"Service or access unavailable",message:"This service or access could not be confirmed. Do not make another payment until the current status is verified.",hi:"सेवा या भुगतान की स्थिति जांचे बिना दोबारा भुगतान न करें।"};
 if(status===408||status===504)return {title:"Service taking longer than expected",message:"The request could not be confirmed in time."+verify,hi:"सेवा से समय पर जवाब नहीं मिला।"+hi};
 if(status>=500)return {title:"Temporary service problem",message:"We cannot confirm the service response right now."+verify,hi:"सेवा में अस्थायी समस्या है।"+hi};
 return {title:"Request could not be completed",message:"Check the entered information and try again only when safe."+ (write?verify:""),hi:"दी गई जानकारी जांचें।"+(write?hi:"")};
}
export function safeReference(value:unknown){return typeof value==="string"&&/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9]{1,20})$/i.test(value)?value:null}
export function failureMessage(status:number,method:string,body:unknown){
 const data=body&&typeof body==="object"?body as Record<string,unknown>:{};
 const g=httpGuidance(status,method);
 // Preserve existing actionable validation/conflict messages; never display upstream 5xx details.
 const detail=[400,409,415,422].includes(status)&&typeof data.error==="string"&&data.error.length<=240&&!/[\r\n<>]/.test(data.error)?data.error+" ":"";
 const reference=safeReference(data.reference);
 return detail+g.message+(reference?" Reference: "+reference:"");
}
export function incidentAdvice(code:string,module:string){
 const transaction=["payments","customer","dealer","orders","rfq"].includes(module);
 const safety=transaction?"Verify the stored transaction and idempotency record before any retry; never create a duplicate or bypass permissions.":"Reproduce with a read-only request; keep permissions and release checks enabled.";
 if(code==="RFQ_CAPTCHA_REJECTED")return {cause:"Security verification rejected the request; this is not proof of an outage.",checks:["Check rejection patterns and legitimate-user reports.","Keep bot protection enabled."],safety};
 if(code==="RFQ_CAPTCHA_PROVIDER_FAILED"||code==="RFQ_RATE_LIMIT_UNAVAILABLE")return {cause:"The security provider or protection configuration may be unavailable.",checks:["Check provider availability, configuration and quota in the protected dashboard.","Verify a legitimate test submission in staging after recovery."],safety};
 if(code==="RFQ_PERSISTENCE_FAILED"||code==="RFQ_IDEMPOTENCY_LOOKUP_FAILED")return {cause:"A database write or lookup could not be confirmed.",checks:["Check database availability, RPC errors and transaction logs at the recorded time.","Reconcile the existing request before deciding whether to retry."],safety};
 if(code==="NETWORK_FAILURE")return {cause:"Connection, DNS, TLS or an upstream timeout may have interrupted the request; the signal does not identify which.",checks:["Compare another network and browser; check certificate and DNS from a trusted dashboard.","Inspect Vercel and database service health."],safety};
 if(code==="AUTH_SERVICE_FAILURE")return {cause:"Authentication provider or session verification may be unavailable.",checks:["Check auth provider health and server logs.","Verify a permitted test account; do not weaken RLS or authentication."],safety};
 if(code==="UI_EXCEPTION")return {cause:"An unexpected interface failure was observed.",checks:["Reproduce the page on the recorded release and device.","Inspect sanitized runtime logs and verify recent changes with regression tests."],safety};
 if(code==="API_5XX")return {cause:"A backend or dependency response was unsuccessful; database, configuration, quota or deployment errors are possible, not confirmed.",checks:["Check the relevant API and deployment logs at the recorded time.","Inspect database health, recent migrations, permissions and upstream timeouts before making a fix."],safety};
 return {cause:"Cause not classified; investigate the recorded signal.",checks:["Check the recorded module, timestamp and reference in trusted service logs.","Reproduce safely and verify recovery before marking resolved."],safety};
}
