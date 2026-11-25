import type { TPortfolioItem, TProduct, TService, TSettings } from "@/types";
import { tagTypes } from "../tag-types";
import { baseApi } from "./baseApi";

/** Projects, products, services and site settings, as edited from the dashboard. */
const contentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProjects: build.query<TPortfolioItem[], void>({
      query: () => ({ url: "/portfolio", method: "GET" }),
      providesTags: [tagTypes.portfolio],
    }),
    getProject: build.query<TPortfolioItem, string>({
      query: (id) => ({ url: `/portfolio/${id}`, method: "GET" }),
      providesTags: [tagTypes.portfolio],
    }),
    saveProject: build.mutation<TPortfolioItem, { id?: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: id ? `/portfolio/${id}` : "/portfolio", method: id ? "PATCH" : "POST", data }),
      invalidatesTags: [tagTypes.portfolio],
    }),
    deleteProject: build.mutation<unknown, string>({
      query: (id) => ({ url: `/portfolio/${id}`, method: "DELETE" }),
      invalidatesTags: [tagTypes.portfolio],
    }),

    getAdminProducts: build.query<TProduct[], void>({
      query: () => ({ url: "/products/admin/all", method: "GET" }),
      providesTags: [tagTypes.products],
    }),
    saveProduct: build.mutation<TProduct, { id?: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: id ? `/products/${id}` : "/products", method: id ? "PATCH" : "POST", data }),
      invalidatesTags: [tagTypes.products],
    }),
    deleteProduct: build.mutation<unknown, string>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: [tagTypes.products],
    }),

    getServiceOptions: build.query<TService[], void>({
      query: () => ({ url: "/services", method: "GET" }),
      providesTags: [tagTypes.services],
    }),

    getSiteSettings: build.query<TSettings, void>({
      query: () => ({ url: "/settings", method: "GET" }),
      providesTags: [tagTypes.settings],
    }),
    updateSiteSettings: build.mutation<TSettings, Partial<TSettings>>({
      query: (data) => ({ url: "/settings", method: "PATCH", data }),
      invalidatesTags: [tagTypes.settings],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useSaveProjectMutation,
  useDeleteProjectMutation,
  useGetAdminProductsQuery,
  useSaveProductMutation,
  useDeleteProductMutation,
  useGetServiceOptionsQuery,
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
} = contentApi;
