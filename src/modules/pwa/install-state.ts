/** Installed display modes only; a full-screen browser or external app referrer is not proof of installation. */
export function installedDisplayMode(modes:readonly boolean[],iosStandalone:boolean):boolean{
 return modes.some(Boolean)||iosStandalone;
}

export const INSTALL_OFFER_DELAY_MS=6000;
/** Promote only on the homepage, with a real browser install event. Manual help stays in navigation. */
export function showInstallOffer(state:{ready:boolean;installed:boolean;dismissed:boolean;accepted:boolean;path:string|null;available:boolean}):boolean{
 return state.ready&&state.available&&!state.installed&&!state.dismissed&&!state.accepted&&state.path==="/";
}

export type InstallPlatform="ios"|"android"|"desktop";
export type InstallBrowser="embedded"|"safari"|"firefox"|"edge"|"samsung"|"chromium"|"other";
/** UA hints are for instructions only, never proof of installability. */
export function installEnvironment(ua:string,platform:string,touches:number):{platform:InstallPlatform;browser:InstallBrowser}{
 const device=/iPad|iPhone|iPod/i.test(ua)||platform==="MacIntel"&&touches>1?"ios":/Android/i.test(ua)?"android":"desktop";
 const embedded=/\bwv\b|FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok|GSA\/|Snapchat/i.test(ua)||device==="android"&&/Version\/4\.0.*Chrome\//i.test(ua);
 const browser=embedded?"embedded":/Edg(?:A|iOS)?\//i.test(ua)?"edge":/SamsungBrowser\//i.test(ua)?"samsung":/Firefox\/|FxiOS\//i.test(ua)?"firefox":/Chrome\/|CriOS\/|Chromium\/|OPR\//i.test(ua)?"chromium":/Safari\//i.test(ua)?"safari":"other";
 return {platform:device,browser};
}
export function installAction(state:{ready:boolean;runningStandalone:boolean;installed:boolean;available:boolean}):"hidden"|"help"|"native"|"guide"{
 if(!state.ready||state.runningStandalone)return "hidden";
 if(state.available)return "native";
 return state.installed?"help":"guide";
}
export function installationGuide(platform:InstallPlatform,browser:InstallBrowser){
 if(browser==="embedded")return {title:"Open in your browser",steps:["Use this app’s menu or share option to open Neerva in your regular browser.","If that option is missing, copy the Neerva link and paste it into Chrome, Safari or another installed browser.","Use the installation option in that browser’s menu."],note:"Embedded browsers may not expose home-screen installation. Continue using the website if installation is unavailable."};
 if(platform==="ios")return {title:"iPhone / iPad",steps:["Open Neerva in Safari or another browser that supports adding web apps.","Open Share and choose Add to Home Screen.","If shown, enable Open as Web App and confirm Add."],note:"Older iOS versions may require Safari. Direct website-triggered installation is not available."};
 if(platform==="android")return {title:browser==="firefox"?"Android · Firefox":browser==="samsung"?"Android · Samsung Internet":"Android · browser menu",steps:["Open the browser menu (⋮ or ☰).","Choose Install, Add page to, or Add to Home screen if offered.","Confirm the installation or home-screen shortcut."],note:"Menu wording and full app support vary by browser. If no option is available, open the link in Chrome or Samsung Internet."};
 if(browser==="safari")return {title:"Mac · Safari",steps:["Open the File menu.","Choose Add to Dock if available.","Confirm Add."],note:"Older macOS versions may not offer web app installation; use a bookmark instead."};
 return {title:"Computer · browser menu",steps:["Look for an install icon in the address bar or an Apps / Install option in the browser menu.","Confirm if the browser offers installation.","Otherwise bookmark Neerva for quick access."],note:"Not every desktop browser provides native web app installation."};
}
