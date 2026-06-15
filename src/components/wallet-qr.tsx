"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Renders a QR code (as a PNG data URL) for a wallet to scan.
export function WalletQR({ value, size = 220 }: { value: string; size?: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#0d1626", light: "#ffffff" },
    })
      .then((url) => active && setSrc(url))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [value, size]);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Scan with your wallet" width={size} height={size} className="rounded-xl" />
  ) : (
    <div className="animate-pulse rounded-xl bg-surface-2" style={{ width: size, height: size }} />
  );
}
