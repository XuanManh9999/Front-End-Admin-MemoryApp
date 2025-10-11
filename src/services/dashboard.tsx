import { configApi } from "../configs/ConfigAxios";

export interface Dashboard {
    total_users: number;
    total_resources: number;
    total_downloads: number;
    total_collections: number;
    total_tags: number;
}

export interface DashboardResponse {
    statusCode: number;
    message: string;
    data: Dashboard;
}

export interface StatsData {
    period: string | number;
    count: number;
}

export interface StatsResponse {
    statusCode: number;
    message: string;
    data: StatsData[];
}

export interface CombinedStats {
    resources: StatsData[];
    downloads: StatsData[];
    collections: StatsData[];
}

export interface CombinedStatsResponse {
    statusCode: number;
    message: string;
    data: CombinedStats;
}

export interface TopDownloadResource {
    id: number;
    title: string;
    file_type: string;
    download_count: number;
}

export interface TopDownloadResponse {
    statusCode: number;
    message: string;
    data: TopDownloadResource[];
}

export interface CategoryStats {
    category_name: string;
    resource_count: number;
}

export interface CategoryStatsResponse {
    statusCode: number;
    message: string;
    data: CategoryStats[];
}

export interface ResourceDetail {
    id: number;
    title: string;
    description: string;
    file_url: string;
    file_type: string;
    downloads: number;
    status: string;
    created_at: string;
    category_name: string;
    user_name: string;
    user_email: string;
}

export interface ResourceDetailsData {
    resources: ResourceDetail[];
    total: number;
    period: string;
    specific_period?: string;
    year?: string;
}

export interface ResourceDetailsResponse {
    statusCode: number;
    message: string;
    data: ResourceDetailsData;
}

// API Functions
export const getDashboard = async (): Promise<Dashboard> => {
    try {
        const response = await configApi.get("/admin/dashboard/overview");
        const dashboardResponse: DashboardResponse = response.data;
        return dashboardResponse.data;
    } catch (error) {
        throw error;
    }
}

export const getResourcesStats = async (period: string = "month", year?: string): Promise<StatsData[]> => {
    try {
        const params = new URLSearchParams();
        params.append("period", period);
        if (year) params.append("year", year);
        
        const response = await configApi.get(`/admin/dashboard/stats/resources?${params.toString()}`);
        const statsResponse: StatsResponse = response.data;
        return statsResponse.data;
    } catch (error) {
        throw error;
    }
}

export const getDownloadsStats = async (period: string = "month", year?: string): Promise<StatsData[]> => {
    try {
        const params = new URLSearchParams();
        params.append("period", period);
        if (year) params.append("year", year);
        
        const response = await configApi.get(`/admin/dashboard/stats/downloads?${params.toString()}`);
        const statsResponse: StatsResponse = response.data;
        return statsResponse.data;
    } catch (error) {
        throw error;
    }
}

export const getCollectionsStats = async (period: string = "month", year?: string): Promise<StatsData[]> => {
    try {
        const params = new URLSearchParams();
        params.append("period", period);
        if (year) params.append("year", year);
        
        const response = await configApi.get(`/admin/dashboard/stats/collections?${params.toString()}`);
        const statsResponse: StatsResponse = response.data;
        return statsResponse.data;
    } catch (error) {
        throw error;
    }
}

export const getCombinedStats = async (period: string = "month", year?: string): Promise<CombinedStats> => {
    try {
        const params = new URLSearchParams();
        params.append("period", period);
        if (year) params.append("year", year);
        
        const response = await configApi.get(`/admin/dashboard/stats/combined?${params.toString()}`);
        const combinedResponse: CombinedStatsResponse = response.data;
        return combinedResponse.data;
    } catch (error) {
        throw error;
    }
}

export const getTopDownloadedResources = async (limit: number = 10): Promise<TopDownloadResource[]> => {
    try {
        const response = await configApi.get(`/admin/dashboard/stats/top-downloads?limit=${limit}`);
        const topDownloadResponse: TopDownloadResponse = response.data;
        return topDownloadResponse.data;
    } catch (error) {
        throw error;
    }
}

export const getResourcesByCategory = async (): Promise<CategoryStats[]> => {
    try {
        const response = await configApi.get("/admin/dashboard/stats/categories");
        const categoryResponse: CategoryStatsResponse = response.data;
        return categoryResponse.data;
    } catch (error) {
        throw error;
    }
}

export const getResourcesDetailsByPeriod = async (
    period: string = "month", 
    year?: string, 
    specificPeriod?: string
): Promise<ResourceDetailsData> => {
    try {
        const params = new URLSearchParams();
        params.append("period", period);
        if (year) params.append("year", year);
        if (specificPeriod) params.append("specificPeriod", specificPeriod);
        
        const response = await configApi.get(`/admin/dashboard/resources/details?${params.toString()}`);
        const detailsResponse: ResourceDetailsResponse = response.data;
        return detailsResponse.data;
    } catch (error) {
        throw error;
    }
}