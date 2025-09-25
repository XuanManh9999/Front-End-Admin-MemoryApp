import { AxiosError } from "axios";
import { configApi } from "../configs/ConfigAxios";

// Interface cho từng category
export interface Category {
  id: number;
  name: string;
  description: string;
  img: string;
  parent_id?: number | null;
}

// Interface cho phân trang
export interface Pagination {
  total: number;
  page: number;
  limit: number;
}

// Interface cho response của /categories
export interface GetCategoriesResponse {
  statusCode: number;
  message: string;
  data: {
    categories: Category[];
    pagination: Pagination;
  };
}

// Interface cho response của /category/:id
export interface GetCategoryByIdResponse {
  statusCode: number;
  message: string;
  data: Category;
}

// Interface cho response của create/update/delete
export interface CategoryResponse {
  statusCode: number;
  message: string;
  data?: Category;
  error?: string;
}

// Hàm lấy danh sách categories kèm phân trang và tìm kiếm
export const getCategories = async (
  page: number = 0,
  limit: number = 10,
  search: string = ""
): Promise<GetCategoriesResponse> => {
  try {
    const response = await configApi.get<GetCategoriesResponse>(
      `/admin/manage-category/all?page=${page}&limit=${limit}&search=${search}`
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError?.response?.data;
  }
};

// Hàm lấy category theo id
export const getCategoryById = async (
  id: number
): Promise<GetCategoryByIdResponse> => {
  try {
    const response = await configApi.get<GetCategoryByIdResponse>(
      `/admin/manage-category/${id}`
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError?.response?.data;
  }
};

// Hàm tạo category mới
export const createCategory = async (formData: FormData): Promise<CategoryResponse> => {
  try {
    const response = await configApi.post<CategoryResponse>(
      `/admin/manage-category/create`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError?.response?.data;
  }
};

// Hàm cập nhật category
export const updateCategory = async (
  id: number,
  formData: FormData
): Promise<CategoryResponse> => {
  try {
    const response = await configApi.put<CategoryResponse>(
      `/admin/manage-category/update/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError?.response?.data;
  }
};

// Hàm xóa category
export const deleteCategory = async (
  id: number
): Promise<CategoryResponse> => {
  try {
    const response = await configApi.delete<CategoryResponse>(
      `/admin/manage-category/delete/${id}`
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError?.response?.data;
  }
};
