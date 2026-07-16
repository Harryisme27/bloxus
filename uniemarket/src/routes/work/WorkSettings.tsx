import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageUp, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSettings, updateSetting } from "@/lib/db/settings";
import { prepareImage, uploadSiteAsset } from "@/components/work-admin/uploads";

const FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "brand", label: "Tên shop", placeholder: "Uniemarket" },
  { key: "bank_name", label: "Ngân hàng", placeholder: "Vietcombank" },
  { key: "bank_account", label: "Số tài khoản", placeholder: "0123456789" },
  { key: "bank_holder", label: "Chủ tài khoản", placeholder: "NGUYEN VAN A" },
  { key: "momo_number", label: "Số Momo", placeholder: "0900000000" },
];

export function WorkSettings() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [qrUrl, setQrUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const query = useQuery({ queryKey: ["settings"], queryFn: getSettings });

  useEffect(() => {
    if (query.data) {
      const asStr = (v: unknown) => (typeof v === "string" ? v : "");
      const next: Record<string, string> = {};
      for (const f of FIELDS) next[f.key] = asStr(query.data[f.key]);
      setForm(next);
      setQrUrl(asStr(query.data.momo_qr_url));
    }
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(FIELDS.map((f) => updateSetting(f.key, form[f.key] ?? "")));
      await updateSetting("momo_qr_url", qrUrl);
    },
    onSuccess: () => {
      toast.success("Đã lưu cài đặt.");
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Không lưu được."),
  });

  async function handleQrUpload(file: File) {
    setUploading(true);
    try {
      const prepared = await prepareImage(file);
      const { publicUrl } = await uploadSiteAsset(prepared);
      setQrUrl(publicUrl);
      toast.success("Đã tải ảnh QR — nhớ bấm Lưu.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tải ảnh thất bại.");
    } finally {
      setUploading(false);
    }
  }

  if (query.isPending) {
    return (
      <div>
        <h1 className="mb-6 font-heading text-2xl font-bold text-text">Cài đặt thanh toán</h1>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text">Cài đặt thanh toán</h1>
        <p className="mt-1 text-sm text-text-muted">
          Các thông tin này hiện ở bước thanh toán của khách. Cập nhật đúng để nhận được tiền.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">Thông tin nhận tiền</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  value={form[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}

            <div>
              <Label>Ảnh QR Momo</Label>
              <div className="flex items-center gap-4">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="QR Momo"
                    className="h-24 w-24 rounded-lg border border-border object-contain"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-border-strong text-text-subtle">
                    <ImageUp className="h-6 w-6" aria-hidden />
                  </div>
                )}
                <div className="space-y-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleQrUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <ImageUp className="h-4 w-4" aria-hidden />
                    )}
                    Tải ảnh QR
                  </Button>
                  {qrUrl ? (
                    <button
                      type="button"
                      onClick={() => setQrUrl("")}
                      className="block text-xs text-text-subtle hover:text-danger"
                    >
                      Xoá ảnh
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4" aria-hidden />
              {saveMutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="h-fit">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">Khách sẽ thấy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 text-sm">
            <Preview label="Ngân hàng" value={form.bank_name} />
            <Preview label="Số tài khoản" value={form.bank_account} />
            <Preview label="Chủ tài khoản" value={form.bank_holder} />
            <Preview label="Số Momo" value={form.momo_number} />
            <p className="pt-2 text-xs text-text-subtle">
              Kèm mã đơn (nội dung chuyển khoản) và số tiền của từng đơn.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Preview({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-text-subtle">{label}</span>
      <span className="tabular-nums-mono font-medium text-text">{value || "—"}</span>
    </div>
  );
}
