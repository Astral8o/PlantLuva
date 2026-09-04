import { Suspense } from "react";
import { BasketPage } from "@/components/basket/BasketPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BasketPage />
    </Suspense>
  );
}
