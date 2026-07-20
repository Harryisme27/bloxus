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
import { GATEWAY_META, parseGateways, type GatewaysSettings } from "@/lib/paymentGateways";
import { Toggle } from "@/components/work-admin/Toggle";
import type { DbOrderStatus } from "@/types/db";
import { usePick, useLangStore, useT } from "@/i18n";

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
    gatewaysTitle: "Cổng thanh toán",
    gatewaysHint:
      "Bật/tắt cổng và nhập thông tin. Chỉ những cổng được BẬT mới hiển thị cho khách ở bước thanh toán.",
    show: "Hiển thị cho khách",
    builtinNote: "Dùng thông tin nhận tiền ở trên.",
    generalTitle: "Thông tin chung",
    delTitle: "Xóa đơn hàng",
    delHint:
      "Chọn trạng thái đơn được phép xóa. Nên giữ lại đơn 'Chờ thanh toán' và 'Đang xử lý' để tránh mất dữ liệu đang chạy.",
    recruitTitle: "Tuyển cộng tác viên",
    recruitToggle: "Mở đơn ứng tuyển CTV cho khách",
    recruitHint: "Bật để khách nộp đơn ứng tuyển CTV ở trang /ctv. Tắt thì trang báo tạm đóng.",
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
    gatewaysTitle: "Payment gateways",
    gatewaysHint:
      "Toggle gateways and enter their details. Only ENABLED gateways are shown to customers at checkout.",
    show: "Show to customers",
    builtinNote: "Uses the payout details above.",
    generalTitle: "General",
    delTitle: "Order deletion",
    delHint:
      "Choose which order statuses admins are allowed to delete. Keep 'Awaiting payment' and 'In progress' to avoid losing active orders.",
    recruitTitle: "Collaborator recruitment",
    recruitToggle: "Open CTV applications to customers",
    recruitHint:
      "When on, customers can submit CTV applications on the /ctv page. When off, that page shows a closed notice.",
  },
};

