import PageBreadcrumb from "../common/PageBreadCrumb";
import PageMeta from "../common/PageMeta";
import ComponentCard from "../common/ComponentCard";
import ReusableTable from "../common/ReusableTable";
import { useCallback, useEffect, useState, KeyboardEvent } from "react";
import { useSearchParams } from "react-router";
import { Input, message, Modal, Button, List, Checkbox, Select } from "antd";
import Pagination from "../pagination";
import Label from "../form/Label";
import { IoIosAdd } from "react-icons/io";
import { FiUsers, FiFolder, FiPlus, FiMinus } from "react-icons/fi";
import FormModal from "../common/FormModal";
import { 
  getCollections,
  createCollection, 
  updateCollection, 
  deleteCollection,
  getCollectionById,
  addResourcesToCollection,
  removeResourcesFromCollection,
  Collection,
  CollectionUpdate,
  CollectionFilters
} from "../../services/collection";
import { getResources } from "../../services/resource";
import { getUsers } from "../../services/user";

// Interfaces
interface CollectionsResponse {
  statusCode: number;
  message: string;
  data: {
    collections: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

const columns: { key: any; label: string; render?: (value: any, record: any) => React.ReactNode }[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Tên collection" },
  { key: "description", label: "Mô tả" },
  { key: "resources_count", label: "Số tài nguyên" },
  { key: "owner_username", label: "Người tạo" },
  { 
    key: "recent_resources", 
    label: "Tài nguyên gần đây",
    render: (_, record: any) => {
      if (!record.recent_resources || record.recent_resources.length === 0) {
        return <span className="text-gray-400 italic">Chưa có tài nguyên</span>;
      }
      return (
        <div className="max-w-xs">
          {record.recent_resources.slice(0, 2).map((res: any) => (
            <div key={res.id} className="text-xs mb-1">
              <span className="font-medium">{res.title}</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                res.file_type === 'image' ? 'bg-blue-100 text-blue-600' :
                res.file_type === 'pdf' ? 'bg-red-100 text-red-600' :
                res.file_type === 'video' ? 'bg-purple-100 text-purple-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {res.file_type}
              </span>
            </div>
          ))}
          {record.recent_resources.length > 2 && (
            <span className="text-xs text-gray-400">
              +{record.recent_resources.length - 2} khác
            </span>
          )}
        </div>
      );
    }
  },
  { 
    key: "created_at", 
    label: "Ngày tạo",
    render: (value: any) => new Date(value).toLocaleDateString('vi-VN')
  },
];

export default function ManageCollection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [offset, setOffset] = useState(Number(searchParams.get("offset")) || 0);
  const [quantity, setQuantity] = useState(Number(searchParams.get("quantity")) || 5);
  
  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [openModalAdd, setOpenModalAdd] = useState(false);
  const [openResourceModal, setOpenResourceModal] = useState(false);
  
  // Data states
  const [loading, setLoading] = useState<boolean>(false);
  const [errorData, setErrorData] = useState("");
  const [collections, setCollections] = useState<CollectionsResponse | undefined>(undefined);
  
  // Filter states
  const [search, setSearch] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("");
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // User data for filter dropdown
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  
  // Categories data for resource filter (removed as filters were simplified)
  // const [categories, setCategories] = useState<any[]>([]);
  // const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
  
  // Form states
  const [formFields, setFormFields] = useState<any[]>([]);
  const [formFieldsAdd, setFormFieldsAdd] = useState<any[]>([]);
  
  // Resource management states
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [availableResources, setAvailableResources] = useState<any[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<number[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  
  // Available resources filter states
  const [resourceSearch, setResourceSearch] = useState<string>("");
  const [resourceFileType, setResourceFileType] = useState<string>("");
  const [resourceCategory, setResourceCategory] = useState<string>("");
  const [resourcePlan, setResourcePlan] = useState<string>("");
  const [resourceStatus, setResourceStatus] = useState<string>("");
  const [resourcePage, setResourcePage] = useState<number>(0);
  const [resourcePagination, setResourcePagination] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Handle selection
  const getIds = (data: any) => {
    setSelectedIds(data);
  };

  // Fetch users for dropdown
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const response = await getUsers({ page: 1, limit: 100 });
      if (response?.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Fetch categories function removed as filters were simplified

  // Set default URL params
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

  // Fetch collections
  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const filters: CollectionFilters = {
        search: search.trim(),
        user_id: userFilter,
      };

      const response = await getCollections(
        { page: offset, limit: quantity },
        filters
      );

      // Check if response has data
      if (!response?.data?.collections || response.data.collections.length === 0) {
        setErrorData("Không có dữ liệu");
      } else {
        setErrorData("");
      }
      setCollections(response);

      // Update URL params
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("limit", String(quantity));
        newParams.set("offset", String(offset));
        return newParams;
      });
    } catch (error) {
      const axiosError = error as Error;
      setErrorData(axiosError.message);
    } finally {
      setLoading(false);
    }
  }, [offset, quantity, search, userFilter]);

  // Initial data fetch
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      fetchCollections()
        .then(() => {
          setLoading(false);
        })
        .catch((error) => {
          setErrorData(error.message);
          setLoading(false);
        });
    }, 1000);
  }, [quantity, offset]);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search
  const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      fetchCollections();
    }
  };

  // Handle create collection
  const handleShowModalAdd = () => {
    setFormFieldsAdd([
      {
        name: "name",
        label: "Tên collection",
        type: "text",
        placeholder: "Nhập tên collection",
        rules: [
          { required: true, message: "Vui lòng nhập tên collection!" },
          { min: 3, message: "Tên collection phải có ít nhất 3 ký tự!" }
        ],
      },
      {
        name: "description",
        label: "Mô tả",
        type: "textarea",
        placeholder: "Nhập mô tả collection",
      }
    ]);
    setOpenModalAdd(true);
  };

  const handleAddCollection = async (data: any) => {
    setLoading(true);
    try {
      const collectionData: Collection = {
        name: data.name,
        description: data.description,
      };

      const response = await createCollection(collectionData);
      
      if (response?.message || response?.statusCode === 200 || response?.statusCode === 201) {
        message.success(response?.message || "Thêm collection thành công");
        fetchCollections();
        setOpenModalAdd(false);
      } else {
        message.error(response?.message || "Thêm collection thất bại. Vui lòng thử lại!");
      }
    } catch (error: any) {
      console.error("Error creating collection:", error);
      message.error(error?.message || "Thêm collection thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit collection
  const onEdit = async (item: any) => {
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
        label: "Tên collection",
        type: "text",
        placeholder: "Nhập tên collection",
        initialValue: item.name,
        rules: [
          { required: true, message: "Vui lòng nhập tên collection!" },
          { min: 3, message: "Tên collection phải có ít nhất 3 ký tự!" }
        ],
      },
      {
        name: "description",
        label: "Mô tả",
        type: "textarea",
        placeholder: "Nhập mô tả collection",
        initialValue: item.description,
      },
      {
        name: "statistics",
        label: "Thống kê",
        type: "textarea",
        initialValue: [
          `📊 Số tài nguyên: ${item.resources_count || 0}`,
          `👤 Người tạo: ${item.owner_username || 'Unknown'}`,
          `📧 Email: ${item.owner_email || 'No email'}`,
          `📅 Ngày tạo: ${new Date(item.created_at).toLocaleDateString('vi-VN')}`,
        ].join("\n"),
        disabled: true,
      },
      {
        name: "recent_resources",
        label: "Tài nguyên gần đây",
        type: "textarea",
        initialValue: item.recent_resources?.length > 0 
          ? item.recent_resources.map((res: any) => 
              `• ${res.title} (${res.file_type})`
            ).join("\n")
          : "Chưa có tài nguyên nào",
        disabled: true,
      }
    ]);
    setOpenModal(true);
  };

  const handleUpdateCollection = async (data: any) => {
    setLoading(true);
    try {
      const collectionData: CollectionUpdate = {
        name: data.name,
        description: data.description,
      };

      const response = await updateCollection(data.id, collectionData);
      
      if (response?.message || response?.statusCode === 200) {
        message.success(response?.message || "Cập nhật collection thành công");
        fetchCollections();
        setOpenModal(false);
      } else {
        message.error(response?.message || "Cập nhật collection thất bại. Vui lòng thử lại!");
      }
    } catch (error: any) {
      console.error("Error updating collection:", error);
      message.error(error?.message || "Cập nhật collection thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete collection
  const onDelete = async (id: number | string) => {
    setLoading(true);
    try {
      const response = await deleteCollection(Number(id));
      
      if (response?.statusCode == 200) {
        message.success(response?.message || "Xóa collection thành công");
        fetchCollections();
      } else {
        message.error(response?.error || response?.message || "Xóa collection thất bại. Vui lòng thử lại!");
      }
    } catch (error: any) {
      console.error("Error deleting collection:", error);
      message.error(error?.message || "Xóa collection thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Fetch available resources with filters
  const fetchAvailableResources = useCallback(async (collectionId: number) => {
    setResourceLoading(true);
    try {
      // Get collection details with resources
      const [collectionDetails, allResources] = await Promise.all([
        getCollectionById(collectionId),
        getResources(
          { page: resourcePage, limit: 20 }, 
          { 
            search: resourceSearch,
            file_type: resourceFileType,
            category_id: resourceCategory,
            plan: resourcePlan,
            status: resourceStatus
          }
        )
      ]);

      // Get resources not in this collection
      const collectionResources = collectionDetails?.data?.resources || [];
      const resourcesInCollection = collectionResources.map((r: any) => r.id) || [];
      
      console.log("Collection details after fetch:", collectionDetails);
      console.log("Resources in collection:", collectionResources);
      
      // Handle complex nested structure for allResources
      let allResourcesList = [];
      let pagination = null;
      
      if (allResources?.data?.resources?.resources) {
        allResourcesList = allResources.data.resources.resources;
        pagination = allResources.data.resources.pagination;
      } else if (allResources?.data?.resources) {
        allResourcesList = allResources.data.resources;
        pagination = allResources.data.pagination;
      }
      
      const availableRes = allResourcesList.filter((r: any) => 
        !resourcesInCollection.includes(r.id)
      );

      setAvailableResources(availableRes);
      setResourcePagination(pagination);
      
      return { collectionDetails, availableRes };
    } catch (error: any) {
      console.error("Error loading resources:", error);
      message.error("Không thể tải danh sách tài nguyên");
      setAvailableResources([]);
      setResourcePagination(null);
      return { collectionDetails: null, availableRes: [] };
    } finally {
      setResourceLoading(false);
    }
  }, [resourcePage, resourceSearch, resourceFileType, resourceCategory, resourcePlan, resourceStatus]);

  // Refresh collection details only
  const refreshCollectionDetails = useCallback(async (collectionId: number) => {
    try {
      const collectionDetails = await getCollectionById(collectionId);
      console.log("Refreshed collection details:", collectionDetails);
      setSelectedCollection((prev: any) => ({
        ...prev,
        details: collectionDetails
      }));
      setRefreshTrigger(prev => prev + 1); // Force re-render
      return collectionDetails;
    } catch (error: any) {
      console.error("Error refreshing collection details:", error);
      return null;
    }
  }, []);

  // Handle resource management
  const handleManageResources = async (collection: any) => {
    setSelectedCollection(collection);
    setOpenResourceModal(true);
    
    // Reset filters
    setResourceSearch("");
    setResourceFileType("");
    setResourceCategory("");
    setResourcePlan("");
    setResourceStatus("");
    setResourcePage(0);
    setSelectedResourceIds([]);
    
    const { collectionDetails } = await fetchAvailableResources(collection.id);
    setSelectedCollection({...collection, details: collectionDetails});
  };

  // Auto-fetch resources when filters change (with debounce)
  useEffect(() => {
    if (selectedCollection && openResourceModal) {
      const timeoutId = setTimeout(() => {
        fetchAvailableResources(selectedCollection.id);
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [resourcePage, resourceFileType, resourceCategory, resourcePlan, resourceStatus, selectedCollection, openResourceModal, fetchAvailableResources]);

  // Add resources to collection
  const handleAddResources = async () => {
    if (selectedResourceIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một tài nguyên");
      return;
    }

    setResourceLoading(true);
    try {
      const response = await addResourcesToCollection(selectedCollection.id, {
        resource_ids: selectedResourceIds
      });
      console.log("Check response:", response);
      
      if (response?.statusCode == 200) {
        message.success(response.message);
        setSelectedResourceIds([]);
        // Refresh collection details first
        await refreshCollectionDetails(selectedCollection.id);
        // Then refresh available resources (this will filter out newly added resources)
        await fetchAvailableResources(selectedCollection.id);
        // Update main collections list
        fetchCollections();
      } else {
        message.error("Thêm tài nguyên thất bại");
      }
    } catch (error: any) {
      console.error("Error adding resources:", error);
      message.error(error?.message || "Thêm tài nguyên thất bại");
    } finally {
      setResourceLoading(false);
    }
  };

  // Remove resources from collection
  const handleRemoveResources = async (resourceIds: number[]) => {
    if (resourceIds.length === 0) return;

    setResourceLoading(true);
    try {
      const response = await removeResourcesFromCollection(selectedCollection.id, resourceIds);

      if (response?.statusCode   == 200) {
        message.success(response.message);
        // Refresh collection details first
        await refreshCollectionDetails(selectedCollection.id);
        // Then refresh available resources (removed resources will now be available)
        await fetchAvailableResources(selectedCollection.id);
        // Update main collections list
        fetchCollections();
      } else {
        message.error("Xóa tài nguyên thất bại");
      }
    } catch (error: any) {
      console.error("Error removing resources:", error);
      message.error(error?.message || "Xóa tài nguyên thất bại");
    } finally {
      setResourceLoading(false);
    }
  };

  return (
    <>
      <div className="">
        <PageMeta
          title="Quản lý Collection"
          description="Quản lý collection của hệ thống"
        />
        <PageBreadcrumb pageTitle="Quản lý Collection" />
        
        {/* Statistics Cards */}
        {collections?.data && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
            <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <FiFolder className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng Collection</p>
                  <p className="text-2xl font-bold text-gray-900">{collections.data.pagination?.totalRecords || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <FiUsers className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng Tài nguyên</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {collections.data.collections?.reduce((sum: number, col: any) => sum + (col.resources_count || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">TB Tài nguyên/Collection</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {collections.data.collections?.length > 0 
                      ? Math.round(collections.data.collections.reduce((sum: number, col: any) => sum + (col.resources_count || 0), 0) / collections.data.collections.length)
                      : 0
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSearch("");
                setUserFilter("");
                setSelectedIds([]);
                setTimeout(() => fetchCollections(), 100);
              }}
              className="flex items-center gap-2 rounded-full border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-theme-xs hover:bg-red-100"
            >
              🔄 Reset Filters
            </button>
            {selectedIds.length > 0 && (
              <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Đã chọn: {selectedIds.length} collection(s)
              </span>
            )}
          </div>
          <button
            onClick={handleShowModalAdd}
            className="flex items-center dark:bg-black dark:text-white gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50">
            <IoIosAdd size={24} />
            Thêm Collection
          </button>
        </div>

        <ComponentCard title="Danh sách các collection có trong hệ thống">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <Label htmlFor="searchInput">Tìm kiếm theo tên</Label>
              <Input
                type="text"
                id="searchInput"
                placeholder="Nhập tên collection..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div>
              <Label htmlFor="userFilter">Lọc theo người tạo</Label>
              <Select
                id="userFilter"
                placeholder={usersLoading ? "Đang tải người dùng..." : "Chọn người tạo..."}
                value={userFilter || undefined}
                onChange={(value) => {
                  setUserFilter(value || "");
                  setTimeout(() => fetchCollections(), 300);
                }}
                allowClear
                showSearch
                loading={usersLoading}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={[
                  { value: "", label: "🌐 Tất cả người dùng" },
                  ...users.map(user => ({
                    value: user.id.toString(),
                    label: `👤 ${user.username ?? user.username_admin} • ${user.email}`,
                  }))
                ]}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="searchButton">Tìm kiếm</Label>
              <button
                id="searchButton"
                onClick={() => fetchCollections()}
                className="w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                🔍 Tìm kiếm
              </button>
            </div>
          </div>

          <ReusableTable
            error={errorData}
            title="Danh sách Collection"
            data={collections?.data?.collections ?? []}
            columns={columns}
            onEdit={onEdit}
            onDelete={onDelete}
            isLoading={loading}
            onCheck={(ids) => getIds(ids)}
            setSelectedIds={setSelectedIds}
            selectedIds={selectedIds}
            customActions={(item) => (
              <Button
                type="primary"
                size="small"
                onClick={() => handleManageResources(item)}
                className="ml-2"
              >
                Quản lý tài nguyên
              </Button>
            )}
          />

          <Pagination
            limit={quantity}
            offset={offset ?? 1}
            totalPages={collections?.data?.pagination?.totalPages ?? 0}
            onPageChange={(limit, newOffset) => {
              setQuantity(limit);
              setOffset(newOffset);
            }}
            onLimitChange={(newLimit) => {
              setQuantity(newLimit);
              setOffset(0);
            }}
          />
        </ComponentCard>
      </div>

      {/* Edit Modal */}
      <FormModal
        title="Cập nhật Collection"
        isOpen={openModal}
        isLoading={loading}
        onSubmit={handleUpdateCollection}
        onCancel={() => setOpenModal(false)}
        formFields={formFields}
      />

      {/* Add Modal */}
      <FormModal
        title="Thêm Collection mới"
        isOpen={openModalAdd}
        isLoading={loading}
        onSubmit={handleAddCollection}
        onCancel={() => setOpenModalAdd(false)}
        formFields={formFieldsAdd}
      />

      {/* Resource Management Modal */}
      <Modal
        title={
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FiFolder className="text-blue-600" />
              <span>Quản lý tài nguyên - {selectedCollection?.name}</span>
            </div>
            {selectedCollection?.details?.data?.statistics && (
              <div className="text-sm text-gray-600 flex gap-4">
                <span>📊 Tổng: {selectedCollection.details.data.statistics.total_resources}</span>
                <span>🆓 Free: {selectedCollection.details.data.statistics.free_resources}</span>
                <span>💎 Premium: {selectedCollection.details.data.statistics.premium_resources}</span>
                <span>📁 Loại file: {selectedCollection.details.data.statistics.unique_file_types}</span>
              </div>
            )}
          </div>
        }
        open={openResourceModal}
        onCancel={() => setOpenResourceModal(false)}
        width={1200}
        footer={null}
        className="resource-management-modal"
        style={{ top: 20 }}
        styles={{
          body: {
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto'
          }
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Available Resources */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-blue-600">📂</span>
                  Tài nguyên có sẵn ({availableResources.length})
                  {resourcePagination && (
                    <span className="text-sm font-normal text-gray-500">
                      / {resourcePagination.totalResources} tổng
                    </span>
                  )}
                </h3>
                {selectedCollection?.details?.data?.file_types_distribution && (
                  <div className="text-xs text-gray-500 mt-1">
                    Phân phối: {selectedCollection.details.data.file_types_distribution.map((type: any) => 
                      `${type.file_type}: ${type.count}`
                    ).join(', ')}
                  </div>
                )}
              </div>
              <Button
                type="primary"
                icon={<FiPlus />}
                onClick={handleAddResources}
                disabled={selectedResourceIds.length === 0}
                loading={resourceLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                Thêm ({selectedResourceIds.length})
              </Button>
            </div>

            {/* Search and Filter Controls */}
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex flex-col space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 text-lg">🔍</span>
                  <h4 className="text-sm font-semibold text-blue-800">Tìm kiếm & Lọc tài nguyên</h4>
                </div>
                
                {/* Search and Filter Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Search Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-1">
                        📝 Tìm kiếm theo tên
                      </span>
                    </label>
                    <Input
                      placeholder="Nhập tên tài nguyên để tìm kiếm..."
                      value={resourceSearch}
                      onChange={(e) => setResourceSearch(e.target.value)}
                      onPressEnter={() => selectedCollection && fetchAvailableResources(selectedCollection.id)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      prefix={<span className="text-gray-400">🔎</span>}
                      allowClear
                    />
                  </div>

                  {/* File Type Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-1">
                        📁 Loại file
                      </span>
                    </label>
                    <Select
                      placeholder="Chọn loại file..."
                      value={resourceFileType || undefined}
                      onChange={(value) => setResourceFileType(value || "")}
                      allowClear
                      className="w-full"
                      style={{ borderRadius: '6px' }}
                      options={[
                        { 
                          value: "image", 
                          label: (
                            <div className="flex items-center gap-2">
                              <span className="text-blue-500">🖼️</span>
                              <span>Hình ảnh</span>
                            </div>
                          )
                        },
                        { 
                          value: "pdf", 
                          label: (
                            <div className="flex items-center gap-2">
                              <span className="text-red-500">📄</span>
                              <span>PDF</span>
                            </div>
                          )
                        },
                        { 
                          value: "video", 
                          label: (
                            <div className="flex items-center gap-2">
                              <span className="text-purple-500">🎥</span>
                              <span>Video</span>
                            </div>
                          )
                        },
                        { 
                          value: "audio", 
                          label: (
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">🎵</span>
                              <span>Âm thanh</span>
                            </div>
                          )
                        },
                      ]}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <span>💡</span>
                    <span>Nhấn Enter hoặc click Tìm kiếm để áp dụng bộ lọc</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setResourceSearch("");
                        setResourceFileType("");
                        setResourceCategory("");
                        setResourcePlan("");
                        setResourceStatus("");
                        setResourcePage(0);
                        setTimeout(() => {
                          selectedCollection && fetchAvailableResources(selectedCollection.id);
                        }, 100);
                      }}
                      className="flex items-center gap-1 text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-700"
                      size="small"
                    >
                      <span>🔄</span>
                      <span>Đặt lại</span>
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => selectedCollection && fetchAvailableResources(selectedCollection.id)}
                      loading={resourceLoading}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                      size="small"
                    >
                      <span>🔍</span>
                      <span>Tìm kiếm</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Results Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Results Header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">📋</span>
                    <span className="text-sm font-medium text-gray-700">
                      Kết quả tìm kiếm: {availableResources.length} tài nguyên
                    </span>
                    {(resourceSearch || resourceFileType) && (
                      <div className="flex items-center gap-1 ml-2">
                        {resourceSearch && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            🔍 "{resourceSearch}"
                          </span>
                        )}
                        {resourceFileType && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            📁 {resourceFileType}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {resourcePagination && (
                    <span className="text-xs text-gray-500">
                      Trang {resourcePage + 1}/{resourcePagination.totalPages}
                    </span>
                  )}
                </div>
              </div>

              {/* Results Content */}
              <div className="max-h-96 overflow-y-auto">
                {availableResources.length === 0 && !resourceLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-sm font-medium mb-1">Không tìm thấy tài nguyên phù hợp</p>
                    <p className="text-xs text-gray-400">
                      {(resourceSearch || resourceFileType) 
                        ? "Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
                        : "Tất cả tài nguyên đã có trong collection này"
                      }
                    </p>
                  </div>
                ) : (
                <List
                  loading={resourceLoading}
                  dataSource={availableResources}
                  key={`available-resources-${refreshTrigger}`}
                  renderItem={(resource: any) => (
                  <List.Item className="px-4 hover:bg-blue-50 transition-colors duration-200">
                    <div className="flex items-start gap-3 w-full">
                      <Checkbox
                        checked={selectedResourceIds.includes(resource.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedResourceIds([...selectedResourceIds, resource.id]);
                          } else {
                            setSelectedResourceIds(selectedResourceIds.filter(id => id !== resource.id));
                          }
                        }}
                        className="mt-1"
                      />
                      
                      {/* Resource Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                        {resource.file_url && resource.file_type?.toLowerCase().includes('image') ? (
                          <img 
                            src={resource.file_url} 
                            alt={resource.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '';
                            }}
                          />
                        ) : (
                          <span className="text-2xl">
                            {resource.file_type === 'PDF' ? '📄' :
                             resource.file_type === 'VIDEO' ? '🎥' :
                             resource.file_type === 'AUDIO' ? '🎵' : '📁'}
                          </span>
                        )}
                      </div>

                      {/* Resource Details */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{resource.title}</div>
                        
                        {/* Badges Row */}
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            resource.file_type === 'PDF' ? 'bg-red-100 text-red-600' : 
                            resource.file_type === 'IMAGE' ? 'bg-blue-100 text-blue-600' :
                            resource.file_type === 'VIDEO' ? 'bg-purple-100 text-purple-600' :
                            resource.file_type === 'AUDIO' ? 'bg-green-100 text-green-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {resource.file_type}
                          </span>
                          
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            resource.plan === 'premium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {resource.plan === 'premium' ? '💎 Premium' : '🆓 Free'}
                          </span>

                          {resource.category_name && (
                            <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-600 font-medium">
                              📂 {resource.category_name}
                            </span>
                          )}

                          {resource.status && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              resource.status === 'published' || resource.status === 'publish' ? 'bg-green-100 text-green-600' : 
                              resource.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {resource.status === 'published' || resource.status === 'publish' ? '✅' : 
                               resource.status === 'pending' ? '⏳' : '❌'}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {resource.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {resource.description}
                          </div>
                        )}

                        {/* Stats Row */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          {resource.downloads !== undefined && (
                            <span className="flex items-center gap-1">
                              📥 {resource.downloads} lượt tải
                            </span>
                          )}
                          {resource.favorites_count !== undefined && (
                            <span className="flex items-center gap-1">
                              ❤️ {resource.favorites_count}
                            </span>
                          )}
                          {resource.created_at && (
                            <span className="flex items-center gap-1">
                              📅 {new Date(resource.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </List.Item>
                  )}
                />
              )}
              </div>

              {/* Pagination for Available Resources */}
              {resourcePagination && resourcePagination.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <Button
                        size="small"
                        disabled={resourcePage === 0 || resourceLoading}
                        onClick={() => {
                          setResourcePage(0);
                          setTimeout(() => {
                            selectedCollection && fetchAvailableResources(selectedCollection.id);
                          }, 100);
                        }}
                        className="flex items-center gap-1"
                      >
                        <span>⏮️</span>
                        <span>Đầu</span>
                      </Button>
                      <Button
                        size="small"
                        disabled={!resourcePagination.hasPrevPage || resourceLoading}
                        onClick={() => {
                          setResourcePage(resourcePage - 1);
                          setTimeout(() => {
                            selectedCollection && fetchAvailableResources(selectedCollection.id);
                          }, 100);
                        }}
                        className="flex items-center gap-1"
                      >
                        <span>⬅️</span>
                        <span>Trước</span>
                      </Button>
                      
                      <div className="px-4 py-2 bg-white rounded-md border border-gray-300 text-sm font-medium text-gray-700 shadow-sm">
                        {resourcePage + 1} / {resourcePagination.totalPages}
                      </div>
                      
                      <Button
                        size="small"
                        disabled={!resourcePagination.hasNextPage || resourceLoading}
                        onClick={() => {
                          setResourcePage(resourcePage + 1);
                          setTimeout(() => {
                            selectedCollection && fetchAvailableResources(selectedCollection.id);
                          }, 100);
                        }}
                        className="flex items-center gap-1"
                      >
                        <span>Sau</span>
                        <span>➡️</span>
                      </Button>
                      <Button
                        size="small"
                        disabled={resourcePage === resourcePagination.totalPages - 1 || resourceLoading}
                        onClick={() => {
                          setResourcePage(resourcePagination.totalPages - 1);
                          setTimeout(() => {
                            selectedCollection && fetchAvailableResources(selectedCollection.id);
                          }, 100);
                        }}
                        className="flex items-center gap-1"
                      >
                        <span>Cuối</span>
                        <span>⏭️</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resources in Collection */}
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  Trong collection ({selectedCollection?.details?.data?.resources?.length || selectedCollection?.details?.resources?.length || 0})
                  {refreshTrigger > 0 && (
                    <span className="text-xs text-gray-400">• Cập nhật</span>
                  )}
                </h3>
                {selectedCollection?.details?.data?.statistics && (
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedCollection.details.data.statistics.first_resource_added && (
                      <span>Đầu tiên: {new Date(selectedCollection.details.data.statistics.first_resource_added).toLocaleDateString('vi-VN')}</span>
                    )}
                    {selectedCollection.details.data.statistics.last_resource_added && selectedCollection.details.data.statistics.total_resources > 1 && (
                      <span> • Gần nhất: {new Date(selectedCollection.details.data.statistics.last_resource_added).toLocaleDateString('vi-VN')}</span>
                    )}
                  </div>
                )}
              </div>
              {(selectedCollection?.details?.data?.resources?.length || selectedCollection?.details?.resources?.length) > 0 && (
                <Button
                  type="primary"
                  danger
                  icon={<FiMinus />}
                  onClick={() => {
                    const resources = selectedCollection.details?.data?.resources || selectedCollection.details?.resources || [];
                    const allResourceIds = resources.map((r: any) => r.id);
                    handleRemoveResources(allResourceIds);
                  }}
                  loading={resourceLoading}
                  size="small"
                >
                  Xóa tất cả
                </Button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto border rounded-md">
              {(!selectedCollection?.details?.data?.resources?.length && !selectedCollection?.details?.resources?.length) && !resourceLoading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">📂</div>
                  <p className="text-sm">Collection này chưa có tài nguyên nào</p>
                  <p className="text-xs mt-1">Hãy thêm tài nguyên từ danh sách bên trái</p>
                </div>
              ) : (
                <List
                  loading={resourceLoading}
                  dataSource={selectedCollection?.details?.data?.resources || selectedCollection?.details?.resources || []}
                  key={`collection-resources-${refreshTrigger}`}
                  renderItem={(resource: any) => (
                  <List.Item className="px-4 hover:bg-green-50 transition-colors duration-200">
                    <div className="flex items-start gap-3 w-full">
                      {/* Resource Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                        {resource.file_url && resource.file_type?.toLowerCase().includes('image') ? (
                          <img 
                            src={resource.file_url} 
                            alt={resource.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '';
                            }}
                          />
                        ) : (
                          <span className="text-2xl">
                            {resource.file_type === 'PDF' ? '📄' :
                             resource.file_type === 'VIDEO' ? '🎥' :
                             resource.file_type === 'AUDIO' ? '🎵' : '📁'}
                          </span>
                        )}
                      </div>

                      {/* Resource Details */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{resource.title}</div>
                        
                        {/* Badges Row */}
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            resource.file_type === 'PDF' ? 'bg-red-100 text-red-600' : 
                            resource.file_type === 'IMAGE' ? 'bg-blue-100 text-blue-600' :
                            resource.file_type === 'VIDEO' ? 'bg-purple-100 text-purple-600' :
                            resource.file_type === 'AUDIO' ? 'bg-green-100 text-green-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {resource.file_type}
                          </span>
                          
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            resource.plan === 'premium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {resource.plan === 'premium' ? '💎 Premium' : '🆓 Free'}
                          </span>

                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-600 font-medium">
                            👤 {resource.resource_owner}
                          </span>

                          {resource.category_name && (
                            <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-600 font-medium">
                              📂 {resource.category_name}
                            </span>
                          )}

                          {resource.status && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              resource.status === 'published' || resource.status === 'publish' ? 'bg-green-100 text-green-600' : 
                              resource.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {resource.status === 'published' || resource.status === 'publish' ? '✅' : 
                               resource.status === 'pending' ? '⏳' : '❌'}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {resource.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {resource.description}
                          </div>
                        )}

                        {/* Stats and Added Date Row */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            📅 Thêm: {new Date(resource.added_at).toLocaleDateString('vi-VN')}
                          </span>
                          {resource.downloads !== undefined && (
                            <span className="flex items-center gap-1">
                              📥 {resource.downloads}
                            </span>
                          )}
                          {resource.favorites_count !== undefined && (
                            <span className="flex items-center gap-1">
                              ❤️ {resource.favorites_count}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<FiMinus />}
                        onClick={() => handleRemoveResources([resource.id])}
                        className="flex-shrink-0 mt-1"
                      >
                        Xóa
                      </Button>
                    </div>
                  </List.Item>
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
