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
import { usePick, useLangStore } from "@/i18n";

const STR = {
  vi: {
    fieldBrand: "Tên shop",
    fieldBank: "Ngân hàng",
    fieldAccount: "Số tài khoản",
    fieldHolder: "Chủ tài khoản",
    fieldMomo: "Số Momo",
    saved: "Đã lưu cài đặt.",
    saveFail: "Không lưu được.",
    qrUploaded: "Đã tải ảnh QR — nhớ bấm Lưu.",
    uploadFail: "Tải ảnh thất bại.",
    title: "Cài đặt thanh toán",
    subtitle: "Các thông tin này hiện ở bước thanh toán của khách. Cập nhật đúng để nhận được tiền.",
    receiveInfo: "Thông tin nhận tiền",
    momoQrLabel: "Ảnh QR Momo",
    momoQrAlt: "QR Momo",
    uploadQr: "Tải ảnh QR",
    removeImage: "Xoá ảnh",
    saving: "Đang lưu...",
    save: "Lưu cài đặt",
    customerSees: "Khách sẽ thấy",
    previewNote: "Kèm mã đơn (nội dung chuyển khoản) và số tiền của từng đơn.",
    handlingTitle: "Xử lý đơn",
    timeoutLabel: "Thời gian giữ đơn tối đa (phút)",
    timeoutHint:
      "CTV nhận đơn mà quá số phút này chưa giao thì đơn tự trả về hàng đợi. Đặt 0 để tắt.",
    refundTimeoutLabel: "Thời gian tự hoàn tiền (phút)",
    refundTimeoutHint:
      "Sau khi khách yêu cầu hoàn tiền, nếu admin chưa xử lý thì khách được tự chốt hoàn tiền sau số phút này.",
  },
  en: {
    fieldBrand: "Shop name",
    fieldBank: "Bank",
    fieldAccount: "Account number",
    fieldHolder: "Account holder",
    fieldMomo: "Momo number",
    saved: "Settings saved.",
    saveFail: "Couldn't save.",
    qrUploaded: "QR image uploaded — remember to click Save.",
    uploadFail: "Image upload failed.",
    title: "Payment settings",
    subtitle:
      "This information appears at the customer's checkout step. Keep it accurate to receive payments.",
    receiveInfo: "Payout details",
    momoQrLabel: "Momo QR image",
    momoQrAlt: "Momo QR",
    uploadQr: "Upload QR image",
    removeImage: "Remove image",
    saving: "Saving...",
    save: "Save settings",
    customerSees: "What the customer sees",
    previewNote: "Includes the order code (transfer memo) and each order's amount.",
    handlingTitle: "Order handling",
    timeoutLabel: "Max order hold time (minutes)",
    timeoutHint:
      "If a collaborator claims an order but doesn't deliver within this many minutes, it returns to the queue. Set 0 to disable.",
    refundTimeoutLabel: "Auto-refund time (minutes)",
    refundTimeoutHint:
      "After a customer requests a refund, if an admin hasn't handled it they can finalize the refund themselves after this many minutes.",
  },
};

const FIELDS: { key: string; placeholder: string }[] = [
  { key: "brand", placeholder: "Uniemarket" },
  { key: "bank_name", placeholder: "Vietcombank" },
  { key: "bank_account", placeholder: "0123456789" },
  { key: "bank_holder", placeholder: "NGUYEN VAN A" },
  { key: "momo_number", placeholder: "0900000000" },
];

