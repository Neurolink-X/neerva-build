/* Capture the browser-owned event before React hydration. No automatic prompts. */
(function(){
 if(window.__neervaReleasePrompt)return;
 function capture(event){
  if(typeof event.prompt!=="function"||!event.userChoice)return;
  event.preventDefault();
  window.__neervaInstallPrompt=event;
 }
 function installed(){delete window.__neervaInstallPrompt;}
 window.addEventListener("beforeinstallprompt",capture);
 window.addEventListener("appinstalled",installed);
 window.__neervaReleasePrompt=function(){
  window.removeEventListener("beforeinstallprompt",capture);
  window.removeEventListener("appinstalled",installed);
 };
})();
