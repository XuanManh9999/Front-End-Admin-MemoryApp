import axios, { AxiosError } from "axios";
import { configApi } from "../configs/ConfigAxios";

export const getCurrentUser = async () => {
  try {
    const response = await configApi.get("/api/v1/user/current");
    return response?.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError.response?.data;
  }
};
