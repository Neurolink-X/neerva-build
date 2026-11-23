/** Default disabled. Enables real RFQ collection only after operational readiness
 * (approved dealer coverage, support channel and legal/privacy signoff).
 */
export function rfqIntakeEnabled(env:{NEERVA_RFQ_INTAKE_ENABLED?:string}):boolean{
 return env.NEERVA_RFQ_INTAKE_ENABLED==="true";
}
