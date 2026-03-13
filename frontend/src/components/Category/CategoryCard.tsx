import Link from "next/link";
import { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/categories/${category.slug}`} className="block relative overflow-hidden bg-black aspect-[3/4]">
      <img
        src={category.image_url}
        alt={category.name}
        className="object-cover w-full h-full opacity-90"
      />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-6 w-full">
        <h3 className="text-white text-2xl font-bold uppercase tracking-widest mb-1 lowercase">
          {category.name}
        </h3>
      </div>
    </Link>
  );
}
