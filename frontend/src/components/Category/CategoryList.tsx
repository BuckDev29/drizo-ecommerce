"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCategories } from "@/hooks/useCategories";
import Loading from "@/components/Loading";

export default function CategoryList() {
  const searchParams = useSearchParams();
  const initialGender =
    (searchParams.get("gender") as "men" | "women" | "unisex" | "") || "";
  const [activeGender, setActiveGender] = useState<
    "men" | "women" | "unisex" | ""
  >(initialGender);

  useEffect(() => {
    setActiveGender(initialGender);
  }, [initialGender]);

  const { categories, loading, error } = useCategories({
    gender: activeGender,
  });

  if (loading) return <Loading fullScreen />;

  if (error) {
    return (
      <div className="flex justify-center min-h-screen items-center text-[var(--color-text-secondary)]">
        Failed to load categories: {error}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex justify-center min-h-screen items-center text-[var(--color-text-secondary)] tracking-[0.1em] uppercase">
        No collections found.
      </div>
    );
  }

  const main = categories.find((cat) => cat.slug.includes("shop-all"));

  const grid = categories
    .filter((cat) => cat.id !== main?.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col w-full gap-1">
      {main && (
        <div
          className="relative overflow-hidden cursor-pointer h-[70vh] md:h-[88vh]"
          onClick={() =>
            (window.location.href = `/products?category=${main.slug}`)
          }
        >
          <img
            src={main.image_url}
            alt={main.name}
            className="w-full h-full object-cover block"
          />
          <div
            className="absolute inset-0 flex flex-col justify-end items-start p-6 md:p-10"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 50%)",
            }}
          >
            <h3 className="text-white font-light m-0 tracking-[0.0em] text-[2rem] md:text-[1.2rem] lowercase">
              {main.name}
            </h3>
          </div>
        </div>
      )}

      {/* Bottom Grid */}
      {grid.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
          {grid.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden cursor-pointer h-[50vh] md:h-[70vh]"
              onClick={() =>
                (window.location.href = `/products?category=${item.slug}`)
              }
            >
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover block"
              />
              <div
                className="absolute inset-0 flex flex-col justify-end items-start p-6"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 50%)",
                }}
              >
                <h3 className="text-white font-light m-0 tracking-[0.05em] text-[0.85rem] lowercase">
                  {item.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seasonal Static Banner */}
      <div className="relative overflow-hidden cursor-pointer h-[70vh] md:h-[88vh]">
        <img
          src={
            activeGender === "women"
              ? "https://images.squarespace-cdn.com/content/v1/60400f64d0a75b472cd25e34/dbec2aa7-8bda-4054-b367-035dde017c3f/4.jpg?format=2500w"
              : "https://i.shgcdn.com/b18b40db-d9a2-49d1-a8da-d4ec3e163f11/-/format/auto/-/preview/3000x3000/-/quality/lighter/"
          }
          alt="Seasonal Collection"
          className="w-full h-full object-cover block"
        />
        <div
          className="absolute inset-0 flex flex-col justify-end items-start p-6 md:p-10"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 50%)",
          }}
        ></div>
      </div>
    </div>
  );
}
