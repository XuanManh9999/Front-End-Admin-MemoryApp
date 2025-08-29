import { AxiosError } from "axios";
import { configApi } from "../configs/ConfigAxios";
import { PaginationApi } from "../interface/pagination";

// ==== Interfaces ====
export interface Resource {
  id?: number;
  title: string;
  description?: string;
  category_id: number;
  plan: "free" | "premium";
  detail?: string;
  file?: File;
  collection_id: number; // Required for creation
  tag_id: number; // Required for creation
}

export interface ResourceUpdate {
  title?: string;
  description?: string;
  category_id?: number;
  plan?: "free" | "premium";
  detail?: string;
  status?: "pending" | "publish";
  file?: File;
  tag_ids?: number[];          // danh sách tag mới
  collection_ids?: number[];   // danh sách collection mới
}

export const getResources = async (pt: PaginationApi, filters?: any) => {
  try {
    const params = new URLSearchParams({
      page: String(pt.page),
      limit: String(pt.limit),
      search: filters?.search || "",
      category_id: filters?.category_id || "",
      file_type: filters?.file_type || "",
      collection_id: filters?.collection_id || "",
      tag_id: filters?.tag_id || "",
      status: filters?.status || "",
      plan: filters?.plan || "",
    });

    const response = await configApi.get(`/admin/manage-resource/all?${params.toString()}`);
    return response?.data;
  } catch (error) {
    return (error as AxiosError)?.response?.data;
  }
};

export const getAllFileType = async () => {
  try {
    const response = await configApi.get(`/admin/manage-resource/all-file-type`);
    return response?.data;
  } catch (error) {
    return (error as AxiosError)?.response?.data;
  }
};

export const getResourceById = async (id: number) => {
  try {
    const response = await configApi.get(`/admin/manage-resource/${id}`);
    return response?.data;
  } catch (error) {
    return (error as AxiosError)?.response?.data;
  }
};

export const createResource = async (resource: Resource) => {
  try {
    const formData = new FormData();
    
    // Xử lý từng field riêng biệt
    if (resource.title) formData.append('title', resource.title);
    if (resource.description) formData.append('description', resource.description);
    if (resource.category_id) formData.append('category_id', resource.category_id.toString());
    if (resource.plan) formData.append('plan', resource.plan);
    if (resource.detail) formData.append('detail', resource.detail);
    if (resource.tag_id) formData.append('tag_id', resource.tag_id.toString());
    if (resource.collection_id) formData.append('collection_id', resource.collection_id.toString());
    
    // Xử lý file riêng biệt
    if (resource.file) {
      console.log('File being uploaded:', resource.file);
      formData.append('file', resource.file);
    }

    // Log FormData để debug
    console.log('FormData entries:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    const response = await configApi.post(`/admin/manage-resource/create`, formData, {
      headers: { 
        "Content-Type": "multipart/form-data",
      },
    });
    return response?.data;
  } catch (error) {
    console.error('Create resource error:', error);
    return (error as AxiosError)?.response?.data;
  }
};

export const updateResource = async (id: number, resource: ResourceUpdate) => {
  try {
    const formData = new FormData();
    
    // Xử lý từng field riêng biệt
    if (resource.title !== undefined) formData.append('title', resource.title);
    if (resource.description !== undefined) formData.append('description', resource.description);
    if (resource.category_id !== undefined) formData.append('category_id', resource.category_id.toString());
    if (resource.plan !== undefined) formData.append('plan', resource.plan);
    if (resource.detail !== undefined) formData.append('detail', resource.detail);
    if (resource.status !== undefined) formData.append('status', resource.status);
    
    // Xử lý file riêng biệt
    if (resource.file) {
      console.log('File being updated:', resource.file);
      formData.append('file', resource.file);
    }

    // Xử lý arrays
    if (resource.tag_ids && Array.isArray(resource.tag_ids)) {
      formData.append('tag_ids', JSON.stringify(resource.tag_ids));
    }
    if (resource.collection_ids && Array.isArray(resource.collection_ids)) {
      formData.append('collection_ids', JSON.stringify(resource.collection_ids));
    }

    // Log FormData để debug
    console.log('Update FormData entries:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    const response = await configApi.put(`/admin/manage-resource/${id}`, formData, {
      headers: { 
        "Content-Type": "multipart/form-data",
      },
    });
    return response?.data;
  } catch (error) {
    console.error('Update resource error:', error);
    return (error as AxiosError)?.response?.data;
  }
};

export const deleteResource = async (id: number) => {
  try {
    const response = await configApi.delete(`/admin/manage-resource/${id}`);
    return response?.data;
  } catch (error) {
    return (error as AxiosError)?.response?.data;
  }
};

export const updateResourceStatus = async (id: number, status: number) => {
  try {
    const response = await configApi.put(`/admin/manage-resource/${id}/status`, { status });
    return response?.data;
  } catch (error) {
    return (error as AxiosError)?.response?.data;
  }
};

// ==== Tags ====
export const addTagsToResource = async (id: number, tag_ids: number[]) => {
  try {
    const response = await configApi.post(`/admin/manage-resource/${id}/tags`, { tag_ids });
    return response?.data;
  } catch (error) {
    return (error as AxiosError)?.response?.data;
  }
};

export const removeTagFromResource = async (id: number, tagId: number) => {
  try {
    const response = await configApi.delete(`/admin/manage-resource/${id}/tags/${tagId}`);
    return response?.data;
  } catch (error) {
    return (error as AxiosError)?.response?.data;
  }
};

export const getResourceTags = async (id: number) => {
  try {
    const response = await configApi.get(`/admin/manage-resource/${id}/tags`);
    return response?.data;
  } catch (error) {
    return (error as AxiosError)?.response?.data;
  }
};

// ==== Collections ====
export const addResourceToCollection = async (id: number, collection_id: number) => {
  try {
    const response = await configApi.post(`/admin/manage-resource/${id}/collections`, { collection_id });
    return response?.data;
  } catch (error) {
    return (error as AxiosError)?.response?.data;
  }
};

export const removeResourceFromCollection = async (id: number, collectionId: number) => {
  try {
    const response = await configApi.delete(`/admin/manage-resource/${id}/collections/${collectionId}`);
    return response?.data;
  } catch (error) {
    return (error as AxiosError)?.response?.data;
  }
};

export const getResourceCollections = async (id: number) => {
  try {
    const response = await configApi.get(`/admin/manage-resource/${id}/collections`);
    return response?.data;
  } catch (error) {
    return (error as AxiosError)?.response?.data;
  }
};
