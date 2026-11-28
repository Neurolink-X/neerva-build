import type {Metadata} from "next";
import {StudioDesignGallery} from "@/components/studio-design-gallery";
import "./gallery.css";
export const metadata:Metadata={title:"Home Design Inspiration Archive",description:"Browse archival home-style concepts across six plot sizes. For 24 plot-specific validated draft room layouts, use the Road-First Portfolio generator.",alternates:{canonical:"/design-studio/library"}};
export default function DesignLibraryPage(){return <StudioDesignGallery/>}