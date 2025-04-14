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
    point: null,
    phoneNumber: null,
    gender: null,
    email: null,
    birthday: null,
    background: null,
    avatar: null,
    active: "HOAT_DONG",
    createdAt: "2025-04-06T10:08:07.670+00:00",
    updatedAt: "2025-04-06T10:08:07.670+00:00",
    roles: [
      {
        id: 1,
        name: "ROLE_ADMIN",
        descRole: null,
        createdAt: "2025-04-03T12:46:07.197+00:00",
        updatedAt: "2025-04-03T12:46:07.197+00:00",
      },
    ],
  },
  {
    id: 9,
    username: "Mạnh Nguyễn",
    point: null,
    phoneNumber: "0559517003",
    gender: "NAM",
    email: "nguyenxuanmanh2992003@gmail.com",
    birthday: null,
    background: null,
    avatar:
      "https://res.cloudinary.com/dpbo17rbt/image/upload/v1743934627/QUAN_LY_TAI_FILE/wrug8xtry8drpvnhngbp.png",
    active: "HOAT_DONG",
    createdAt: "2025-04-06T10:16:39.642+00:00",
    updatedAt: "2025-04-06T10:17:06.891+00:00",
    roles: [
      {
        id: 2,
        name: "ROLE_USER",
        descRole: null,
        createdAt: "2025-04-03T12:46:07.213+00:00",
        updatedAt: "2025-04-03T12:46:07.213+00:00",
      },
    ],
  },
  {
    id: 10,
    username: "ZEN CODE",
    point: null,
    phoneNumber: null,
    gender: null,
    email: "code.zen.education@gmail.com",
    birthday: null,
    background: null,
    avatar:
      "https://lh3.googleusercontent.com/a/ACg8ocLrw9o6B41uVljrL9nhQB3BzGxX8akjeHwMe2PP8yoSXw62RhI=s96-c",
    active: "HOAT_DONG",
    createdAt: "2025-04-06T10:22:17.854+00:00",
    updatedAt: "2025-04-06T10:22:17.854+00:00",
    roles: [
      {
        id: 2,
        name: "ROLE_USER",
        descRole: null,
        createdAt: "2025-04-03T12:46:07.213+00:00",
        updatedAt: "2025-04-03T12:46:07.213+00:00",
      },
    ],
  },
  {
    id: 11,
    username: "toilamanh",
    point: null,
    phoneNumber: null,
    gender: null,
    email: "20210794@eaut.edu.vn",
    birthday: null,
    background: null,
    avatar: null,
    active: "HOAT_DONG",
    createdAt: "2025-04-06T13:38:25.664+00:00",
    updatedAt: "2025-04-06T13:39:10.013+00:00",
    roles: [
      {
        id: 2,
        name: "ROLE_USER",
        descRole: null,
        createdAt: "2025-04-03T12:46:07.213+00:00",
        updatedAt: "2025-04-03T12:46:07.213+00:00",
      },
    ],
  },
];
const columns: { key: any; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "username", label: "Tên người dùng" },
  { key: "phoneNumber", label: "Số điện thoại" },
  { key: "gender", label: "Giới tính" },
  { key: "email", label: "Email" },
  { key: "avatar", label: "Avatar" },
  { key: "background", label: "Ảnh bìa" },
  { key: "active", label: "Trạng thái" },
  { key: "createdAt", label: "Ngày tạo" },
  { key: "updatedAt", label: "Ngày cập nhật" },
];
export default function ManageResource() {
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
      <PageBreadcrumb pageTitle="Quản lý tài nguyên" />
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
            <Label htmlFor="inputTwo">
              Tìm kiếm theo định dạng tài nguyên{" "}
            </Label>
            <Input
              type="text"
              id="inputTwo"
              placeholder="Nhập vào định dạng tài nguyên..."
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
