import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AtSign,
  Bell,
  Globe,
  LogOut,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User2,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RequireAuth } from "@/components/account/RequireAuth";
import { useAuthStore } from "@/store/authStore";
import { updateMyProfile } from "@/lib/db/profiles";
import { relativeTime } from "@/lib/format";
import type { UserRole } from "@/types/db";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Quản trị viên",
  ctv: "Cộng tác viên",
  customer: "Khách hàng",
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Profile() {
  // Guard lives in RequireAuth (redirects to /login and remembers this page).
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

/** Split out so hooks can run unconditionally after the auth guard above. */
function ProfileContent() {
  const user = useAuthStore((state) => state.user)!;
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const navigate = useNavigate();

  const email = session?.user.email ?? "";

  const [displayName, setDisplayName] = useState(user.display_name ?? user.username);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [discord, setDiscord] = useState(user.discord ?? "");
  const [language, setLanguage] = useState("vi");
  const [emailNotif, setEmailNotif] = useState(true);
  const [orderNotif, setOrderNotif] = useState(true);
  const [promoNotif, setPromoNotif] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyProfile({
        display_name: displayName.trim() || user.username,
        phone: phone.trim() || null,
        discord: discord.trim() || null,
      });
      await refreshProfile();
      toast.success("Đã lưu hồ sơ", { description: "Thông tin của bạn đã được cập nhật." });
    } catch (err) {
      toast.error("Không lưu được hồ sơ", {
        description: err instanceof Error ? err.message : "Vui lòng thử lại.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    toast("Đã đăng xuất");
    navigate("/");
  }

  return (
    <PageContainer className="py-10 sm:py-14">
      <SectionHeading
        eyebrow="Tài khoản"
        title="Hồ sơ của tôi"
        description="Quản lý thông tin cá nhân và kênh liên hệ để đội ngũ giao hàng hỗ trợ bạn nhanh nhất."
        action={
          <Button variant="danger" size="md" onClick={handleLogout}>
            <LogOut className="h-4 w-4" aria-hidden />
            Đăng xuất
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Identity card */}
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-yellow font-heading text-2xl font-extrabold text-text-on-yellow">
                {initials(user.display_name ?? user.username)}
              </div>
              <h2 className="mt-4 font-heading text-xl font-bold text-text">
                {user.display_name ?? user.username}
              </h2>
              <p className="text-sm text-text-muted">{email}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Badge variant={user.role === "customer" ? "outline" : "gold"}>
                  {ROLE_LABELS[user.role]}
                </Badge>
                <Badge variant="green">
                  <ShieldCheck className="h-3 w-3" aria-hidden />@{user.username}
                </Badge>
              </div>
              <p className="mt-4 text-xs text-text-subtle">
                Thành viên từ {relativeTime(user.created_at)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Editable form */}
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User2 className="h-4 w-4 text-yellow" aria-hidden />
                Thông tin cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="pf-name">Tên hiển thị</Label>
                <Input
                  id="pf-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="pf-email">Email đăng nhập</Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                    aria-hidden
                  />
                  <Input id="pf-email" type="email" className="pl-9" value={email} disabled />
                </div>
                <p className="mt-1 text-xs text-text-subtle">
                  Email gắn với tài khoản đăng nhập, không đổi được tại đây.
                </p>
              </div>
              <div>
                <Label htmlFor="pf-phone">Số điện thoại</Label>
                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                    aria-hidden
                  />
                  <Input
                    id="pf-phone"
                    className="pl-9"
                    placeholder="VD: 09xx xxx xxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="pf-discord">Discord</Label>
                <div className="relative">
                  <AtSign
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                    aria-hidden
                  />
                  <Input
                    id="pf-discord"
                    className="pl-9"
                    placeholder="VD: username#0000"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-yellow" aria-hidden />
                Tùy chọn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pf-lang" className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-text-subtle" aria-hidden />
                  Ngôn ngữ
                </Label>
                <Select
                  id="pf-lang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="max-w-xs"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </Select>
              </div>

              <fieldset className="space-y-2 border-t border-border pt-4">
                <legend className="mb-1 text-sm font-medium text-text-muted">Thông báo</legend>
                <ToggleRow
                  label="Email cập nhật đơn hàng"
                  description="Nhận email khi trạng thái đơn hàng thay đổi."
                  checked={orderNotif}
                  onChange={setOrderNotif}
                />
                <ToggleRow
                  label="Thông báo hệ thống"
                  description="Nhắc nhở đăng nhập, bảo mật tài khoản."
                  checked={emailNotif}
                  onChange={setEmailNotif}
                />
                <ToggleRow
                  label="Ưu đãi & khuyến mãi"
                  description="Nhận tin về flash sale và mã giảm giá."
                  checked={promoNotif}
                  onChange={setPromoNotif}
                />
              </fieldset>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs text-text-subtle">
              <ShieldCheck className="h-3.5 w-3.5 text-green" aria-hidden />
              Thông tin cá nhân được lưu an toàn trên máy chủ.
            </p>
            <Button type="submit" variant="primary" size="lg" disabled={saving}>
              <Save className="h-4 w-4" aria-hidden />
              {saving ? "Đang lưu…" : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2.5 transition-colors hover:border-border-strong">
      <span>
        <span className="block text-sm font-medium text-text">{label}</span>
        <span className="block text-xs text-text-subtle">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-strong bg-surface-2 accent-yellow"
      />
    </label>
  );
}
