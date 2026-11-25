import {z} from "zod";
/** Shared request validation for saved concepts and matching room reports. */
export const planBriefSchema=z.object({
 widthFt:z.number().finite().min(10).max(200),depthFt:z.number().finite().min(15).max(250),
 roadSide:z.enum(["N","E","S","W"]),floors:z.union([z.literal(1),z.literal(2),z.literal(3)]),
 bedrooms:z.number().int().min(1).max(3),parking:z.boolean(),
 siteShape:z.discriminatedUnion("kind",[
  z.object({kind:z.literal("rectangle")}).strict(),
  z.object({kind:z.literal("rear-left-notch"),notchWidthFt:z.number().finite().min(1).max(112.5),notchDepthFt:z.number().finite().min(1).max(112.5)}).strict(),
  z.object({kind:z.literal("rear-right-notch"),notchWidthFt:z.number().finite().min(1).max(112.5),notchDepthFt:z.number().finite().min(1).max(112.5)}).strict()
 ]).optional(),
 setbacks:z.object({frontFt:z.number().finite().min(0).max(30),rearFt:z.number().finite().min(0).max(30),
  leftFt:z.number().finite().min(0).max(30),rightFt:z.number().finite().min(0).max(30)}).strict()
}).strict();
