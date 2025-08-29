import { AxiosError } from "axios";
import { configApi } from "../configs/ConfigAxios";

// Interface cho từng tag
export interface Tag {
  id: number;
  name: string;
}

// Interface cho response của /tag
export interface CreateTagResponse {
  statusCode: number;
  message: string;
}

// Interface cho phân trang
export interface Pagination {
  total: number;
  page: number;
  limit: number | string;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Interface cho response của /tags?...
export interface GetTagsResponse {
  statusCode: number;
  message: string;
  data: {
    tags: Tag[];
    pagination: Pagination;
  };
}

// Interface cho response của /tag/:id
export interface GetTagByIdResponse {
  statusCode: number;
  message: string;
  data: Tag[]; // Mảng tag
}

// Interface cho response của /tag/:id
export interface UpdateTagResponse {
  statusCode: number;
  message: string;
}
export interface DeleteTagResponse {
  statusCode: number;
  message: string;
}
// Hàm lấy danh sách tags kèm phân trang và tìm kiếm
export const getTags = async (
  page: number,
  limit: number,
  search: string
): Promise<GetTagsResponse | any> => {
  try {
    const response = await configApi.get<GetTagsResponse>(
      `/tag/all?page=${page}&limit=${limit}&search=${search}`
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};

// Hàm lấy tag theo id
export const getTagById = async (
  id: number
): Promise<GetTagByIdResponse | any> => {
  try {
    const response = await configApi.get<GetTagByIdResponse>(`/tag/${id}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};

// Hàm tạo tag mới
export const createTag = async (tag: Tag) => {
  try {
    const response = await configApi.post<CreateTagResponse>(`/tag`, tag);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};

// Hàm cập nhật tag
export const updateTag = async (id: number, tag: Tag) => {
  try {
    const response = await configApi.put<UpdateTagResponse>(`/tag/${id}`, tag);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};

// Hàm xóa tag
export const deleteTag = async (id: number) => {
  try {
    const response = await configApi.delete<DeleteTagResponse>(`/tag/delete/${id}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};
