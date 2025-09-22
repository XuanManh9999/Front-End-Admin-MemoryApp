import {
  BoxIconLine,
  GroupIcon,
  DownloadIcon,
  FolderIcon,
  ShootingStarIcon,
} from "../../icons";

import { getDashboard, Dashboard } from "../../services/dashboard";
import { useEffect, useState } from "react";

export default function EcommerceMetrics() {
  const [dataDashboard, setDataDashboard] = useState<Dashboard | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getDashboard();
        setDataDashboard(response);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6">
      {/* Tổng số người dùng */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl dark:bg-blue-800/20">
          <GroupIcon className="text-blue-600 size-6 dark:text-blue-400" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Tổng số người dùng
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {dataDashboard?.total_users || 0}
            </h4>
          </div>
        </div>
      </div>

      {/* Tổng số tài nguyên */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-800/20">
          <BoxIconLine className="text-green-600 size-6 dark:text-green-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Tổng số tài nguyên
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {dataDashboard?.total_resources || 0}
            </h4>
          </div>
        </div>
      </div>

      {/* Tổng số lượt tải */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl dark:bg-purple-800/20">
          <DownloadIcon className="text-purple-600 size-6 dark:text-purple-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Tổng số lượt tải
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {dataDashboard?.total_downloads || 0}
            </h4>
          </div>
        </div>
      </div>

      {/* Tổng số bộ sưu tập */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl dark:bg-orange-800/20">
          <FolderIcon className="text-orange-600 size-6 dark:text-orange-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Tổng số bộ sưu tập
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {dataDashboard?.total_collections || 0}
            </h4>
          </div>
        </div>
      </div>

      {/* Tổng số thẻ tag */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-xl dark:bg-pink-800/20">
          <ShootingStarIcon className="text-pink-600 size-6 dark:text-pink-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Tổng số thẻ tag
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {dataDashboard?.total_tags || 0}
            </h4>
          </div>
        </div>
      </div>
      
    </div>
  );
}
