"use client";
import {PipeComparison} from "./pipe-comparison";
import {getProductsByCategory} from "@/modules/catalog/marketplace";
import {isPublicConstructionProduct} from "@/modules/catalog/discovery-policy";
export function PipeComparisonCategory({category}:{category:string}){return <PipeComparison products={getProductsByCategory(category).filter(isPublicConstructionProduct)}/>}
