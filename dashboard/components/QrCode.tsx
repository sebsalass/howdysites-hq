"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

// QR pointing at a demo URL — for print (door hangers, postcards), in-person pitches,
// and texting a scannable image. Brand colors: pine ink on paper cream.
export default function QrCode({ url, filename }: { url: string; filename: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 480,
      margin: 2,
      color: { dark: "#1E3226", light: "#FAF6EB" },
    }).then(setSrc);
  }, [url]);

  if (!src) return null;
  return (
    <div className="flex items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`QR code for ${url}`} className="h-32 w-32 rounded border border-[#283042]" />
      <div className="space-y-2 text-xs text-slate-400">
        <p>Scans to the demo site. Use it on a printed one-pager, a door hanger, or text the image straight to the owner.</p>
        <a href={src} download={filename} className="btn inline-block">
          Download QR (PNG)
        </a>
      </div>
    </div>
  );
}
