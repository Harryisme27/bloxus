import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoriesTab } from "@/components/work-admin/CategoriesTab";
import { ProductsTab } from "@/components/work-admin/ProductsTab";
import { WorkProductEditor } from "./WorkProductEditor";
import type { ProductRow } from "@/types/db";

/** /work/catalog (admin) — CRUD danh mục + sản phẩm, upload ảnh, option builder. */
export function WorkCatalog() {
  // null = editor đóng; undefined product = tạo mới; ProductRow = sửa.
  const [editing, setEditing] = useState<{ product: ProductRow | null } | null>(null);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text">Danh mục & sản phẩm</h1>
        <p className="mt-1 text-sm text-text-muted">
          Tạo/sửa danh mục, thêm sản phẩm hoặc dịch vụ, tải ảnh và cấu hình option giá.
        </p>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Sản phẩm</TabsTrigger>
          <TabsTrigger value="categories">Danh mục</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="pt-5">
          <ProductsTab
            onCreate={() => setEditing({ product: null })}
            onEdit={(product) => setEditing({ product })}
          />
        </TabsContent>
        <TabsContent value="categories" className="pt-5">
          <CategoriesTab />
        </TabsContent>
      </Tabs>

      {editing ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-bg/95 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl px-4 py-8">
            <WorkProductEditor product={editing.product} onClose={() => setEditing(null)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
