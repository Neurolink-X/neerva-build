export function installedDisplayMode(modes:readonly boolean[],iosStandalone:boolean,androidReferrer:string):boolean{
 return modes.some(Boolean)||iosStandalone||androidReferrer.startsWith("android-app://");
}
