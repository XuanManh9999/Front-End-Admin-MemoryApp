import PageBreadcrumb from "../common/PageBreadCrumb";
import PageMeta from "../common/PageMeta";
import ComponentCard from "../common/ComponentCard";
import { useCallback, useEffect, useState } from "react";
import { 
  getPaymentStats, 
  getRegistrationStats, 
  getUpcomingRenewals,
  Granularity 
} from "../../services/payment";
import { IPaymentStats, IRegistrationStats, IUpcomingRenewal } from "../../interface/payment";
import { Select, DatePicker, Row, Col, Statistic, Card, Table, Tag } from "antd";
import { 
  DollarOutlined, 
  UserAddOutlined, 
  CreditCardOutlined,
  CalendarOutlined 
} from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function PaymentDashboard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentStats, setPaymentStats] = useState<IPaymentStats[]>([]);
  const [registrationStats, setRegistrationStats] = useState<IRegistrationStats[]>([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState<{
    items: IUpcomingRenewal[];
    pagination: any;
  }>({ items: [], pagination: {} });
  
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [renewalDays, setRenewalDays] = useState<number>(7);

  // Fetch payment statistics
  const fetchPaymentStats = useCallback(async () => {
    try {
      const params: any = { granularity };
      if (dateRange) {
        params.from = dateRange[0];
        params.to = dateRange[1];
      }
      
      const response = await getPaymentStats(params);
      if (response?.data) {
        setPaymentStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching payment stats:", error);
    }
  }, [granularity, dateRange]);

  // Fetch registration statistics
  const fetchRegistrationStats = useCallback(async () => {
    try {
      const params: any = { granularity };
      if (dateRange) {
        params.from = dateRange[0];
        params.to = dateRange[1];
      }
      
      const response = await getRegistrationStats(params);
      if (response?.data) {
        setRegistrationStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching registration stats:", error);
    }
  }, [granularity, dateRange]);

  // Fetch upcoming renewals
  const fetchUpcomingRenewals = useCallback(async () => {
    try {
      const response = await getUpcomingRenewals({
        days: renewalDays,
        page: 0,
        limit: 10,
      });
      if (response?.data) {
        setUpcomingRenewals(response.data);
      }
    } catch (error) {
      console.error("Error fetching upcoming renewals:", error);
    }
  }, [renewalDays]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPaymentStats(),
        fetchRegistrationStats(),
        fetchUpcomingRenewals(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchPaymentStats, fetchRegistrationStats, fetchUpcomingRenewals]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Calculate totals
  const totalRevenue = paymentStats.reduce((sum, stat) => sum + stat.total_amount, 0);
  const totalPayments = paymentStats.reduce((sum, stat) => sum + stat.payments_count, 0);
  const totalRegistrations = registrationStats.reduce((sum, stat) => sum + stat.registrations, 0);

  // Handle filter changes
  const handleGranularityChange = (value: Granularity) => {
    setGranularity(value);
  };

  const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
    if (dates) {
      setDateRange(dateStrings);
    } else {
      setDateRange(null);
    }
  };

  const handleRenewalDaysChange = (value: number) => {
    setRenewalDays(value);
  };

  // Table columns for upcoming renewals
  const renewalColumns = [
    {
      title: 'ID Gói',
      dataIndex: 'subscription_id',
      key: 'subscription_id',
    },
    {
      title: 'Tên khách hàng',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Gói dịch vụ',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: string) => (
        <Tag color="blue">{plan}</Tag>
      ),
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày hết hạn',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => (
        <span style={{ color: dayjs(date).diff(dayjs(), 'days') <= 3 ? 'red' : 'orange' }}>
          {dayjs(date).format('DD/MM/YYYY')}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="">
        <PageMeta
          title="Dashboard Thanh toán"
          description="Thống kê và báo cáo thanh toán"
        />
        <PageBreadcrumb pageTitle="Dashboard Thanh toán" />
        
        {/* Filters */}
        <ComponentCard>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian thống kê
              </label>
              <Select
                value={granularity}
                onChange={handleGranularityChange}
                className="w-full"
              >
                <Option value="day">Theo ngày</Option>
                <Option value="month">Theo tháng</Option>
                <Option value="year">Theo năm</Option>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khoảng thời gian
              </label>
              <RangePicker
                placeholder={["Từ ngày", "Đến ngày"]}
                format="YYYY-MM-DD"
                onChange={handleDateRangeChange}
                value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gói sắp hết hạn (ngày)
              </label>
              <Select
                value={renewalDays}
                onChange={handleRenewalDaysChange}
                className="w-full"
              >
                <Option value={3}>3 ngày</Option>
                <Option value={7}>7 ngày</Option>
                <Option value={15}>15 ngày</Option>
                <Option value={30}>30 ngày</Option>
              </Select>
            </div>
          </div>
        </ComponentCard>

        {/* Statistics Cards */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card loading={loading}>
              <Statistic
                title="Tổng doanh thu"
                value={totalRevenue}
                precision={0}
                valueStyle={{ color: '#3f8600' }}
                prefix={<DollarOutlined />}
                suffix="VND"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card loading={loading}>
              <Statistic
                title="Tổng số giao dịch"
                value={totalPayments}
                valueStyle={{ color: '#1890ff' }}
                prefix={<CreditCardOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card loading={loading}>
              <Statistic
                title="Người dùng mới"
                value={totalRegistrations}
                valueStyle={{ color: '#722ed1' }}
                prefix={<UserAddOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card loading={loading}>
              <Statistic
                title="Gói sắp hết hạn"
                value={upcomingRenewals.items.length}
                valueStyle={{ color: '#cf1322' }}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Payment Stats Table */}
        <ComponentCard>
          <h3 className="text-lg font-semibold mb-4">Thống kê thanh toán</h3>
          <Table
            loading={loading}
            dataSource={paymentStats}
            rowKey="period"
            columns={[
              {
                title: 'Thời gian',
                dataIndex: 'period',
                key: 'period',
              },
              {
                title: 'Số giao dịch',
                dataIndex: 'payments_count',
                key: 'payments_count',
              },
              {
                title: 'Tổng tiền',
                dataIndex: 'total_amount',
                key: 'total_amount',
                render: (amount: number) => `${amount.toLocaleString()} VND`,
              },
            ]}
            pagination={false}
          />
        </ComponentCard>

        {/* Registration Stats Table */}
        <ComponentCard>
          <h3 className="text-lg font-semibold mb-4">Thống kê đăng ký</h3>
          <Table
            loading={loading}
            dataSource={registrationStats}
            rowKey="period"
            columns={[
              {
                title: 'Thời gian',
                dataIndex: 'period',
                key: 'period',
              },
              {
                title: 'Số đăng ký',
                dataIndex: 'registrations',
                key: 'registrations',
              },
            ]}
            pagination={false}
          />
        </ComponentCard>

        {/* Upcoming Renewals */}
        <ComponentCard>
          <h3 className="text-lg font-semibold mb-4">
            Gói dịch vụ sắp hết hạn ({renewalDays} ngày tới)
          </h3>
          <Table
            loading={loading}
            dataSource={upcomingRenewals.items}
            rowKey="subscription_id"
            columns={renewalColumns}
            pagination={{
              total: upcomingRenewals.pagination?.total || 0,
              pageSize: 10,
              showSizeChanger: false,
            }}
          />
        </ComponentCard>
      </div>
    </>
  );
}
