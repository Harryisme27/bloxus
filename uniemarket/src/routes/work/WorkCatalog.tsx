import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoriesTab } from "@/components/work-admin/CategoriesTab";
import { ProductsTab } from "@/components/work-admin/ProductsTab";
import { WorkProductEditor } from "./WorkProductEditor";
import type { ProductRow } from "@/types/db";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    title: "Danh mục & sản phẩm",
    subtitle: "Tạo/sửa danh mục, thêm sản phẩm hoặc dịch vụ, tải ảnh và cấu hình option giá.",
    products: "Sản phẩm",
    categories: "Danh mục",
  },
  en: {
    title: "Categories & products",
    subtitle:
      "Create/edit categories, add products or services, upload images, and configure price options.",
    products: "Products",
    categories: "Categories",
  },
};

/** /work/catalog (admin) — CRUD danh mục + sản phẩm, upload ảnh, option builder. */
export function WorkCatalog() {
  // null = editor đóng; undefined product = tạo mới; ProductRow = sửa.
  const [editing, setEditing] = useState<{ product: ProductRow | null } | null>(null);
  const t = usePick(STR);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text">{t.title}</h1>
        <p className="mt-1 text-sm text-text-muted">{t.subtitle}</p>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">{t.products}</TabsTrigger>
          <TabsTrigger value="categories">{t.categories}</TabsTrigger>
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
