import PageBreadcrumb from "../common/PageBreadCrumb";
import PageMeta from "../common/PageMeta";
import ComponentCard from "../common/ComponentCard";
import ReusableTable from "../common/ReusableTable";
import { useCallback, useEffect, useState, KeyboardEvent } from "react";
import { useSearchParams } from "react-router";
import { getPayments } from "../../services/payment";
import Pagination from "../pagination";
import { IPayment } from "../../interface/payment";
import FormModal from "../common/FormModal";
import { Input, message, Select, DatePicker } from "antd";
import Label from "../form/Label";
import { IoIosSearch } from "react-icons/io";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface PaymentsProps {
  totalPage: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
  data: IPayment[];
}

// Format functions
const formatAmount = (amount: number) => {
  return `${amount.toLocaleString()} VND`;
};

const formatStatus = (status: string) => {
  const statusMap: { [key: string]: string } = {
    success: "Thành công",
    pending: "Đang chờ",
    failed: "Thất bại",
    cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

const formatDate = (dateString: string) => {
  return dayjs(dateString).format("DD/MM/YYYY HH:mm:ss");
};

const columns: { key: any; label: string; render?: (value: any, record: any) => any }[] = [
  { key: "id", label: "ID" },
  { key: "user_id", label: "ID Người dùng" },
  { key: "name", label: "Tên khách hàng" },
  { key: "email", label: "Email" },
  { 
    key: "amount", 
    label: "Số tiền",
    render: (value: number) => formatAmount(value)
  },
  { key: "payment_method", label: "Phương thức thanh toán" },
  { 
    key: "status", 
    label: "Trạng thái",
    render: (value: string) => formatStatus(value)
  },
  { 
    key: "created_at", 
    label: "Ngày tạo",
    render: (value: string) => formatDate(value)
  },
];

export default function ManagePayment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openModal, setOpenModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [offset, setOffset] = useState(Number(searchParams.get("offset")) || 0);
  const [quantity, setQuantity] = useState(
    Number(searchParams.get("quantity")) || 10
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorData, setErrorData] = useState("");
  const [payments, setPayments] = useState<PaymentsProps | undefined>(undefined);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
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

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: quantity,
        page: offset,
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.method = methodFilter;
      if (dateRange) {
        params.from = dateRange[0];
        params.to = dateRange[1];
      }

      const response = await getPayments(params);

      if (response?.data?.items?.length === 0) {
        setErrorData("Không có dữ liệu");
      } else {
        setErrorData("");
      }
      setPayments({
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
  }, [quantity, offset, search, statusFilter, methodFilter, dateRange]);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      fetchPayments()
        .then(() => {
          setLoading(false);
        })
        .catch((error) => {
          setErrorData(error.message);
          setLoading(false);
        });
    }, 1000);
  }, [quantity, offset]);

  const onEdit = async (item: IPayment) => {
    setFormFields([
      {
        name: "id",
        label: "ID",
        type: "text",
        initialValue: item.id,
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
        name: "amount",
        label: "Số tiền",
        type: "text",
        initialValue: `${item.amount.toLocaleString()} VND`,
        disabled: true,
      },
      {
        name: "payment_method",
        label: "Phương thức thanh toán",
        type: "text",
        initialValue: item.payment_method,
        disabled: true,
      },
      {
        name: "status",
        label: "Trạng thái",
        type: "select",
        placeholder: "Chọn trạng thái",
        initialValue: item.status,
        options: [
          { label: "Thành công", value: "completed" },
          { label: "Đang chờ", value: "pending" },
          { label: "Thất bại", value: "failed" }
        ],
      },
      {
        name: "created_at",
        label: "Ngày tạo",
        type: "text",
        initialValue: dayjs(item.created_at).format("DD/MM/YYYY HH:mm:ss"),
        disabled: true,
      },
    ]);
    setOpenModal(true);
  };

  const onDelete = async () => {
    // Không cho phép xóa payment, chỉ xem thông tin
    message.info("Không thể xóa thông tin thanh toán");
  };

  // Handle Payment Selection
  const getIds = (data: any) => {
    setSelectedIds(data);
  };

  const handleSubmitUpdatePayment = async () => {
    // Chỉ cho phép cập nhật trạng thái
    message.info("Cập nhật trạng thái thanh toán thành công");
    setOpenModal(false);
    fetchPayments();
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      fetchPayments();
    }
  };

  const handleSearch = () => {
    fetchPayments();
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleMethodChange = (value: string) => {
    setMethodFilter(value);
  };

  const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
    if (dates) {
      setDateRange(dateStrings);
    } else {
      setDateRange(null);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setMethodFilter("");
    setDateRange(null);
    setTimeout(() => {
      fetchPayments();
    }, 100);
  };


  return (
    <>
      <div className="">
        <PageMeta
          title="Quản lý thanh toán"
          description="Quản lý thanh toán của hệ thống"
        />
        <PageBreadcrumb pageTitle="Quản lý thanh toán" />
        
        <ComponentCard>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 mb-4">
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
              <Label htmlFor="statusFilter">Trạng thái</Label>
              <Select
                id="statusFilter"
                placeholder="Chọn trạng thái"
                value={statusFilter || undefined}
                onChange={handleStatusChange}
                allowClear
                className="w-full"
              >
                <Option value="completed">Thành công</Option>
                <Option value="pending">Đang chờ</Option>
                <Option value="failed">Thất bại</Option>
              </Select>
            </div>
            
            {/* <div>
              <Label htmlFor="methodFilter">Phương thức thanh toán</Label>
              <Select
                id="methodFilter"
                placeholder="Chọn phương thức"
                value={methodFilter || undefined}
                onChange={handleMethodChange}
                allowClear
                className="w-full"
              >
                <Option value="credit_card">Thẻ tín dụng</Option>
                <Option value="bank_transfer">Chuyển khoản</Option>
                <Option value="e_wallet">Ví điện tử</Option>
                <Option value="cash">Tiền mặt</Option>
              </Select>
            </div> */}
            
            <div>
              <Label htmlFor="dateRange">Khoảng thời gian</Label>
              <RangePicker
                id="dateRange"
                placeholder={["Từ ngày", "Đến ngày"]}
                format="YYYY-MM-DD"
                onChange={handleDateRangeChange}
                value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
                className="w-full"
              />
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
            title="Danh sách thanh toán"
            data={payments?.data ?? []}
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
            totalPages={payments?.pagination?.totalPages ?? 0}
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
        title="Chi tiết thanh toán"
        isOpen={openModal}
        isLoading={false}
        onSubmit={() => handleSubmitUpdatePayment()}
        onCancel={() => setOpenModal(false)}
        formFields={formFields}
      />
    </>
  );
}
