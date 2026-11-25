import type { TMeeting, TMeetingOutcome, TMeta, TPaginatedList } from "@/types";
import { tagTypes } from "../tag-types";
import { baseApi } from "./baseApi";

const meetingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMeetings: build.query<TPaginatedList<TMeeting>, Record<string, unknown>>({
      query: (params) => ({ url: "/meetings", method: "GET", params }),
      transformResponse: (res: { meta: TMeta; data: TMeeting[] }) => ({ items: res.data, meta: res.meta }),
      providesTags: [tagTypes.meetings],
    }),
    getMeeting: build.query<TMeeting, string>({
      query: (id) => ({ url: `/meetings/${id}`, method: "GET" }),
      providesTags: [tagTypes.meetings],
    }),
    updateMeeting: build.mutation<TMeeting, { id: string; data: { outcome?: TMeetingOutcome; internalNote?: string } }>({
      query: ({ id, data }) => ({ url: `/meetings/${id}`, method: "PATCH", data }),
      invalidatesTags: [tagTypes.meetings],
    }),
    syncMeetings: build.mutation<{ fetched: number; created: number; updated: number }, void>({
      query: () => ({ url: "/meetings/sync", method: "POST" }),
      invalidatesTags: [tagTypes.meetings, tagTypes.orders],
    }),
  }),
});

export const { useGetMeetingsQuery, useGetMeetingQuery, useUpdateMeetingMutation, useSyncMeetingsMutation } = meetingApi;
