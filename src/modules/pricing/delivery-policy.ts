import {z} from "zod";
const money=z.number().int().min(0).max(5000000000);
export const deliveryInput=z.object({branchId:z.string().uuid(),pincode:z.string().regex(/^[1-9][0-9]{5}$/),freightPaise:money,unloadingPaise:money,minimumMaterialPaise:money,leadDays:z.number().int().min(0).max(90),acceptingOrders:z.boolean()}).strict();
export const deliveryReview=z.object({id:z.number().int().positive().safe(),status:z.enum(["approved","rejected"])}).strict();
export const skuTaxInput=z.object({variantId:z.string().uuid(),hsn:z.string().regex(/^[0-9]{4,8}$/),rateBps:z.number().int().min(0).max(10000),priceIncludesTax:z.boolean(),reason:z.string().trim().min(3).max(300)}).strict();
export const DELIVERY_FIELDS="id,branch_id,tenant_id,pincode,freight_paise,unloading_paise,minimum_material_paise,lead_days,accepting_orders,status,created_at";
