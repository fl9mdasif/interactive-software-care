import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import { AxiosRequestConfig } from "axios";
import { instance as axiosInstance } from "./axiosInstance";
import { authKey } from "@/contains/authKey";
import { IGenericErrorMessage, ResponseSuccessType, TMeta } from "@/types/common";
import { getFromLocalStorage, removeFromLocalStorage } from "@/utils/local-storage";

export const axiosBaseQuery =
  (
    { baseUrl }: { baseUrl: string } = { baseUrl: "" }
  ): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig["method"];
      data?: AxiosRequestConfig["data"];
      params?: AxiosRequestConfig["params"];
      headers?: AxiosRequestConfig["headers"];
      meta?: TMeta;
      contentType?: string;
    },
    unknown,
    unknown
  > =>
    async ({ url, method, data, params, contentType }) => {
      try {
        const result = await axiosInstance({
          url: baseUrl + url,
          method,
          data,
          params,
          headers: {
            "Content-Type": contentType || "application/json",
          },
        });
        const { data: body, meta: pageInfo } = result as unknown as ResponseSuccessType;
        return { data: body, meta: pageInfo };
      } catch (axiosError) {
        // The response interceptor has already reduced the failure to this shape.
        const error = axiosError as IGenericErrorMessage;
        const status = error.statusCode || 500;

        // The stored token is no longer accepted: drop it and sign in again.
        if (status === 401 && getFromLocalStorage(authKey) && typeof window !== "undefined") {
          removeFromLocalStorage(authKey);
          window.location.assign("/login");
        }

        return { error: { status, data: error.message || "An unexpected error occurred" } };
      }
    };
