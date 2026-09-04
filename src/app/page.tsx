import { Suspense } from "react";
import { Marketplace } from "@/components/marketplace/Marketplace";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Marketplace />
    </Suspense>
  );
}
