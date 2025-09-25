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
    id: 1,
    folderName: "Tài liệu học lập trình",
    ownerId: 9, // liên kết với user
    description: "Chứa các slide, video, và bài tập về lập trình",
    isPublic: true,
    parentFolderId: null,
    createdAt: "2025-04-10T08:30:00.000+00:00",
    updatedAt: "2025-04-12T14:00:00.000+00:00",
    totalFiles: 12,
  },
  {
    id: 2,
    folderName: "Khóa học Spring Boot",
    ownerId: 10,
    description: "Tài liệu chuyên sâu về Spring Boot",
    isPublic: false,
    parentFolderId: null,
    createdAt: "2025-04-11T10:00:00.000+00:00",
    updatedAt: "2025-04-11T10:45:00.000+00:00",
    totalFiles: 8,
  },
  {
    id: 3,
    folderName: "Slide chương 1",
    ownerId: 10,
    description: "Slide bài giảng chương 1",
    isPublic: false,
    parentFolderId: 2, // thư mục con của "Khóa học Spring Boot"
    createdAt: "2025-04-11T11:00:00.000+00:00",
    updatedAt: "2025-04-11T11:10:00.000+00:00",
    totalFiles: 3,
  },
  {
    id: 4,
    folderName: "Tài liệu đồ án",
    ownerId: 11,
    description: null,
    isPublic: false,
    parentFolderId: null,
    createdAt: "2025-04-12T09:00:00.000+00:00",
    updatedAt: "2025-04-12T10:00:00.000+00:00",
    totalFiles: 5,
  },
];

// const columns: { key: any; label: string }[] = [
//   { key: "id", label: "ID" },
//   { key: "username", label: "Tên người dùng" },
//   { key: "phoneNumber", label: "Số điện thoại" },
//   { key: "gender", label: "Giới tính" },
//   { key: "email", label: "Email" },
//   { key: "avatar", label: "Avatar" },
//   { key: "background", label: "Ảnh bìa" },
//   { key: "active", label: "Trạng thái" },
//   { key: "createdAt", label: "Ngày tạo" },
//   { key: "updatedAt", label: "Ngày cập nhật" },
// ];

const columns = [
  { key: "id", label: "ID" },
  { key: "folderName", label: "Tên thư mục" },
  { key: "ownerId", label: "Chủ sở hữu" },
  { key: "description", label: "Mô tả" },
  { key: "isPublic", label: "Công khai" },
  { key: "parentFolderId", label: "Thư mục cha" },
  { key: "totalFiles", label: "Số lượng file" },
  { key: "createdAt", label: "Ngày tạo" },
  { key: "updatedAt", label: "Ngày cập nhật" },
];

export default function ManageFolder() {
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
      <PageBreadcrumb pageTitle="Quản lý danh mục" />
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
      <ComponentCard title="Danh sách các danh mục có trong hệ thống">
        <div className=" grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <Label htmlFor="inputTwo">Tìm kiếm theo tên danh mục </Label>
            <Input
              type="text"
              id="inputTwo"
              placeholder="Nhập vào tên danh mục..."
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
