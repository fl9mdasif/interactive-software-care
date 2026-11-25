import type {
  TMeta, TOrder, TOrderInput, TOrderStatus, TOverview, TPaginatedList, TPaymentInput, TUserRef,
} from "@/types";
import { tagTypes } from "../tag-types";
import { baseApi } from "./baseApi";

const changes = [tagTypes.orders, tagTypes.sales];

const orderApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getOrders: build.query<TPaginatedList<TOrder>, Record<string, unknown>>({
      query: (params) => ({ url: "/orders", method: "GET", params }),
      transformResponse: (res: { meta: TMeta; data: TOrder[] }) => ({ items: res.data, meta: res.meta }),
      providesTags: [tagTypes.orders],
    }),
    getOrder: build.query<TOrder, string>({
      query: (id) => ({ url: `/orders/${id}`, method: "GET" }),
      providesTags: [tagTypes.orders],
    }),
    getOverview: build.query<TOverview, void>({
      query: () => ({ url: "/orders/overview", method: "GET" }),
      providesTags: [tagTypes.orders, tagTypes.leads],
    }),
    getAssignees: build.query<TUserRef[], void>({
      query: () => ({ url: "/orders/assignees", method: "GET" }),
      providesTags: [tagTypes.users],
    }),
    createOrder: build.mutation<TOrder, TOrderInput>({
      query: (data) => ({ url: "/orders", method: "POST", data }),
      invalidatesTags: [...changes, tagTypes.leads],
    }),
    updateOrder: build.mutation<TOrder, { id: string; data: Partial<TOrderInput> }>({
      query: ({ id, data }) => ({ url: `/orders/${id}`, method: "PATCH", data }),
      invalidatesTags: changes,
    }),
    updateOrderStatus: build.mutation<TOrder, { id: string; status: TOrderStatus; reason?: string }>({
      query: ({ id, ...data }) => ({ url: `/orders/${id}/status`, method: "PATCH", data }),
      invalidatesTags: changes,
    }),
    addPayment: build.mutation<TOrder, { id: string; data: TPaymentInput }>({
      query: ({ id, data }) => ({ url: `/orders/${id}/payments`, method: "POST", data }),
      invalidatesTags: changes,
    }),
    voidPayment: build.mutation<TOrder, { id: string; paymentId: string; reason: string }>({
      query: ({ id, paymentId, reason }) => ({
        url: `/orders/${id}/payments/${paymentId}/void`,
        method: "PATCH",
        data: { reason },
      }),
      invalidatesTags: changes,
    }),
    addOrderNote: build.mutation<TOrder, { id: string; message: string }>({
      query: ({ id, message }) => ({ url: `/orders/${id}/notes`, method: "POST", data: { message } }),
      invalidatesTags: [tagTypes.orders],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useGetOverviewQuery,
  useGetAssigneesQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useUpdateOrderStatusMutation,
  useAddPaymentMutation,
  useVoidPaymentMutation,
  useAddOrderNoteMutation,
} = orderApi;
