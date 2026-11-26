import NextLink from "next/link";
import type {ComponentProps} from "react";
/** Disable viewport-wide speculative route requests. Actual navigation still
 * uses Next Link, and the bounded intent handler may warm public routes. */
export default function IntentLink(props:ComponentProps<typeof NextLink>){
 return <NextLink {...props} prefetch={false} data-intent-prefetch=""/>;
}
