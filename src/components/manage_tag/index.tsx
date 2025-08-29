import PageBreadcrumb from "../common/PageBreadCrumb";
import PageMeta from "../common/PageMeta";
import ComponentCard from "../common/ComponentCard";
import ReusableTable from "../common/ReusableTable";
import { useCallback, useEffect, useState, KeyboardEvent } from "react";
import { useSearchParams } from "react-router";
import { getTags, createTag, updateTag, deleteTag, Tag, CreateTagResponse, UpdateTagResponse, DeleteTagResponse } from "../../services/tag";
import Pagination from "../pagination";
import FormModal from "../common/FormModal";
import { IoIosAdd } from "react-icons/io";
import { Input, message } from "antd";
import Label from "../form/Label";

const columns: { key: any; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Tên tag" },
];

export default function ManageTag() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openModal, setOpenModal] = useState(false);
  const [openModalAdd, setOpenModalAdd] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 0);
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 5);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorData, setErrorData] = useState("");
  const [tags, setTags] = useState<any>(undefined);
  const [search, setSearch] = useState<string>("");
  const [formFields, setFormFields] = useState<any[]>([]);
  const [formFieldsAddTag, setFormFieldsAddTag] = useState<any[]>([]);

  // Set default value of limit và page if do not have
  useEffect(() => {
    if (!searchParams.get("limit") || !searchParams.get("page")) {
      setSearchParams((prev: any) => {
        const newParams = new URLSearchParams(prev);
        if (!newParams.get("limit")) newParams.set("limit", "5");
        if (!newParams.get("page")) newParams.set("page", "1");
        return newParams;
      });
    }
  }, [searchParams, setSearchParams]);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getTags(page, limit, search);
      if (response?.data?.tags?.length === 0) {
        setError("Không có dữ liệu");
      } else {
        setError("");
      }
      setTags(response);

      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("limit", limit.toString());
        newParams.set("page", page.toString());
        return newParams;
      });
    } catch (error) {
      const axiosError = error as Error;
      setError(axiosError.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      fetchTags()
        .then(() => {
          setLoading(false);
        })
        .catch((error) => {
          setErrorData(error.message);
          setLoading(false);
        });
    }, 1000);
  }, [page, limit]);

  const onEdit = async (item: Tag) => {
    setFormFields([
      {
        name: "id",
        label: "ID",
        type: "text",
        initialValue: item.id,
        disabled: true,
      },
      {
        name: "name",
        label: "Tên tag",
        type: "text",
        placeholder: "Nhập tên tag",
        initialValue: item.name,
        rules: [
          { required: true, message: "Vui lòng nhập tên tag!" },
          { min: 2, message: "Tên tag phải có ít nhất 2 ký tự!" },
          { max: 50, message: "Tên tag không được vượt quá 50 ký tự!" },
        ],
      },
    ]);
    setOpenModal(!openModal);
  };

  const onDelete = async (id: string | number) => {
    setLoading(true);
    try {
      const response = await deleteTag(Number(id)) as DeleteTagResponse;
      if (response.statusCode === 200) {
        message.success("Xóa tag thành công");
      } else {
        message.error("Tag không tồn tại. Vui lòng thử lại!");
      }
    } catch (error) {
      const axiosError = error as Error;
      setError(axiosError.message);
    } finally {
      fetchTags();
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  };

  const getIds = (data: any) => {
    setSelectedIds(data);
  };

  const handleSubmitUpdateTag = async (data: any) => {
    const response = await updateTag(data.id, data) as UpdateTagResponse;
    if (response.statusCode === 200) {
      message.success("Cập nhật tag thành công");
      fetchTags();
    } else {
      message.error("Cập nhật tag thất bại. Vui lòng thử lại!");
    }
    setOpenModal(false);
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (search.trim() !== "") {
        fetchTags();
      } else {
        setSearch("");
        fetchTags();
      }
    }
  };

  const handleAddTag = async (data: any) => {
    setLoading(true);
    const response = await createTag(data) as CreateTagResponse;
    if (response.statusCode === 201) {
      message.success("Thêm tag thành công");
      fetchTags();
    } else {
      message.error("Thêm tag thất bại. Vui lòng thử lại!");
    }
    setTimeout(() => {
      setOpenModalAdd(false);
      setLoading(false);
    }, 1000);
  };

  const handleShowModalAddTag = () => {
    setFormFieldsAddTag([
      {
        name: "name",
        label: "Tên tag",
        type: "text",
        placeholder: "Nhập tên tag",
        rules: [
          { required: true, message: "Vui lòng nhập tên tag!" },
          { min: 2, message: "Tên tag phải có ít nhất 2 ký tự!" },
          { max: 50, message: "Tên tag không được vượt quá 50 ký tự!" },
        ],
      },
    ]);
    setOpenModalAdd(!openModalAdd);
  };

  return (
    <>
      <div className="">
        <PageMeta
          title="Quản lý Tag"
          description="Trang quản lý tag"
        />
        <PageBreadcrumb pageTitle="Quản lý tag" />
        <div className="flex justify-end mb-4">
          <button
            onClick={handleShowModalAddTag}
            className="flex items-center dark:bg-black dark:text-white gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50">
            <IoIosAdd size={24} />
            Thêm
          </button>
        </div>
        <ComponentCard>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <Label htmlFor="inputTwo">Tìm kiếm theo tên tag</Label>
              <Input
                type="text"
                id="inputTwo"
                placeholder="Nhập vào tên tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
          <ReusableTable
            error={errorData}
            title="Danh sách tag"
            data={tags?.data?.tags ?? []}
            columns={columns}
            onEdit={onEdit}
            onDelete={onDelete}
            isLoading={loading}
            onCheck={(selectedIds) => getIds(selectedIds)}
            setSelectedIds={setSelectedIds}
            selectedIds={selectedIds}
          />

          <Pagination
            limit={limit}
            offset={page}
            totalPages={tags?.data?.pagination?.totalPages ?? 0}
            onPageChange={(newLimit, newPage) => {
              setLimit(newLimit);
              setPage(newPage);
            }}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </ComponentCard>
      </div>
      <FormModal
        title="Cập nhật thông tin tag"
        isOpen={openModal}
        isLoading={false}
        onSubmit={(data) => handleSubmitUpdateTag(data)}
        onCancel={() => setOpenModal(false)}
        formFields={formFields}
      />
      <FormModal
        title="Thêm tag"
        isOpen={openModalAdd}
        isLoading={false}
        onSubmit={(data) => handleAddTag(data)}
        onCancel={() => setOpenModalAdd(false)}
        formFields={formFieldsAddTag ?? []}
      />
    </>
  );
}
