import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  // null = editor đóng; product=null = tạo mới (có thể kèm category mặc định).
  const [editing, setEditing] = useState<{
    product: ProductRow | null;
    defaultCategoryId?: string;
  } | null>(null);
  const t = usePick(STR);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text">{t.title}</h1>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">{t.products}</TabsTrigger>
          <TabsTrigger value="categories">{t.categories}</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="pt-5">
          <ProductsTab
            onCreate={(defaultCategoryId) => setEditing({ product: null, defaultCategoryId })}
            onEdit={(product) => setEditing({ product })}
          />
        </TabsContent>
        <TabsContent value="categories" className="pt-5">
          <CategoriesTab />
        </TabsContent>
      </Tabs>

      {/* Editor sản phẩm trong Dialog — cùng phong cách với dialog danh mục. */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {editing ? (
            <WorkProductEditor
              product={editing.product}
              defaultCategoryId={editing.defaultCategoryId}
              onClose={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
