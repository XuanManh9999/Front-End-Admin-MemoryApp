import PageBreadcrumb from "../common/PageBreadCrumb";
import PageMeta from "../common/PageMeta";
import ComponentCard from "../common/ComponentCard";
import ReusableTable from "../common/ReusableTable";
import { useCallback, useEffect, useState, KeyboardEvent } from "react";
import { useSearchParams } from "react-router";
import { getUpcomingRenewals } from "../../services/payment";
import Pagination from "../pagination";
import { IUpcomingRenewal } from "../../interface/payment";
import FormModal from "../common/FormModal";
import { Input, message, Select } from "antd";
import Label from "../form/Label";
import { IoIosSearch, IoIosWarning } from "react-icons/io";
import dayjs from "dayjs";

const { Option } = Select;

interface RenewalsProps {
  totalPage: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
  data: IUpcomingRenewal[];
}

// Format functions
const formatDate = (dateString: string) => {
  return dayjs(dateString).format("DD/MM/YYYY");
};

const getDaysUntilExpiry = (endDate: string) => {
  return dayjs(endDate).diff(dayjs(), 'days');
};

const getExpiryStatus = (endDate: string) => {
  const days = getDaysUntilExpiry(endDate);
  if (days < 0) return { text: "Đã hết hạn", color: "red" };
  if (days <= 3) return { text: "Sắp hết hạn", color: "red" };
  if (days <= 7) return { text: "Cảnh báo", color: "orange" };
  return { text: "Bình thường", color: "green" };
};

const columns: { key: any; label: string; render?: (value: any, record: any) => any }[] = [
  { key: "subscription_id", label: "ID Gói" },
  { key: "user_id", label: "ID Người dùng" },
  { key: "name", label: "Tên khách hàng" },
  { key: "email", label: "Email" },
  { key: "plan", label: "Gói dịch vụ" },
  { 
    key: "start_date", 
    label: "Ngày bắt đầu",
    render: (value: string) => formatDate(value)
  },
  { 
    key: "end_date", 
    label: "Ngày hết hạn",
    render: (value: string, record: IUpcomingRenewal) => {
      const status = getExpiryStatus(value);
      return (
        <span style={{ color: status.color, fontWeight: 'bold' }}>
          {formatDate(value)} ({getDaysUntilExpiry(value)} ngày)
        </span>
      );
    }
  },
  {
    key: "status",
    label: "Trạng thái",
    render: (value: any, record: IUpcomingRenewal) => {
      const status = getExpiryStatus(record.end_date);
      return (
        <span style={{ color: status.color, fontWeight: 'bold' }}>
          {status.text}
        </span>
      );
    }
  },
];

