import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {notFound} from "next/navigation";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {PublishedMaterials} from "@/components/published-materials";
import {BrandMark} from "@/components/brand-mark";
import {catalogCategories} from "@/modules/catalog/catalog";
import {getCategory,getProductsByCategory} from "@/modules/catalog/marketplace";
import {brandSlug,directoryCards,categoryCover,buyingDetails,brandPath,dealerPath} from "@/modules/catalog/brand-pages";
import {groupCatalogByPhoto,rangeVariantLabel} from "@/modules/catalog/media-usage";
import {canonicalPublicOrigin} from "@/modules/seo/site-origin";
import "../../brands.css";

type Params={category:string;brand:string};
type Props={params:Promise<Params>};
export const dynamicParams=false;
export function generateStaticParams():Params[]{
  return catalogCategories.flatMap(c=>[...directoryCards(c.slug).map(b=>({category:c.slug,brand:brandSlug(b.name)})),{category:c.slug,brand:"dealer-listings"}]);
}
function selection({category,brand}:Params){
  const material=getCategory(category);
  if(!material)notFound();
  const dealer=brand==="dealer-listings";
  const card=dealer?undefined:directoryCards(category).find(b=>brandSlug(b.name)===brand);
  if(!dealer&&!card)notFound();
  const title=card?`${card.name} · ${material.title}`:`${material.title} dealer listings`;
  const image=card?.image??card?.rangeImage??categoryCover(category);
  const path=card?brandPath(category,card.name):dealerPath(category);
  const products=card?getProductsByCategory(category).filter(p=>p.brand===card.name):[];
  const description=card?`${title}. ${products.length?"Explore "+products.map(p=>p.name).slice(0,2).join(" and ")+".":"Prepare a brand-specific enquiry."} Review specifications and request local pricing.`:`Browse published ${material.title.toLowerCase()} variants by SKU and unit. Prepare a dealer enquiry with your quantity and delivery pincode.`;
  return {material,card,title,image,path,products,description};
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {title,description,path,image,card}=selection(await params);
  const images=image?[image]:[];
  return {title,description,alternates:{canonical:path},openGraph:{title,description,url:path,images},twitter:{card:"summary_large_image",title,description,images},
    ...(!card?.count?{robots:{index:false,follow:true}}:{})};
}
export default async function BrandSelection({params}:Props){
  const {material,card,title,path,image,products}=selection(await params);
  const quote="/quotes?"+new URLSearchParams({category:material.slug,material:[card?.name,material.title].filter(Boolean).join(" ")});
  const origin=canonicalPublicOrigin(process.env);
  const breadcrumb={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[["Home","/"],["Brands","/brands"],[title,path]].map(([name,href],i)=>({"@type":"ListItem",position:i+1,name,item:origin+href}))};
  return <main className="catalog-page"><SiteHeader/><div className="br-wrap">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumb).replace(/</g,"\\u003c")}}/>
    <nav className="br-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> / <Link href="/brands">Brands</Link> / <span>{title}</span></nav>
    <header className="br-hero"><div>{card&&<BrandMark name={card.name}/>}<h1>{title}</h1><p>{buyingDetails[material.slug]}</p><div className="br-hero-actions"><Link className="br-card-action" href={quote}>Request a {card?card.name+" ":""}quote →</Link><Link className="br-quote-action" href={card?dealerPath(material.slug):`/materials/${material.slug}`}>{card?"Browse dealer listings":"Compare material specifications"}</Link></div><p className="br-stock-note">Local price, stock and delivery subject to dealer confirmation.</p></div>
    {image&&<div className={"br-cover"+(card?.image||card?.rangeImage?" br-product":"")}><Image src={image} fill priority sizes="(max-width:620px) 95vw, 45vw" unoptimized={image.startsWith("https://")} referrerPolicy="no-referrer" alt={card?.image?card.alt:card?.rangeImage?card.rangeAlt:material.title+" category example"}/><span className="br-photo-label">{card?.image?"Product reference":card?.rangeImage?"Brand range photograph":"Representative material photo · not brand packaging"}</span></div>}</header>{card?.rangeSource&&<p className="br-source"><a href={card.rangeSource} target="_blank" rel="noopener noreferrer">Range image source ↗</a></p>}
    {card?<section className="br-group"><div className="br-heading"><h2>{products.length?"Product ranges":"Request a local quotation"}</h2><Link href={dealerPath(material.slug)}>Check dealer-listed options →</Link></div>
    {products.length?<div className="br-grid">{groupCatalogByPhoto(products).map(({primary:p,variants})=><article className="br-card" key={p.slug}>
      {p.referenceImage&&<div className="br-pack"><Image src={p.referenceImage} fill sizes="(max-width:620px) 45vw, 235px" alt={p.name}/></div>}
      <div className="br-card-copy"><h3><Link href={`/materials/${material.slug}/${p.slug}`}>{variants.length>1?p.specifications.find(s=>s.label==="Product family")?.value??p.name:p.name}</Link></h3>
      {p.specifications.slice(0,3).map(s=><p key={s.label}><b>{s.label}</b> {s.value}</p>)}
      {variants.length>1?<div className="catalog-variant-links">{variants.map(v=><Link key={v.slug} href={`/materials/${material.slug}/${v.slug}`}>{rangeVariantLabel(v)}</Link>)}</div>:<Link href={`/materials/${material.slug}/${p.slug}`}>Specifications and pricing →</Link>}</div></article>)}</div>:
    <p>We have no catalogued {card.name} product in this category yet. Include the grade, quantity and pincode in your enquiry so a dealer can confirm the exact item and delivery charges.</p>}</section>
    :<section className="br-group"><h2>Published products and variants</h2><p>Choose a listed SKU to carry its name and unit into your enquiry.</p><PublishedMaterials category={material.slug} initiallyOpen/></section>}
    <section className="br-group br-buying-guide"><h2>Before you order</h2><p>{buyingDetails[material.slug]}</p><div className="br-steps"><div><strong>01 · Choose specifications</strong><p>Check the exact product, grade, dimensions and unit.</p></div><div><strong>02 · Share site details</strong><p>Provide your quantity and delivery pincode for an itemized quote.</p></div><div><strong>03 · Confirm final cost</strong><p>Review stock, GST, freight, unloading and delivery schedule before accepting.</p></div></div><Link className="br-card-action" href={quote}>Prepare an itemized quote →</Link></section><Link className="text-link" href={`/materials/${material.slug}`}>Compare all {material.title.toLowerCase()} →</Link>
  </div><SiteFooter/></main>;
}
