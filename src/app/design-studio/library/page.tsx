import type {Metadata} from "next";
import {StudioDesignGallery} from "@/components/studio-design-gallery";
import "./gallery.css";
export const metadata:Metadata={title:"24 Original Indian Home Concepts — Design Library",description:"Explore 24 original home planning concepts across six plot sizes, with plan previews, filters, comparison and print-friendly concepts.",alternates:{canonical:"/design-studio/library"}};
export default function DesignLibraryPage(){return <StudioDesignGallery/>}