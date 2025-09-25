import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Tổng quan"
        description="Đây là trang tổng quan mô tả tổng quan và thống kê về hệ thống"
      />
      <div className="space-y-6">
        <EcommerceMetrics />
      </div>
    </>
  );
}
