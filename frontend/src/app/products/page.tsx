import { Suspense } from "react";
import ProductList from "@/components/Product/ProductList";

export const metadata = {
  title: "Products | Drizo",
  description: "Browse the latest products in our collection.",
};

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={null}>
        <ProductList />
      </Suspense>
    </main>
  );
}
