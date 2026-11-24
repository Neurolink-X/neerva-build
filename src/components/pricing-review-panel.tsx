"use client";
import {SecureOperationsList} from "./secure-operations-list";
import {CatalogCampaignAdmin} from "./catalog-campaign-admin";
export function PricingReviewPanel(){return <><SecureOperationsList endpoint="/api/admin/pricing" title="Pricing review" description="Prices are never represented as verified selling rates until publication with effective dates, taxes and supply context is confirmed." arrays={[{key:"prices",label:"Price rules",fields:["variant_id","city","amount_paise","visibility","status","valid_from","valid_to"]}]}/><CatalogCampaignAdmin/></>}
