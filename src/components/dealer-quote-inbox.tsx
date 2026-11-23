"use client";
import {SecureOperationsList} from "./secure-operations-list";
export function DealerQuoteInbox(){return <SecureOperationsList endpoint="/api/dealer/quotes" title="Dealer quote inbox" description="Only invitations for your approved dealer membership are visible. An accepted order is not inferred from an invitation." arrays={[{key:"invites",label:"Invitations",fields:["quote_request_id","status","invited_at"]},{key:"offers",label:"Submitted offers",fields:["quote_request_id","revision","total_paise","valid_until"]}]}/>}
