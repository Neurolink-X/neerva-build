"use client";
import {SecureOperationsList} from "./secure-operations-list";
export function UserAccessPanel(){return <SecureOperationsList endpoint="/api/admin/users" title="Account and roles" description="Read-only role audit. Access changes must use a reviewed transaction and append-only audit logs." arrays={[{key:"users",label:"Account profiles",fields:["display_name","preferred_locale","created_at"]},{key:"roles",label:"Role grants",fields:["user_id","role","granted_at"]}]}/>}
