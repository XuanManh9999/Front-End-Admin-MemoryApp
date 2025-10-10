import PageBreadcrumb from "../common/PageBreadCrumb";
import PageMeta from "../common/PageMeta";
import ComponentCard from "../common/ComponentCard";
import ReusableTable from "../common/ReusableTable";
import { useEffect, useState } from "react";
import { Input, Select, Card, Statistic, Modal } from "antd";
import Label from "../form/Label";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  getDashboard,
  getCombinedStats,
  getTopDownloadedResources,
  getResourcesByCategory,
  getResourcesDetailsByPeriod,
  Dashboard,
  CombinedStats,
  TopDownloadResource,
  CategoryStats,
  ResourceDetail
} from "../../services/dashboard";

// Modern color palette for charts
const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];

// Custom chart colors
const CHART_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6', 
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4'
};

const resourceDetailColumns: { key: any; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "title", label: "Tiêu đề" },
  { key: "file_type", label: "Loại file" },
  { key: "downloads", label: "Lượt tải" },
  { key: "category_name", label: "Danh mục" },
  { key: "user_name", label: "Người tạo" },
  { key: "created_at", label: "Ngày tạo" },
  { key: "status", label: "Trạng thái" },
];
export default function ManageReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard data states
  const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);
  const [combinedStats, setCombinedStats] = useState<CombinedStats | null>(null);
  const [topResources, setTopResources] = useState<TopDownloadResource[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  
  // Filter states
  const [period, setPeriod] = useState<string>("month");
  const [year, setYear] = useState<string>("");
  
  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPeriodData, setSelectedPeriodData] = useState<ResourceDetail[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [period, year]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [overview, combined, top, categories] = await Promise.all([
        getDashboard(),
        getCombinedStats(period, year || undefined),
        getTopDownloadedResources(10),
        getResourcesByCategory()
      ]);
      
      setDashboardData(overview);
      setCombinedStats(combined);
      setTopResources(top);
      setCategoryStats(categories);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleChartClick = async (data: {period: string}, chartType: string) => {
    if (!data || !data.period) return;
    
    try {
      setLoading(true);
      const details = await getResourcesDetailsByPeriod(period, year || undefined, data.period);
      console.log("Check details", details);
      
      setSelectedPeriodData(details.resources);
      setSelectedPeriod(`${chartType} - tháng ${data.period}`);
      setDetailModalVisible(true);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tải chi tiết");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (_id: string | number) => {
    // Implementation for delete if needed
  };

  return (
    <div className="">
      <PageMeta
        title="Dashboard Báo Cáo | TailAdmin - Dashboard Quản Trị"
        description="Dashboard thống kê và báo cáo hệ thống"
      />
      <PageBreadcrumb pageTitle="Dashboard Báo Cáo" />
      
      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="font-semibold">Có lỗi xảy ra</h4>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="mb-6 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-blue-700 font-medium">Đang tải dữ liệu thống kê...</p>
        </div>
      )}

      {/* Filter Controls */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Bộ Lọc Thống Kê</h3>
        <div className="flex flex-wrap gap-6">
          <div className="min-w-[150px]">
            <Label htmlFor="period" className="text-sm font-medium text-gray-700 dark:text-gray-300">Khoảng thời gian</Label>
            <Select
              id="period"
              value={period}
              onChange={setPeriod}
              size="large"
              className="w-full mt-1"
              options={[
                { value: "day", label: "📅 Theo ngày" },
                { value: "month", label: "📊 Theo tháng" },
                { value: "year", label: "📈 Theo năm" }
              ]}
            />
      </div>
          <div className="min-w-[150px]">
            <Label htmlFor="year" className="text-sm font-medium text-gray-700 dark:text-gray-300">Năm cụ thể</Label>
            <Input
              id="year"
              type="number"
              placeholder="VD: 2024"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              size="large"
              className="mt-1"
              prefix="🗓️"
            />
          </div>
        </div>
      </div>

      {/* Overview Statistics */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <Statistic
                  title={<span className="text-green-700 font-medium">👥 Tổng Người Dùng</span>}
                  value={dashboardData.total_users}
                  valueStyle={{ color: '#15803d', fontSize: '24px', fontWeight: 'bold' }}
                />
              </div>
              <div className="text-3xl text-green-500">👥</div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <Statistic
                  title={<span className="text-blue-700 font-medium">📁 Tổng Tài Nguyên</span>}
                  value={dashboardData.total_resources}
                  valueStyle={{ color: '#1d4ed8', fontSize: '24px', fontWeight: 'bold' }}
                />
              </div>
              <div className="text-3xl text-blue-500">📁</div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <Statistic
                  title={<span className="text-red-700 font-medium">⬇️ Tổng Lượt Tải</span>}
                  value={dashboardData.total_downloads}
                  valueStyle={{ color: '#dc2626', fontSize: '24px', fontWeight: 'bold' }}
                />
              </div>
              <div className="text-3xl text-red-500">⬇️</div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <Statistic
                  title={<span className="text-purple-700 font-medium">📚 Bộ Sưu Tập</span>}
                  value={dashboardData.total_collections}
                  valueStyle={{ color: '#7c3aed', fontSize: '24px', fontWeight: 'bold' }}
                />
              </div>
              <div className="text-3xl text-purple-500">📚</div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <Statistic
                  title={<span className="text-orange-700 font-medium">🏷️ Tổng Tags</span>}
                  value={dashboardData.total_tags}
                  valueStyle={{ color: '#ea580c', fontSize: '24px', fontWeight: 'bold' }}
                />
              </div>
              <div className="text-3xl text-orange-500">🏷️</div>
            </div>
          </Card>
        </div>
      )}

      {/* Combined Stats Chart */}
      {combinedStats && (
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📊</span>
                Xu Hướng Phát Triển Theo Thời Gian
              </h3>
              <p className="text-indigo-100 text-sm mt-1">Biểu đồ thể hiện sự tăng trưởng của tài nguyên qua các kỳ</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={combinedStats.resources} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeWidth={1} />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                    tickLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                    tickLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      padding: '12px 16px'
                    }}
                    labelStyle={{ color: '#374151', fontWeight: '600' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke={CHART_COLORS.primary}
                    strokeWidth={4}
                    dot={{ fill: CHART_COLORS.primary, strokeWidth: 0, r: 8 }}
                    activeDot={{ 
                      r: 12, 
                      fill: CHART_COLORS.primary,
                      stroke: 'white',
                      strokeWidth: 3,
                      drop: true
                    }}
                    name="Số lượng tài nguyên"
                    onClick={(data: {period: string}) => handleChartClick(data, "Tài nguyên")}
                    style={{ cursor: 'pointer' }}
                    fill="url(#colorGradient)"
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  <span>💡 <strong>Mẹo:</strong> Click vào các điểm trên đường biểu đồ để xem danh sách chi tiết tài nguyên</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Resources Stats */}
        {combinedStats?.resources && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📁</span>
                Thống Kê Tài Nguyên
              </h3>
              <p className="text-blue-100 text-sm mt-1">Số lượng tài nguyên được tạo theo từng kỳ</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={combinedStats.resources} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="resourceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.info} />
                      <stop offset="100%" stopColor={CHART_COLORS.primary} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                    labelStyle={{ color: '#374151', fontWeight: '600' }}
                    cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#resourceGradient)"
                    radius={[6, 6, 0, 0]}
                    onClick={(data: {period: string}) => handleChartClick(data, "Tài nguyên")}
                    style={{ cursor: 'pointer' }}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 bg-blue-50 rounded-lg p-3 text-center">
                <span className="text-sm text-blue-700">🖱️Biểu đồ thể hiện số lượng tài nguyên được tạo theo từng kỳ</span>
              </div>
            </div>
          </div>
        )}

        {/* Downloads Stats */}
        {combinedStats?.downloads && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📈</span>
                Thống Kê Lượt Tải
              </h3>
              <p className="text-green-100 text-sm mt-1">Số lượng lượt tải xuống theo từng kỳ</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={combinedStats.downloads} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.success} />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                    labelStyle={{ color: '#374151', fontWeight: '600' }}
                    cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#downloadGradient)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 bg-green-50 rounded-lg p-3 text-center">
                <span className="text-sm text-green-700">📊 Biểu đồ thể hiện xu hướng tải xuống</span>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <span className="text-lg font-semibold text-gray-800">Chi tiết {selectedPeriod}</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={1200}
        className="top-4"
        styles={{
          body: { maxHeight: '70vh', overflowY: 'auto' }
        }}
      >
        <div className="bg-gray-50 p-4 rounded-lg">
          <ReusableTable
            error=""
            title="📊 Danh sách tài nguyên chi tiết"
            data={selectedPeriodData}
            columns={resourceDetailColumns}
            isLoading={loading}
          />
          {selectedPeriodData.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <p>Không có dữ liệu trong khoảng thời gian này</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
