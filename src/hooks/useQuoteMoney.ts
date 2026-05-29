import { useMemo, useCallback } from "react";
import { useProject } from "../context/ProjectContext";
import {
  normalizeQuoteSettings,
  formatMoney,
  computeTaxTotals,
  convertUsdToQuote,
} from "../utils/currency";

export function useQuoteMoney() {
  const { projectInfo } = useProject();
  const settings = useMemo(() => normalizeQuoteSettings(projectInfo), [projectInfo]);

  const fmt = useCallback(
    (amountUsd: number) => formatMoney(convertUsdToQuote(amountUsd, settings.fxRate), settings.currency),
    [settings.currency, settings.fxRate],
  );

  const totalsFromUsd = useCallback(
    (grandTotalUsd: number) => computeTaxTotals(grandTotalUsd, settings),
    [settings],
  );

  return { settings, fmt, totalsFromUsd };
}