const ORDER_STATUSES: DbOrderStatus[] = [
  "pending_payment",
  "paid",
  "in_progress",
  "completed",
  "cancelled",
  "refunded",
];

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
  const [gws, setGws] = useState<GatewaysSettings>({});
  const [delStatuses, setDelStatuses] = useState<Set<string>>(new Set());
  const [ctvApplyOpen, setCtvApplyOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const en = lang === "en";
  const s = useT();

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
      setGws(parseGateways(query.data));
      const rawDel = query.data.deletable_order_statuses;
      setDelStatuses(
        new Set(
          Array.isArray(rawDel)
            ? (rawDel as string[])
            : ["paid", "completed", "cancelled", "refunded"],
        ),
      );
      setCtvApplyOpen(query.data.ctv_apply_open === true);
    }
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(FIELDS.map((f) => updateSetting(f.key, form[f.key] ?? "")));
      await updateSetting("momo_qr_url", qrUrl);
      await updateSetting("claim_timeout_minutes", Math.max(0, parseInt(claimTimeout, 10) || 0));
      await updateSetting("refund_timeout_minutes", Math.max(1, parseInt(refundTimeout, 10) || 60));
      await updateSetting("payment_gateways", gws);
      await updateSetting("deletable_order_statuses", Array.from(delStatuses));
      await updateSetting("ctv_apply_open", ctvApplyOpen);
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

  // Ô nhập gắn với 1 key trong `form` (bank_name, momo_number...). Lưu vào các
  // key app_settings công khai riêng lẻ — checkout/order đọc trực tiếp được.
  const formField = (key: string, placeholder: string) => (
    <div>
      <Label htmlFor={key}>{fieldLabels[key]}</Label>
      <Input
        id={key}
        value={form[key] ?? ""}
        placeholder={placeholder}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
      />
    </div>
  );

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
            <CardTitle className="text-base">{t.gatewaysTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            {/* Thông tin chung */}
            <div>
              <Label htmlFor="brand">{t.fieldBrand}</Label>
              <Input
                id="brand"
                value={form.brand ?? ""}
                placeholder="Uniemarket"
                onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
              />
            </div>

            {/* Cổng thanh toán — mỗi cổng chứa thông tin của chính nó */}
            <div className="border-t border-border pt-4">
              <p className="font-heading text-sm font-semibold text-text">{t.gatewaysTitle}</p>
              <p className="mb-3 mt-0.5 text-xs text-text-subtle">{t.gatewaysHint}</p>
              <div className="space-y-3">
                {GATEWAY_META.map((g) => {
                  const cfg = gws[g.id] ?? {};
                  const enabled = Boolean(cfg.enabled);
                  const Icon = g.icon;
                  const setGw = (patch: Record<string, unknown>) =>
                    setGws((prev) => ({ ...prev, [g.id]: { ...(prev[g.id] ?? {}), ...patch } }));
                  return (
                    <div key={g.id} className="rounded-xl border border-border bg-surface-2 p-3.5">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => setGw({ enabled: e.target.checked })}
                          className="h-4 w-4 accent-yellow"
                        />
                        <Icon className="h-5 w-5 text-yellow" aria-hidden />
                        <span className="flex-1 font-heading text-sm font-semibold text-text">
                          {en ? g.en : g.vi}
                        </span>
                        <span className="text-xs text-text-subtle">{t.show}</span>
                      </label>

                      {/* Bank transfer -> thông tin ngân hàng */}
                      {enabled && g.id === "bank_transfer" ? (
                        <div className="mt-3 space-y-2 pl-7">
                          {formField("bank_name", "Vietcombank")}
                          {formField("bank_account", "0123456789")}
                          {formField("bank_holder", "NGUYEN VAN A")}
                        </div>
                      ) : null}

                      {/* Momo -> số Momo + ảnh QR */}
                      {enabled && g.id === "momo" ? (
                        <div className="mt-3 space-y-3 pl-7">
                          {formField("momo_number", "0900000000")}
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
                        </div>
                      ) : null}

                      {/* Cổng ngoài (stripe/crypto/paypal) -> field cấu hình */}
                      {enabled && !g.builtin && g.fields.length > 0 ? (
                        <div className="mt-3 space-y-2 pl-7">
                          {g.fields.map((f) => (
                            <div key={f.key}>
                              <Label htmlFor={`${g.id}-${f.key}`}>{en ? f.en : f.vi}</Label>
                              <Input
                                id={`${g.id}-${f.key}`}
                                type={f.secret ? "password" : "text"}
                                value={typeof cfg[f.key] === "string" ? (cfg[f.key] as string) : ""}
                                placeholder={f.placeholder}
                                onChange={(e) => setGw({ [f.key]: e.target.value })}
                              />
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Xử lý đơn */}
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

            {/* Xóa đơn hàng — trạng thái nào được phép xóa */}
            <div className="border-t border-border pt-4">
              <p className="font-heading text-sm font-semibold text-text">{t.delTitle}</p>
              <p className="mb-3 mt-0.5 text-xs text-text-subtle">{t.delHint}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ORDER_STATUSES.map((st) => (
                  <label
                    key={st}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={delStatuses.has(st)}
                      onChange={(e) =>
                        setDelStatuses((prev) => {
                          const next = new Set(prev);
                          e.target.checked ? next.add(st) : next.delete(st);
                          return next;
                        })
                      }
                      className="h-4 w-4 accent-yellow"
                    />
                    <span className="text-sm text-text">{s.status[st]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tuyển CTV — bật/tắt đơn ứng tuyển cho khách */}
            <div className="border-t border-border pt-4">
              <p className="font-heading text-sm font-semibold text-text">{t.recruitTitle}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text">{t.recruitToggle}</p>
                  <p className="mt-0.5 text-xs text-text-subtle">{t.recruitHint}</p>
                </div>
                <Toggle
                  checked={ctvApplyOpen}
                  onCheckedChange={setCtvApplyOpen}
                  label={t.recruitToggle}
                />
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
