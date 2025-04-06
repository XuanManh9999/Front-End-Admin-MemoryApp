import { AxiosError } from "axios";
import { configApi } from "../configs/ConfigAxios";
import { PaginationApi } from "../interface/pagination";

export const getUsers = async (pagination: PaginationApi) => {
  try {
    const response = await configApi.get(
      `/users?limit=${pagination.limit}&offset=${pagination.offset}`
    );
    return response?.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError.response?.data;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await configApi.get("/api/v1/user/current");
    return response?.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError.response?.data;
  }
};
