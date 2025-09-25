import { AxiosError } from "axios";
import { configApi } from "../configs/ConfigAxios";
import { PaginationApi } from "../interface/pagination";

/** ====== Interfaces ====== */
export interface Collection {
  id?: number;
  name: string;
  description?: string;
}

export interface CollectionUpdate {
  name?: string;
  description?: string | null;
}

export interface CollectionFilters {
  search?: string;
  user_id?: number | string;
}

export interface AddResourcesPayload {
  // hỗ trợ cả single (resource_id) và multiple (resource_ids)
  resource_id?: number;
  resource_ids?: number[];
}

/** ====== Helpers ====== */
const handleError = (error: unknown) =>
  (error as AxiosError)?.response?.data;

/** ====== CRUD Collections ====== */

// GET /all?search=&user_id=&page=&limit=
export const getCollections = async (
  pt: PaginationApi,
  filters?: CollectionFilters
) => {
  try {
    const params = new URLSearchParams({
      page: String(pt.page ?? 0),
      limit: String(pt.limit ?? 10),
      search: (filters?.search ?? "").toString(),
      user_id: (filters?.user_id ?? "").toString(),
    });

    const res = await configApi.get(
      `/admin/manage-collection/all?${params.toString()}`
    );
    return res?.data;
  } catch (error) {
    return handleError(error);
  }
};

// GET /:id
export const getCollectionById = async (id: number) => {
  try {
    const res = await configApi.get(`/admin/manage-collection/${id}`);
    return res?.data;
  } catch (error) {
    return handleError(error);
  }
};

// POST /create
export const createCollection = async (payload: Collection) => {
  try {
    const res = await configApi.post(`/admin/manage-collection/create`, payload);
    return res?.data;
  } catch (error) {
    return handleError(error);
  }
};

// PUT /:id
export const updateCollection = async (
  id: number,
  payload: CollectionUpdate
) => {
  try {
    const res = await configApi.put(`/admin/manage-collection/${id}`, payload);
    return res?.data;
  } catch (error) {
    return handleError(error);
  }
};

// DELETE /:id
export const deleteCollection = async (id: number) => {
  try {
    const res = await configApi.delete(`/admin/manage-collection/${id}`);
    return res?.data;
  } catch (error) {
    return handleError(error);
  }
};

/** ====== Resource Management inside a collection ====== */

// POST /:id/resources  (support single or multiple)
export const addResourcesToCollection = async (
  collectionId: number,
  payload: AddResourcesPayload
) => {
  try {
    const body: AddResourcesPayload = {};
    if (payload.resource_ids?.length) body.resource_ids = payload.resource_ids;
    if (payload.resource_id && !payload.resource_ids?.length)
      body.resource_id = payload.resource_id;

    const res = await configApi.post(
      `/admin/manage-collection/${collectionId}/resources`,
      body
    );
    return res?.data;
  } catch (error) {
    return handleError(error);
  }
};

// DELETE /:id/resources (multiple via body)
export const removeResourcesFromCollection = async (
  collectionId: number,
  resource_ids: number[]
) => {
  try {
    const res = await configApi.delete(
      `/admin/manage-collection/${collectionId}/resources`,
      { data: { resource_ids } }
    );
    return res?.data;
  } catch (error) {
    return handleError(error);
  }
};

// DELETE /:id/resources/:resourceId (single - backward compatibility)
export const removeSingleResourceFromCollection = async (
  collectionId: number,
  resourceId: number
) => {
  try {
    const res = await configApi.delete(
      `/admin/manage-collection/${collectionId}/resources/${resourceId}`
    );
    return res?.data;
  } catch (error) {
    return handleError(error);
  }
};