export function WorkSettings() {
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const lang = useLangStore((state) => state.lang);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [qrUrl, setQrUrl] = useState("");
  const [claimTimeout, setClaimTimeout] = useState("15");
  const [refundTimeout, setRefundTimeout] = useState("60");
  const [uploading, setUploading] = useState(false);

  const fieldLabels: Record<string, string> = {
    brand: t.fieldBrand,
    bank_name: t.fieldBank,
    bank_account: t.fieldAccount,
    bank_holder: t.fieldHolder,
    momo_number: t.fieldMomo,
  };

  const query = useQuery({ queryKey: ["settings"], queryFn: getSettings });

  useEffect(() => {
    if (query.data) {
      const asStr = (v: unknown) => (typeof v === "string" ? v : "");
      const next: Record<string, string> = {};
      for (const f of FIELDS) next[f.key] = asStr(query.data[f.key]);
      setForm(next);
      setQrUrl(asStr(query.data.momo_qr_url));
      const rawTimeout = query.data.claim_timeout_minutes;
      setClaimTimeout(rawTimeout == null ? "15" : String(rawTimeout));
      const rawRefund = query.data.refund_timeout_minutes;
      setRefundTimeout(rawRefund == null ? "60" : String(rawRefund));
    }
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(FIELDS.map((f) => updateSetting(f.key, form[f.key] ?? "")));
      await updateSetting("momo_qr_url", qrUrl);
      await updateSetting("claim_timeout_minutes", Math.max(0, parseInt(claimTimeout, 10) || 0));
      await updateSetting("refund_timeout_minutes", Math.max(1, parseInt(refundTimeout, 10) || 60));
    },
    onSuccess: () => {
      toast.success(t.saved);
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.saveFail),
  });

  async function handleQrUpload(file: File) {
    setUploading(true);
    try {
      const prepared = await prepareImage(file, lang);
      const { publicUrl } = await uploadSiteAsset(prepared);
      setQrUrl(publicUrl);
      toast.success(t.qrUploaded);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.uploadFail);
    } finally {
      setUploading(false);
    }
  }

  if (query.isPending) {
    return (
      <div>
        <h1 className="mb-6 font-heading text-2xl font-bold text-text">{t.title}</h1>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text">{t.title}</h1>
        <p className="mt-1 text-sm text-text-muted">{t.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">{t.receiveInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <Label htmlFor={f.key}>{fieldLabels[f.key]}</Label>
                <Input
                  id={f.key}
                  value={form[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}

            <div>
              <Label>{t.momoQrLabel}</Label>
              <div className="flex items-center gap-4">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt={t.momoQrAlt}
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
                    {t.uploadQr}
                  </Button>
                  {qrUrl ? (
                    <button
                      type="button"
                      onClick={() => setQrUrl("")}
                      className="block text-xs text-text-subtle hover:text-danger"
                    >
                      {t.removeImage}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-3 font-heading text-sm font-semibold text-text">{t.handlingTitle}</p>
              <Label htmlFor="claim-timeout">{t.timeoutLabel}</Label>
              <Input
                id="claim-timeout"
                type="number"
                min={0}
                value={claimTimeout}
                onChange={(e) => setClaimTimeout(e.target.value)}
                className="max-w-[160px]"
              />
              <p className="mt-1.5 text-xs text-text-subtle">{t.timeoutHint}</p>

              <div className="mt-4">
                <Label htmlFor="refund-timeout">{t.refundTimeoutLabel}</Label>
                <Input
                  id="refund-timeout"
                  type="number"
                  min={1}
                  value={refundTimeout}
                  onChange={(e) => setRefundTimeout(e.target.value)}
                  className="max-w-[160px]"
                />
                <p className="mt-1.5 text-xs text-text-subtle">{t.refundTimeoutHint}</p>
              </div>
            </div>

            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4" aria-hidden />
              {saveMutation.isPending ? t.saving : t.save}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="h-fit">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">{t.customerSees}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 text-sm">
            <Preview label={t.fieldBank} value={form.bank_name} />
            <Preview label={t.fieldAccount} value={form.bank_account} />
            <Preview label={t.fieldHolder} value={form.bank_holder} />
            <Preview label={t.fieldMomo} value={form.momo_number} />
            <p className="pt-2 text-xs text-text-subtle">{t.previewNote}</p>
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
