import PageBreadcrumb from "../common/PageBreadCrumb";
import PageMeta from "../common/PageMeta";
import ComponentCard from "../common/ComponentCard";
import ReusableTable from "../common/ReusableTable";
import { useState } from "react";
import { useSearchParams } from "react-router";

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
export default function ManageRole() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [offset, setOffset] = useState(Number(searchParams.get("offset")) || 0);
  const [openModal, setOpenModal] = useState(false);
  const [quantity, setQuantity] = useState(
    Number(searchParams.get("quantity")) || 20
  );
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
      <PageBreadcrumb pageTitle="Quản lý người dùng" />
      <ComponentCard title="Danh sách người dùng trong hệ thống">
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
      </ComponentCard>
    </div>
  );
}
