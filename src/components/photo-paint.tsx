"use client";
import { useEffect, useId, useRef, useState } from "react";
type Layer = { points: string; color: string };
export function PhotoPaint() {
  const [url, setUrl] = useState(""),
    [points, setPoints] = useState<string[]>([]),
    [layers, setLayers] = useState<Layer[]>([]),
    [color, setColor] = useState("#b5c5a4"),
    [split, setSplit] = useState(35),
    [message, setMessage] = useState("");
  const [size, setSize] = useState([1000, 700]);
  const stage = useRef<SVGSVGElement>(null),
    clip = useId();
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  const width = size[0],
    height = size[1];
  return (
    <section className="nb-photo">
      <h2>Try your house photo</h2>
      <p>
        Pick a photo, tap the corners of one wall, then apply its colour. Your
        photo stays on this device.
      </p>
      <label>
        House photo{" "}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (
              !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
              file.size > 8 * 1024 * 1024
            ) {
              setMessage("Choose a JPEG, PNG or WebP under 8 MB.");
              return;
            }
            setMessage("");
            setLayers([]);
            setPoints([]);
            setUrl(URL.createObjectUR¶»§q«^