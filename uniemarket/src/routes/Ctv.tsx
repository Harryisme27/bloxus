// /ctv (public) — chương trình tuyển Cộng tác viên tạm đóng.
// Trang giữ nguyên route nhưng chỉ hiển thị thông báo tĩnh (đã bỏ form ứng tuyển).
import { Link } from "react-router-dom";
import { Home, PauseCircle } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function Ctv() {
  return (
    <PageContainer className="py-16 sm:py-24">
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-soft text-yellow">
            <PauseCircle className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-text">
              Tuyển Cộng tác viên tạm đóng
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">
              Chương trình tuyển Cộng tác viên hiện đang tạm đóng. Vui lòng liên hệ quản trị viên
              nếu bạn muốn tham gia.
            </p>
          </div>
          <Link to="/" className={buttonVariants({ variant: "primary", size: "md" })}>
            <Home className="h-4 w-4" aria-hidden />
            Về trang chủ
          </Link>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
