import { useState, useCallback } from "react";
import catalogueData from "../../data/catalogue.json";

export type CatalogueItem = {
  id: string;
  name: string;
  brand?: string;
  spec: string;
  unitPrice: number;
  lastUpdated?: string;
  source?: string;
  priceNote?: string;
};

export type CatalogueCategory = {
  label: string;
  icon: string;
  color: string;
  items: CatalogueItem[];
};

export type CatalogueData = {
  categories: Record<string, CatalogueCategory>;
  metadata: {
    lastFullUpdate: string;
    version: string;
    note: string;
  };
};

/**
 * Returns the bundled catalogue JSON directly — no network call needed.
 * The data is imported at build time from data/catalogue.json.
 */
export function useCatalogue() {
  const [catalogue] = useState<CatalogueData>(catalogueData as CatalogueData);

  // Helper: find a product by category + id
  const findProduct = useCallback(
    (category: string, productId: string) => {
      if (!catalogue?.categories?.[category]) return null;
      const cat = catalogue.categories[category];
      const item = cat.items.find((i) => i.id === productId);
      if (!item) return null;
      return {
        category,
        categoryLabel: cat.label,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        ...item,
      };
    },
    [catalogue]
  );

  // Helper: get all products across all categories
  const getAllProducts = useCallback(() => {
    if (!catalogue?.categories) return [];
    return Object.entries(catalogue.categories).flatMap(([categoryKey, cat]) =>
      cat.items.map((item) => ({
        category: categoryKey,
        categoryLabel: cat.label,
        categoryColor: cat.color,
        ...item,
      }))
    );
  }, [catalogue]);

  return {
    catalogue,
    loading: false,
    error: null,
    // refetch is a no-op on Vercel — data is bundled at build time
    refetch: () => {},
    findProduct,
    getAllProducts,
  };
}
