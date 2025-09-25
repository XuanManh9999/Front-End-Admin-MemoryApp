import { AxiosError } from "axios";
import { configApi } from "../configs/ConfigAxios";
import { PaginationApi } from "../interface/pagination";
interface User {
  password: string;
  role: string;
  username_admin: string;
  status?: number;
}

interface UserDeleteIds {
  ids: number[];
}

export const getUsers = async (pt: PaginationApi) => {
  try {
    const response = await configApi.get(
      `/admin/manage-user/users?page=${pt.page}&limit=${pt.limit}`
    );
    return response?.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};

export const getSearchs = async (pt: PaginationApi) => {
  try {
    const response = await configApi.get(
      `/admin/manage-user/search?search=${pt.search}&limit=${pt.limit}&page=${pt.page}`
    );
    return response?.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};

export const getUserById = async (userID: number) => {
  try {
    const response = await configApi.get(`/admin/manage-user/user/${userID}`);
    return response?.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};

export const addUser = async (user: User) => {
  try {
    const response = await configApi.post(
      `/admin/manage-user/create-user`,
      user
    );
    return response?.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};

export const deleteUserById = async (userID: number) => {
  try {
    const response = await configApi.delete(`/admin/manage-user/${userID}`);
    return response?.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};

export const deleteMultiUser = async (ids: UserDeleteIds) => {
  try {
    const response = await configApi.delete(`/delete-multiple`, {
      data: ids,
    });
    return response?.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};

export const updateUser = async (user: User, userID: number) => {
  try {
    const response = await configApi.put(
      `/admin/manage-user/update-user/${userID}`,
      user
    );
    return response?.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};
