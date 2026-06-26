import { useState, useEffect, useCallback } from "react";

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
 * Hook to fetch and manage the dynamic catalogue from the API.
 * Falls back to an empty structure if the API is unavailable.
 */
export function useCatalogue() {
  const [catalogue, setCatalogue] = useState<CatalogueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalogue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/catalogue");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setCatalogue(data);
    } catch (err) {
      console.error("[useCatalogue] Fetch failed:", err);
      setError(err instanceof Error ? err.message : String(err));
      setCatalogue(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogue();
  }, [fetchCatalogue]);

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
    loading,
    error,
    refetch: fetchCatalogue,
    findProduct,
    getAllProducts,
  };
}
