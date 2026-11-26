/** Installed display modes only; a full-screen browser or external app referrer is not proof of installation. */
export function installedDisplayMode(modes:readonly boolean[],iosStandalone:boolean):boolean{
 return modes.some(Boolean)||iosStandalone;
}

/** Manual browser installation remains discoverable even without a native prompt. */
export function showInstallOffer(state:{ready:boolean;installed:boolean;dismissed:boolean;accepted:boolean;path:string|null}):boolean{
 const privateFlow=/^\/(?:install|account|admin|dealer|checkout|basket|quotes|orders|support|my-project)(?:\/|$)/.test(state.path??"");
 return state.ready&&!state.installed&&!state.dismissed&&!state.accepted&&!privateFlow;
}
