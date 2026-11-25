import type { TMeta, TPaginatedList, TSalesPoint, TSalesSlice, TSalesSummary, TTransaction } from "@/types";
import { tagTypes } from "../tag-types";
import { baseApi } from "./baseApi";

type TRange = { from?: string; to?: string };

const salesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSalesSummary: build.query<TSalesSummary, TRange>({
      query: (params) => ({ url: "/sales/summary", method: "GET", params }),
      providesTags: [tagTypes.sales],
    }),
    getSalesSeries: build.query<TSalesPoint[], TRange & { period: "day" | "month" | "year" }>({
      query: (params) => ({ url: "/sales/timeseries", method: "GET", params }),
      providesTags: [tagTypes.sales],
    }),
    getSalesBreakdown: build.query<TSalesSlice[], TRange & { by: "method" | "type" | "source" | "staff" }>({
      query: (params) => ({ url: "/sales/breakdown", method: "GET", params }),
      providesTags: [tagTypes.sales],
    }),
    getTransactions: build.query<TPaginatedList<TTransaction>, TRange & { page?: number; limit?: number; method?: string }>({
      query: (params) => ({ url: "/sales/transactions", method: "GET", params }),
      transformResponse: (res: { meta: TMeta; data: TTransaction[] }) => ({ items: res.data, meta: res.meta }),
      providesTags: [tagTypes.sales],
    }),
  }),
});

export const {
  useGetSalesSummaryQuery,
  useGetSalesSeriesQuery,
  useGetSalesBreakdownQuery,
  useGetTransactionsQuery,
  useLazyGetTransactionsQuery,
} = salesApi;
