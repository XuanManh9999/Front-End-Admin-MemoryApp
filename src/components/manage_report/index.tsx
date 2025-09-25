import PageBreadcrumb from "../common/PageBreadCrumb";
import PageMeta from "../common/PageMeta";
import ComponentCard from "../common/ComponentCard";
import ReusableTable from "../common/ReusableTable";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Input } from "antd";
import Pagination from "../pagination";
import Label from "../form/Label";
import { IoIosAdd } from "react-icons/io";

const data = [
  {
    id: 8,
    username: "admin",
    totalCourses: 0,
    completedCourses: 0,
    totalLearningTime: 0, // giờ
    averageRating: null,
    lastLogin: "2025-04-15T12:10:00.000+00:00",
  },
  {
    id: 9,
    username: "Nguyễn Văn A",
    totalCourses: 6,
    completedCourses: 4,
    totalLearningTime: 35.5,
    averageRating: 4.6,
    lastLogin: "2025-04-16T08:45:00.000+00:00",
  },
  {
    id: 10,
    username: "Nguyễn Văn B",
    totalCourses: 3,
    completedCourses: 1,
    totalLearningTime: 12.25,
    averageRating: 4.2,
    lastLogin: "2025-04-15T21:30:00.000+00:00",
  },
  {
    id: 11,
    username: "Nguyễn Văn C",
    totalCourses: 5,
    completedCourses: 5,
    totalLearningTime: 40.0,
    averageRating: 4.9,
    lastLogin: "2025-04-16T07:10:00.000+00:00",
  },
];
const columns: { key: any; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "username", label: "Tên người dùng" },
  { key: "totalCourses", label: "Số tài nguyên đã tải xuống" },
  { key: "completedCourses", label: "Số lượng tài nguyên đã tải lên" },
  { key: "totalLearningTime", label: "Tổng thời gian hoạt động (giờ)" },
  { key: "averageRating", label: "Điểm đánh giá trung bình" },
  { key: "lastLogin", label: "Lần đăng nhập gần nhất" },
];
export default function ManageReport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [offset, setOffset] = useState(Number(searchParams.get("offset")) || 0);
  const [openModal, setOpenModal] = useState(false);
  const [quantity, setQuantity] = useState(
    Number(searchParams.get("quantity")) || 20
  );

  // Set default value of quantity và offset if do not have
  useEffect(() => {
    if (!searchParams.get("limit") || !searchParams.get("offset")) {
      setSearchParams((prev: any) => {
        const newParams = new URLSearchParams(prev);
        if (!newParams.get("limit")) newParams.set("limit", "5");
        if (!newParams.get("offset")) newParams.set("offset", "0");
        return newParams;
      });
    }
  }, [searchParams, setSearchParams]);
  // const [type, setType] = useState<ITypeNumber | undefined>(undefined);
  // const [types, setTypes] = useState<ITypeNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorData, setErrorData] = useState("");

  const onEdit = (item: any) => {};
  const onDelete = (id: string) => {};

  return (
    <div className="">
      <PageMeta
        title="React.js Blank Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Blank Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Quản lý báo cáo" />
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            // handleShowModalAddUser
          }}
          className="flex items-center dark:bg-black dark:text-white  gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50">
          <IoIosAdd size={24} />
          Thêm
        </button>
      </div>
      <ComponentCard title="Danh sách các tài nguyên có trong hệ thống">
        <div className=" grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <Label htmlFor="inputTwo">Tìm kiếm</Label>
            <Input
              type="text"
              id="inputTwo"
              placeholder="Nhập vào tên báo cáo..."
              value={""}
              onChange={(e) => {
                // setSearch(e.target.value)
              }}
              onKeyDown={() => {
                //handleKeyDown;
              }}
            />
          </div>
        </div>
        <ReusableTable
          error={errorData}
          title="Danh sách số điện thoại"
          data={data}
          columns={columns}
          onEdit={onEdit}
          onDelete={onDelete}
          isLoading={loading}
          onEdit={(item) => {
            // setType(item);
            // setOpenModal(!openModal);
          }}
          isLoading={loading}
          onDelete={(id) => handleDelete(String(id))}
        />

        <Pagination
          limit={quantity}
          offset={offset ?? 1}
          totalPages={1}
          onPageChange={(limit, newOffset) => {
            //
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
  );
}
