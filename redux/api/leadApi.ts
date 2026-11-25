import type { TLead, TLeadInput, TLeadStatus, TMeta, TPaginatedList } from "@/types";
import { tagTypes } from "../tag-types";
import { baseApi } from "./baseApi";

const leadApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createLead: build.mutation<unknown, TLeadInput>({
      query: (data) => ({ url: "/leads", method: "POST", data }),
      invalidatesTags: [tagTypes.leads],
    }),
    // Unlike other lists, /leads puts `meta` beside `data` in the envelope.
    getLeads: build.query<TPaginatedList<TLead>, Record<string, unknown>>({
      query: (params) => ({ url: "/leads", method: "GET", params }),
      transformResponse: (data: TLead[], meta) => ({ items: data, meta: meta as unknown as TMeta }),
      providesTags: [tagTypes.leads],
    }),
    getLead: build.query<TLead, string>({
      query: (id) => ({ url: `/leads/${id}`, method: "GET" }),
      providesTags: [tagTypes.leads],
    }),
    updateLeadStatus: build.mutation<TLead, { id: string; status: TLeadStatus }>({
      query: ({ id, status }) => ({ url: `/leads/${id}/status`, method: "PATCH", data: { status } }),
      invalidatesTags: [tagTypes.leads, tagTypes.orders],
    }),
  }),
});

export const { useCreateLeadMutation, useGetLeadsQuery, useGetLeadQuery, useUpdateLeadStatusMutation } = leadApi;
