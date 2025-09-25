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

export const getDashboard = async (): Promise<Dashboard> => {
    try {
        const response = await configApi.get("/admin/dashboard/overview");
        const dashboardResponse: DashboardResponse = response.data;
        return dashboardResponse.data;
    } catch (error) {
        throw error;
    }
}