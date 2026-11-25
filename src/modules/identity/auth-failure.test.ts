import test from "node:test";
import assert from "node:assert/strict";
import {authFailureStatus} from "./auth-failure.ts";
test("invalid sessions are distinct from upstream outages, throttling and unknown errors",()=>{
 for(const error of [{status:401},{status:403},{status:400,code:"bad_jwt"},{name:"AuthSessionMissingError"}])assert.equal(authFailureStatus(error),401);
 for(const error of [{status:503},{status:429},{name:"AuthRetryableFetchError",status:0},{status:400},null,new Error("network")])assert.equal(authFailureStatus(error),503);
});
