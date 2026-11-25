/** Distinguish invalid credentials from dependency failures; neither authorizes access. */
export function authFailureStatus(error:unknown):401|503{
 if(!error||typeof error!=="object")return 503;
 const e=error as {status?:unknown;code?:unknown;name?:unknown};
 if(e.name==="AuthRetryableFetchError"||e.status===429||(typeof e.status==="number"&&e.status>=500))return 503;
 if(e.status===401||e.status===403||e.name==="AuthSessionMissingError"||
  ["bad_jwt","session_expired","session_not_found","user_not_found","invalid_jwt"].includes(String(e.code)))return 401;
 return 503;
}
