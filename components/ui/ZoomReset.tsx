// components/ui/ZoomReset.tsx
"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ZoomReset() {
  const pathname = usePathname();

  useEffect(() => {
    (document.body.style as any).zoom = "100%";
  }, [pathname]);

  return null;
}
