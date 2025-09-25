import PageBreadcrumb from "../common/PageBreadCrumb";
import PageMeta from "../common/PageMeta";
import ComponentCard from "../common/ComponentCard";
import ReusableTable from "../common/ReusableTable";
import { useCallback, useEffect, useState, KeyboardEvent, useMemo } from "react";
import { useSearchParams } from "react-router";
import { getCategories, createCategory, updateCategory, deleteCategory, Category } from "../../services/category";
import Pagination from "../pagination";
import FormModal from "../common/FormModal";
import { IoIosAdd } from "react-icons/io";
import { Input, message, Upload, Image } from "antd";
import Label from "../form/Label";
import type { UploadProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';

const columns: { key: any; label: string; render?: (value: any, record: any) => React.ReactNode }[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Tên danh mục" },
  { key: "description", label: "Mô tả" },
  { 
    key: "img", 
    label: "Hình ảnh",
    render: (value: string) => (
      <div className="w-20 h-20">
        <Image
          src={value}
          alt="Category"
          className="w-full h-full object-cover rounded"
          preview={{
            mask: <div className="text-white">Xem</div>
          }}
        />
      </div>
    )
  },
  { key: "parent_id", label: "Danh mục cha" },
];

export default function ManageCategory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openModal, setOpenModal] = useState(false);
  const [openModalAdd, setOpenModalAdd] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 0);
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 10);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorData, setErrorData] = useState("");
  const [categories, setCategories] = useState<any>(undefined);
  const [search, setSearch] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<RcFile | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<Category | null>(null);

  // Upload handler cho modal thêm mới
  const handleAddUpload = (file: RcFile) => {
    console.log("=== CATEGORY BEFORE UPLOAD ===");
    console.log("File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Bạn chỉ có thể tải lên file hình ảnh!');
      return false;
    }
    
    // Lưu file vào state
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const previewUrl = reader.result as string;
      setPreviewImage(previewUrl);
    };
    reader.readAsDataURL(file);
    
    // File đã được chọn thành công
    console.log("File selected successfully:", file.name);
    message.success(`✅ Đã chọn ảnh: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    console.log("=== END CATEGORY BEFORE UPLOAD ===");
    return false; // Ngăn upload thực sự
  };

  // Upload handler cho modal chỉnh sửa
  const handleEditUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Bạn chỉ có thể tải lên file hình ảnh!');
      return false;
    }
    
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const previewUrl = reader.result as string;
      setPreviewImage(previewUrl);
    };
    reader.readAsDataURL(file);
    return false;
  };

  // Upload props cho modal thêm
  const addUploadProps: UploadProps = {
    beforeUpload: handleAddUpload,
    showUploadList: false,
  };

  // Upload props cho modal chỉnh sửa
  const editUploadProps: UploadProps = {
    beforeUpload: handleEditUpload,
    showUploadList: false,
  };

  // Form fields cho edit - STABLE, không thay đổi
  const editFormFields = useMemo(() => {
    if (!currentEditItem) return [];
    return [
      {
        name: "id",
        label: "ID",
        type: "text" as const,
        initialValue: currentEditItem.id,
        disabled: true,
      },
      {
        name: "name",
        label: "Tên danh mục",
        type: "text" as const,
        placeholder: "Nhập tên danh mục",
        initialValue: currentEditItem.name,
        rules: [
          { required: true, message: "Vui lòng nhập tên danh mục!" },
          { min: 2, message: "Tên danh mục phải có ít nhất 2 ký tự!" },
        ],
      },
      {
        name: "description",
        label: "Mô tả",
        type: "textarea" as const,
        placeholder: "Nhập mô tả danh mục",
        initialValue: currentEditItem.description,
       
      },
      {
        name: "image",
        label: "Hình ảnh",
        type: "upload" as const,
        uploadProps: editUploadProps,
        previewImage: previewImage || currentEditItem.img || "",
      },
      {
        name: "parent_id",
        label: "Danh mục cha (không bắt buộc)",
        type: "select" as const,
        placeholder: "Chọn danh mục cha",
        initialValue: currentEditItem.parent_id?.toString(),
        allowClear: true,
        options: [
          { label: "Không có danh mục cha", value: "" },
          ...(categories?.categories || [])
            .filter((cat: Category) => cat.id !== currentEditItem.id)
            .map((cat: Category) => ({
              label: cat.name,
              value: cat.id.toString(),
            }))
        ],
      },
    ];
  }, [currentEditItem, categories, previewImage, editUploadProps]);

  // Form fields cho add - FormModal đã được tối ưu để không reset form
  const addFormFields = useMemo(() => {
    const baseFields = [
      {
        name: "name",
        label: "Tên danh mục",
        type: "text" as const,
        placeholder: "Nhập tên danh mục",
        rules: [
          { required: true, message: "Vui lòng nhập tên danh mục!" },
          { min: 2, message: "Tên danh mục phải có ít nhất 2 ký tự!" },
        ],
      },
      {
        name: "description",
        label: "Mô tả",
        type: "textarea" as const,
        placeholder: "Nhập mô tả danh mục",
        
      },
      {
        name: "image",
        label: "Hình ảnh",
        type: "upload" as const,
        uploadProps: addUploadProps,
        previewImage: previewImage,
        // Không cần validation ở đây, sẽ validate trong handleAddCategory
      },
      {
        name: "parent_id",
        label: "Danh mục cha (không bắt buộc)",
        type: "select" as const,
        placeholder: "Chọn danh mục cha",
        allowClear: true,
        options: [
          { label: "Không có danh mục cha", value: "" },
          ...(categories?.categories || []).map((cat: Category) => ({
            label: cat.name,
            value: cat.id.toString(),
          }))
        ],
      },
    ];
    
    return baseFields;
  }, [categories?.categories, previewImage]); // Thêm lại previewImage nhưng FormModal đã được tối ưu

  useEffect(() => {
    if (!searchParams.get("limit") || !searchParams.get("page")) {
      setSearchParams((prev: any) => {
        const newParams = new URLSearchParams(prev);
        if (!newParams.get("limit")) newParams.set("limit", "10");
        if (!newParams.get("page")) newParams.set("page", "0");
        return newParams;
      });
    }
  }, [searchParams, setSearchParams]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCategories(page, limit, search);
      if (response?.data?.categories?.length === 0) {
        setError("Không có dữ liệu");
      } else {
        setError("");
      }
      setCategories(response.data);

      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("limit", limit.toString());
        newParams.set("page", page.toString());
        return newParams;
      });
    } catch (error: any) {
      setError(error?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onEdit = async (item: Category) => {
    setCurrentEditItem(item);
    setSelectedFile(null);
    setPreviewImage(item.img || "");
    setOpenModal(true);
  };

  const onDelete = async (id: number) => {
    try {
      const response = await deleteCategory(id);
      if (response.statusCode === 200) {
        message.success("Xóa danh mục thành công");
        fetchCategories();
      }
    } catch (error: any) {
      message.error(error?.message || "Xóa danh mục thất bại");
    }
  };

  const handleSubmitUpdateCategory = async (data: any) => {
    try {
      setSubmitLoading(true);
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      if (data.parent_id) {
        formData.append('parent_id', data.parent_id);
      }

      const response = await updateCategory(data.id, formData);

      if (response.statusCode === 200) {
        message.success("Cập nhật danh mục thành công");
        fetchCategories();
        setOpenModal(false);
        setSelectedFile(null);
        setPreviewImage("");
        setCurrentEditItem(null);
      }
    } catch (error: any) {
      message.error(error?.message || "Cập nhật danh mục thất bại");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      fetchCategories();
    }
  };

  const handleAddCategory = async (data: any) => {
    console.log("=== HANDLE ADD CATEGORY START ===");
    console.log("Form data:", data);
    console.log("Selected file from state:", selectedFile);
    console.log("Preview image:", previewImage);
    
    // QUAN TRỌNG: Kiểm tra file trước khi submit form
    if (!selectedFile) {
      console.error("No file selected in state");
      message.error("Vui lòng chọn hình ảnh cho danh mục");
      return; // Dừng ngay, không submit form
    }

    if (!selectedFile || !(selectedFile instanceof File)) {
      console.error("File validation failed:", {
        hasFile: !!selectedFile,
        isInstance: selectedFile ? (selectedFile as any) instanceof File : false,
        type: typeof selectedFile
      });
      message.error("File không được nhận diện đúng cách! Vui lòng thử chọn lại file.");
      return; // Dừng ngay, không submit form
    }

    try {
      setSubmitLoading(true);

      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('file', selectedFile);
      if (data.parent_id) {
        formData.append('parent_id', data.parent_id);
      }

      console.log("Sending formData with file:", selectedFile.name);
      const response = await createCategory(formData);
      
      console.log("Create category response:", response);

      if (response.statusCode === 201) {
        message.success("Thêm danh mục thành công");
        fetchCategories();
        setOpenModalAdd(false);
        setSelectedFile(null);
        setPreviewImage("");
      } else {
        console.error("Create category failed:", response);
        message.error(response?.message || "Thêm danh mục thất bại");
      }
    } catch (error: any) {
      message.error(error?.message || "Thêm danh mục thất bại");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleShowModalAddCategory = () => {
    console.log("=== SHOW MODAL ADD CATEGORY ===");
    console.log("Resetting states...");
    
    setCurrentEditItem(null);
    setSelectedFile(null);
    setPreviewImage("");
    setOpenModalAdd(true);
    
    console.log("Modal opened for adding category");
  };

  return (
    <>
      <div className="">
        <PageMeta
          title="Quản lý Danh mục | Admin Dashboard"
          description="Trang quản lý danh mục cho Admin Dashboard"
        />
        <PageBreadcrumb pageTitle="Quản lý danh mục" />
        <div className="flex justify-end mb-4">
          <button
            onClick={handleShowModalAddCategory}
            className="flex items-center dark:bg-black dark:text-white gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50">
            <IoIosAdd size={24} />
            Thêm
          </button>
        </div>
        <ComponentCard>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <Label htmlFor="inputTwo">Tìm kiếm theo tên danh mục</Label>
              <Input
                type="text"
                id="inputTwo"
                placeholder="Nhập vào tên danh mục..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
          <ReusableTable
            error={errorData}
            title="Danh sách danh mục"
            data={categories?.categories ?? []}
            columns={columns}
            onEdit={onEdit}
            onDelete={(id: string | number) => onDelete(Number(id))}
            isLoading={loading}
            onCheck={(selectedIds) => setSelectedIds(selectedIds.map(id => Number(id)))}
            setSelectedIds={setSelectedIds}
            selectedIds={selectedIds}
          />

          <Pagination
            limit={limit}
            offset={page}
            totalPages={Math.ceil((categories?.pagination?.total || 0) / limit)}
            onPageChange={(newLimit, newPage) => {
              setLimit(newLimit);
              setPage(newPage);
            }}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(0);
            }}
          />
        </ComponentCard>
      </div>
      <FormModal
        title="Cập nhật thông tin danh mục"
        isOpen={openModal}
        isLoading={submitLoading}
        onSubmit={handleSubmitUpdateCategory}
        onCancel={() => {
          setOpenModal(false);
          setPreviewImage("");
          setSelectedFile(null);
        }}
        formFields={editFormFields}
      />
      <FormModal
        title="Thêm danh mục"
        isOpen={openModalAdd}
        isLoading={submitLoading}
        onSubmit={handleAddCategory}
        onCancel={() => {
          setOpenModalAdd(false);
          setPreviewImage("");
          setSelectedFile(null);
        }}
        formFields={addFormFields}
      />
      <Image
        style={{ display: 'none' }}
        src={previewImage}
        preview={{
          visible: previewOpen,
          onVisibleChange: (visible) => setPreviewOpen(visible),
        }}
      />
    </>
  );
}
