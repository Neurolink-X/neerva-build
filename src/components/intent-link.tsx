import NextLink from "next/link";
import type {ComponentProps} from "react";
/** Disable viewport-wide speculative route requests. Actual navigation still
 * uses Next Link, and the bounded intent handler may warm public routes. */
type Props=ComponentProps<typeof NextLink>&{"data-intent-prefetch"?:string};
export default function IntentLink(props:Props){
 // Existing explicit opt-outs stay opted out; explicitly marked links retain intent warming.
 const intent=props["data-intent-prefetch"]??(props.prefetch===false?undefined:"");
 return <NextLink {...props} prefetch={false} data-intent-prefetch={intent}/>;
}
