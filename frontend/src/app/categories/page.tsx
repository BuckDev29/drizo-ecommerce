import { Suspense } from "react";
import CategoryList from "@/components/Category/CategoryList";

export const metadata = {
  title: "Categories | Drizo",
  description: "Explore our latest streetwear collections.",
};

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={null}>
        <CategoryList />
      </Suspense>
    </main>
  );
}