export default function ManageRenewals() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openModal, setOpenModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [offset, setOffset] = useState(Number(searchParams.get("offset")) || 0);
  const [quantity, setQuantity] = useState(
    Number(searchParams.get("quantity")) || 10
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorData, setErrorData] = useState("");
  const [renewals, setRenewals] = useState<RenewalsProps | undefined>(undefined);
  const [search, setSearch] = useState<string>("");
  const [daysFilter, setDaysFilter] = useState<number>(7);
  const [formFields, setFormFields] = useState<any[]>([]);

  // Set default value of quantity và offset if do not have
  useEffect(() => {
    if (!searchParams.get("limit") || !searchParams.get("offset")) {
      setSearchParams((prev: any) => {
        const newParams = new URLSearchParams(prev);
        if (!newParams.get("limit")) newParams.set("limit", "10");
        if (!newParams.get("offset")) newParams.set("offset", "0");
        return newParams;
      });
    }
  }, [searchParams, setSearchParams]);

  const fetchRenewals = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: quantity,
        page: offset,
        days: daysFilter,
      };

      if (search.trim()) params.search = search.trim();

      const response = await getUpcomingRenewals(params);

      if (response?.data?.items?.length === 0) {
        setErrorData("Không có dữ liệu");
      } else {
        setErrorData("");
      }
      
      setRenewals({
        data: response?.data?.items || [],
        pagination: response?.data?.pagination || {
          page: 0,
          limit: 10,
          totalPages: 0,
          total: 0,
        },
        totalPage: response?.data?.pagination?.totalPages || 0,
      });

      let newLimit = response?.data?.pagination?.limit || 10;
      let newOffset = response?.data?.pagination?.page || 0;

      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("limit", String(newLimit));
        newParams.set("offset", String(newOffset));
        return newParams;
      });
    } catch (error) {
      const axiosError = error as Error;
      setErrorData(axiosError.message);
    } finally {
      setLoading(false);
    }
  }, [quantity, offset, search, daysFilter]);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      fetchRenewals()
        .then(() => {
          setLoading(false);
        })
        .catch((error) => {
          setErrorData(error.message);
          setLoading(false);
        });
    }, 1000);
  }, [quantity, offset, daysFilter]);

  const onEdit = async (item: IUpcomingRenewal) => {
    const status = getExpiryStatus(item.end_date);
    const daysLeft = getDaysUntilExpiry(item.end_date);
    
    setFormFields([
      {
        name: "subscription_id",
        label: "ID Gói",
        type: "text",
        initialValue: item.subscription_id,
        disabled: true,
      },
      {
        name: "user_id",
        label: "ID Người dùng",
        type: "text",
        initialValue: item.user_id,
        disabled: true,
      },
      {
        name: "name",
        label: "Tên khách hàng",
        type: "text",
        initialValue: item.name,
        disabled: true,
      },
      {
        name: "email",
        label: "Email",
        type: "text",
        initialValue: item.email,
        disabled: true,
      },
      {
        name: "plan",
        label: "Gói dịch vụ",
        type: "text",
        initialValue: item.plan,
        disabled: true,
      },
      {
        name: "start_date",
        label: "Ngày bắt đầu",
        type: "text",
        initialValue: formatDate(item.start_date),
        disabled: true,
      },
      {
        name: "end_date",
        label: "Ngày hết hạn",
        type: "text",
        initialValue: formatDate(item.end_date),
        disabled: true,
      },
      {
        name: "days_left",
        label: "Số ngày còn lại",
        type: "text",
        initialValue: `${daysLeft} ngày`,
        disabled: true,
      },
      {
        name: "status",
        label: "Trạng thái",
        type: "text",
        initialValue: status.text,
        disabled: true,
      },
    ]);
    setOpenModal(true);
  };

  const onDelete = async () => {
    // Không cho phép xóa renewal, chỉ xem thông tin
    message.info("Không thể xóa thông tin gia hạn");
  };

  // Handle Renewal Selection
  const getIds = (data: any) => {
    setSelectedIds(data);
  };

  const handleSubmitUpdateRenewal = async () => {
    // Chỉ xem thông tin, không cho phép cập nhật
    message.info("Thông tin chỉ để xem, không thể cập nhật");
    setOpenModal(false);
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      fetchRenewals();
    }
  };

  const handleSearch = () => {
    fetchRenewals();
  };

  const handleDaysFilterChange = (value: number) => {
    setDaysFilter(value);
  };

  const handleClearFilters = () => {
    setSearch("");
    setDaysFilter(7);
    setTimeout(() => {
      fetchRenewals();
    }, 100);
  };

  // Count renewals by status
  const expiredCount = renewals?.data?.filter(item => getDaysUntilExpiry(item.end_date) < 0).length || 0;
  const criticalCount = renewals?.data?.filter(item => {
    const days = getDaysUntilExpiry(item.end_date);
    return days >= 0 && days <= 3;
  }).length || 0;
  const warningCount = renewals?.data?.filter(item => {
    const days = getDaysUntilExpiry(item.end_date);
    return days > 3 && days <= 7;
  }).length || 0;

  return (
    <>
      <div className="">
        <PageMeta
          title="Quản lý gia hạn"
          description="Quản lý các gói dịch vụ sắp hết hạn"
        />
        <PageBreadcrumb pageTitle="Quản lý gia hạn" />
        
        {/* Alert Summary */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <IoIosWarning className="text-red-500 text-xl mr-2" />
              <div>
                <div className="text-red-800 font-semibold">Đã hết hạn</div>
                <div className="text-red-600">{expiredCount} gói</div>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <IoIosWarning className="text-orange-500 text-xl mr-2" />
              <div>
                <div className="text-orange-800 font-semibold">Sắp hết hạn (≤3 ngày)</div>
                <div className="text-orange-600">{criticalCount} gói</div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <IoIosWarning className="text-yellow-500 text-xl mr-2" />
              <div>
                <div className="text-yellow-800 font-semibold">Cảnh báo (4-7 ngày)</div>
                <div className="text-yellow-600">{warningCount} gói</div>
              </div>
            </div>
          </div>
        </div>
        
        <ComponentCard>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mb-4">
            <div>
              <Label htmlFor="searchInput">Tìm kiếm theo tên/email</Label>
              <Input
                type="text"
                id="searchInput"
                placeholder="Nhập tên hoặc email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                suffix={<IoIosSearch onClick={handleSearch} className="cursor-pointer" />}
              />
            </div>
            
            <div>
              <Label htmlFor="daysFilter">Số ngày sắp hết hạn</Label>
              <Select
                id="daysFilter"
                placeholder="Chọn số ngày"
                value={daysFilter}
                onChange={handleDaysFilterChange}
                className="w-full"
              >
                <Option value={3}>3 ngày</Option>
                <Option value={7}>7 ngày</Option>
                <Option value={15}>15 ngày</Option>
                <Option value={30}>30 ngày</Option>
              </Select>
            </div>
          </div>

          <div className="flex justify-between mb-4">
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 rounded-full border border-blue-300 bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-blue-600"
            >
              <IoIosSearch size={16} />
              Tìm kiếm
            </button>
            
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50"
            >
              Xóa bộ lọc
            </button>
          </div>

          <ReusableTable
            error={errorData}
            title="Danh sách gói dịch vụ sắp hết hạn"
            data={renewals?.data ?? []}
            columns={columns}
            // onEdit={onEdit}
            // onDelete={onDelete}
            isLoading={loading}
            // onCheck={(selectedIds) => getIds(selectedIds)}
            // setSelectedIds={setSelectedIds}
            // selectedIds={selectedIds}
          />

          <Pagination
            limit={quantity}
            offset={offset}
            totalPages={renewals?.pagination?.totalPages ?? 0}
            onPageChange={(limit, newOffset) => {
              setQuantity(limit);
              setOffset(newOffset);
            }}
            onLimitChange={(newLimit) => {
              setQuantity(newLimit);
              setOffset(0); // Reset offset về 0 khi đổi limit
            }}
          />
        </ComponentCard>
      </div>
      
      <FormModal
        title="Chi tiết gói gia hạn"
        isOpen={openModal}
        isLoading={false}
        onSubmit={() => handleSubmitUpdateRenewal()}
        onCancel={() => setOpenModal(false)}
        formFields={formFields}
      />
    </>
  );
}
