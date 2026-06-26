import { useState } from "react";
import segmentRecommendationsData from "../../data/segment-recommendations.json";
import serverBrandsData from "../../data/server-brands.json";
import serverOptionsData from "../../data/server-options.json";

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
 * Returns bundled JSON data directly — no network calls.
 * All three data files are imported at build time.
 */
export function useAppData() {
  const [segmentRecommendations] = useState<SegmentRecommendationsData>(
    segmentRecommendationsData as SegmentRecommendationsData
  );
  const [serverBrands] = useState<ServerBrandsData>(
    serverBrandsData as ServerBrandsData
  );
  const [serverOptions] = useState<ServerOptionsData>(
    serverOptionsData as ServerOptionsData
  );

  return {
    segmentRecommendations,
    serverBrands,
    serverOptions,
    loading: false,
    error: null,
    refetch: () => {},
  };
}
