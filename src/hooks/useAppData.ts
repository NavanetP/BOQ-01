import { useState, useEffect, useCallback } from "react";

export type CpuOption = {
  id: string;
  label: string;
  priceAdder: number;
};

export type ComponentOption = {
  id: string;
  label: string;
  priceAdder: number;
};

export type ServerOptionsData = {
  cpuOptions: { intel: CpuOption[]; amd: CpuOption[] };
  ramOptions: ComponentOption[];
  storageOptions: ComponentOption[];
  nicOptions: ComponentOption[];
  gpuOptions: ComponentOption[];
  osOptions: ComponentOption[];
  supportOptions: ComponentOption[];
  psuOptions: ComponentOption[];
};

export type ServerModel = {
  id: string;
  name: string;
  formFactor: string;
  basePrice: number;
  tier: string;
};

export type ServerSeries = {
  models: ServerModel[];
};

export type ServerBrand = {
  label: string;
  logo: string;
  color: string;
  series: Record<string, ServerSeries>;
};

export type ServerBrandsData = Record<string, ServerBrand>;

export type SegmentRec = {
  rationale: string;
  servers: Record<string, unknown>;
  [key: string]: unknown;
};

export type SegmentRecommendationsData = Record<string, SegmentRec>;

/**
 * Fetches segment recommendations, server brands, and server options
 * in parallel from the API. Exposes loading and error state.
 */
export function useAppData() {
  const [segmentRecommendations, setSegmentRecommendations] =
    useState<SegmentRecommendationsData | null>(null);
  const [serverBrands, setServerBrands] = useState<ServerBrandsData | null>(null);
  const [serverOptions, setServerOptions] = useState<ServerOptionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [segRes, brandsRes, optionsRes] = await Promise.all([
        fetch("/api/segment-recommendations"),
        fetch("/api/server-brands"),
        fetch("/api/server-options"),
      ]);

      if (!segRes.ok) throw new Error(`segment-recommendations: HTTP ${segRes.status}`);
      if (!brandsRes.ok) throw new Error(`server-brands: HTTP ${brandsRes.status}`);
      if (!optionsRes.ok) throw new Error(`server-options: HTTP ${optionsRes.status}`);

      const [seg, brands, options] = await Promise.all([
        segRes.json(),
        brandsRes.json(),
        optionsRes.json(),
      ]);

      setSegmentRecommendations(seg);
      setServerBrands(brands);
      setServerOptions(options);
    } catch (err) {
      console.error("[useAppData] Fetch failed:", err);
      setError(err instanceof Error ? err.message : String(err));
      setSegmentRecommendations(null);
      setServerBrands(null);
      setServerOptions(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    segmentRecommendations,
    serverBrands,
    serverOptions,
    loading,
    error,
    refetch: fetchAll,
  };
}
