// src/apis/payment.ts
import { AxiosError } from "axios";
import { configApi } from "../configs/ConfigAxios";

/* =========================
   Common
========================= */

export type Granularity = "day" | "month" | "year";

export interface Pagination {
  total: number;
  page: number;
  limit: number | string;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Tính thêm totalPages/hasNext/hasPrev từ (total, page, limit)
const enrichPagination = (p: {
  total: number;
  page: number;
  limit: number;
}): Pagination => {
  const limitNum =
    typeof p.limit === "string" ? parseInt(p.limit, 10) : p.limit;
  const totalPages = Math.max(1, Math.ceil((p.total || 0) / (limitNum || 1)));
  const pageSafe = Math.max(0, p.page || 0);
  return {
    total: p.total || 0,
    page: pageSafe,
    limit: limitNum,
    totalPages,
    hasNext: pageSafe + 1 < totalPages,
    hasPrev: pageSafe > 0,
  };
};

/* =========================
   1) Registrations stats
========================= */

export interface RegistrationStatRow {
  period: string; // "2025-10-01" | "2025-10" | "2025"
  registrations: number;
}
export interface GetRegistrationStatsResponse {
  statusCode: number;
  message: string;
  data: RegistrationStatRow[];
}

export const getRegistrationStats = async (params: {
  granularity?: Granularity;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}): Promise<GetRegistrationStatsResponse | any> => {
  try {
    const { granularity = "day", from = "", to = "" } = params || {};
    const q = new URLSearchParams();
    q.set("granularity", granularity);
    if (from) q.set("from", from);
    if (to) q.set("to", to);

    const res = await configApi.get<GetRegistrationStatsResponse>(
      `/admin/payment/stats/registrations?${q.toString()}`
    );
    return res.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};

/* =========================
   2) Payment stats
========================= */

export interface PaymentStatRow {
  period: string; // "2025-10-01" | "2025-10" | "2025"
  payments_count: number;
  total_amount: number; // DECIMAL => FE coi như number
}
export interface GetPaymentStatsResponse {
  statusCode: number;
  message: string;
  data: PaymentStatRow[];
}

export const getPaymentStats = async (params: {
  granularity?: Granularity;
  from?: string;
  to?: string;
  status?: string; // ví dụ: success | pending | failed
}): Promise<GetPaymentStatsResponse | any> => {
  try {
    const {
      granularity = "day",
      from = "",
      to = "",
      status = "",
    } = params || {};
    const q = new URLSearchParams();
    q.set("granularity", granularity);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (status) q.set("status", status);

    const res = await configApi.get<GetPaymentStatsResponse>(
      `/admin/manage-payment/stats/payments?${q.toString()}`
    );
    return res.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};

/* =========================
   3) Upcoming renewals
========================= */

export interface UpcomingRenewalItem {
  subscription_id: number;
  user_id: number;
  plan: string;
  start_date: string; // 'YYYY-MM-DD'
  end_date: string; // 'YYYY-MM-DD'
  name: string;
  email: string;
}
export interface GetUpcomingRenewalsResponse {
  statusCode: number;
  message: string;
  data: {
    items: UpcomingRenewalItem[];
    pagination: Pagination; // đã enrich
  };
}

export const getUpcomingRenewals = async (params?: {
  days?: number; // default 7
  page?: number; // default 0
  limit?: number; // default 10
  search?: string; // name/email
}): Promise<GetUpcomingRenewalsResponse | any> => {
  try {
    const { days = 7, page = 0, limit = 10, search = "" } = params || {};
    const q = new URLSearchParams();
    q.set("days", String(days));
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (search) q.set("search", search);

    const res = await configApi.get<{
      statusCode: number;
      message: string;
      data: {
        items: UpcomingRenewalItem[];
        pagination: { total: number; page: number; limit: number };
      };
    }>(`/admin/manage-payment/subscriptions/upcoming-renewals?${q.toString()}`);

    // Enrich pagination cho đồng bộ UI
    const enriched: GetUpcomingRenewalsResponse = {
      statusCode: res.data.statusCode,
      message: res.data.message,
      data: {
        items: res.data.data.items,
        pagination: enrichPagination(res.data.data.pagination),
      },
    };
    return enriched;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};

/* =========================
   4) Payments list (table)
========================= */

export interface PaymentItem {
  id: number;
  user_id: number;
  name: string | null;
  email: string | null;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string; // ISO datetime
}
export interface GetPaymentsResponse {
  statusCode: number;
  message: string;
  data: {
    items: PaymentItem[];
    pagination: Pagination; // đã enrich
  };
}

export const getPayments = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  search?: string; // name/email
}): Promise<GetPaymentsResponse | any> => {
  try {
    const {
      page = 0,
      limit = 10,
      status = "",
      method = "",
      from = "",
      to = "",
      search = "",
    } = params || {};
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (status) q.set("status", status);
    if (method) q.set("method", method);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (search) q.set("search", search);

    const res = await configApi.get<{
      statusCode: number;
      message: string;
      data: {
        items: PaymentItem[];
        pagination: { total: number; page: number; limit: number };
      };
    }>(`/admin/manage-payment/list?${q.toString()}`);

    const enriched: GetPaymentsResponse = {
      statusCode: res.data.statusCode,
      message: res.data.message,
      data: {
        items: res.data.data.items,
        pagination: enrichPagination(res.data.data.pagination),
      },
    };
    return enriched;
  } catch (error) {
    const axiosError = error as AxiosError;
    return axiosError?.response?.data;
  }
};
