import {z} from "zod";
import {isMaterialCategory} from "../catalog/category-units.ts";
const uuid=z.string().uuid();
export const productProposal=z.object({branchId:uuid,category:z.string().refine(isMaterialCategory),productName:z.string().trim().min(2).max(160),brandName:z.string().trim().min(1).max(100),modelDetails:z.string().trim().min(5).max(400),sourceUrl:z.string().url().max(500).refine(x=>x.startsWith("https://")).optional()}).strict();
export const proposalReview=z.object({id:uuid,status:z.enum(["accepted","rejected"]),note:z.string().trim().min(3).max(300)}).strict();
export const listingControl=z.object({branchId:uuid,variantId:uuid,active:z.boolean()}).strict();
export const PROPOSAL_FIELDS="id,tenant_id,branch_id,category_slug,product_name,brand_name,model_details,source_url,status,review_note,created_at";
