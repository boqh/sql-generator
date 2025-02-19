// Fund相关API
import request from "@/utils/request";
import type { FundInfo } from "@/types";

export const getFundInfo = (params: any) => {
  return request.get<FundInfo>("/fund-info", { params });
};
