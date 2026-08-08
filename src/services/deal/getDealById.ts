import { api } from "../api";
import { DealDetails } from "@/types/deal";

export const getDealById = async (dealId: string): Promise<DealDetails> => {
  const response = await api.get<DealDetails>(`/deal/${dealId}`);
  const deal = response.data;
  if (deal.attribution) {
    return {
      ...deal,
      attribution: {
        firstTouch: deal.attribution.firstTouch
          ? {
              ...deal.attribution.firstTouch,
              attributedAt: new Date(
                deal.attribution.firstTouch.attributedAt,
              ).toISOString(),
            }
          : null,
        lastTouch: deal.attribution.lastTouch
          ? {
              ...deal.attribution.lastTouch,
              attributedAt: new Date(
                deal.attribution.lastTouch.attributedAt,
              ).toISOString(),
            }
          : null,
      },
    };
  }
  return deal;
};
