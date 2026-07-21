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
import { usePick } from "@/i18n";

const STR = {
  vi: {
    roles: {
      admin: "Quản trị viên",
      ctv: "Người bán",
      customer: "Khách hàng",
    } as Record<UserRole, string>,
    saved: "Đã lưu hồ sơ",
    savedDesc: "Thông tin của bạn đã được cập nhật.",
    saveFailed: "Không lưu được hồ sơ",
    tryAgain: "Vui lòng thử lại.",
    loggedOut: "Đã đăng xuất",
    eyebrow: "Tài khoản",
    title: "Hồ sơ của tôi",
    description:
      "Quản lý thông tin cá nhân và kênh liên hệ để đội ngũ giao hàng hỗ trợ bạn nhanh nhất.",
    logOut: "Đăng xuất",
    memberSince: "Thành viên từ ",
    personalInfo: "Thông tin cá nhân",
    displayName: "Tên hiển thị",
    loginEmail: "Email đăng nhập",
    emailHint: "Email gắn với tài khoản đăng nhập, không đổi được tại đây.",
    phone: "Số điện thoại",
    phonePlaceholder: "VD: 09xx xxx xxx",
    discordPlaceholder: "VD: username#0000",
    preferences: "Tùy chọn",
    language: "Ngôn ngữ",
    notifications: "Thông báo",
    orderNotifLabel: "Email cập nhật đơn hàng",
    orderNotifDesc: "Nhận email khi trạng thái đơn hàng thay đổi.",
    systemNotifLabel: "Thông báo hệ thống",
    systemNotifDesc: "Nhắc nhở đăng nhập, bảo mật tài khoản.",
    promoNotifLabel: "Ưu đãi & khuyến mãi",
    promoNotifDesc: "Nhận tin về flash sale và mã giảm giá.",
    secureNote: "Thông tin cá nhân được lưu an toàn trên máy chủ.",
    saving: "Đang lưu…",
    saveChanges: "Lưu thay đổi",
  },
  en: {
    roles: {
      admin: "Administrator",
      ctv: "Seller",
      customer: "Customer",
    } as Record<UserRole, string>,
    saved: "Profile saved",
    savedDesc: "Your information has been updated.",
    saveFailed: "Couldn't save your profile",
    tryAgain: "Please try again.",
    loggedOut: "Logged out",
    eyebrow: "Account",
    title: "My profile",
    description:
      "Manage your personal information and contact channels so the delivery team can help you faster.",
    logOut: "Log out",
    memberSince: "Member since ",
    personalInfo: "Personal information",
    displayName: "Display name",
    loginEmail: "Login email",
    emailHint: "This email is tied to your login account and can't be changed here.",
    phone: "Phone number",
    phonePlaceholder: "e.g. 09xx xxx xxx",
    discordPlaceholder: "e.g. username#0000",
    preferences: "Preferences",
    language: "Language",
    notifications: "Notifications",
    orderNotifLabel: "Order update emails",
    orderNotifDesc: "Get an email when your order status changes.",
    systemNotifLabel: "System notifications",
    systemNotifDesc: "Reminders about sign-ins and account security.",
    promoNotifLabel: "Offers & promotions",
    promoNotifDesc: "News about flash sales and discount codes.",
    secureNote: "Your personal information is stored securely on the server.",
    saving: "Saving…",
    saveChanges: "Save changes",
  },
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
  const t = usePick(STR);
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
      toast.success(t.saved, { description: t.savedDesc });
    } catch (err) {
      toast.error(t.saveFailed, {
        description: err instanceof Error ? err.message : t.tryAgain,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    toast(t.loggedOut);
    navigate("/");
  }

  return (
    <PageContainer className="py-10 sm:py-14">
      <SectionHeading
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        action={
          <Button variant="danger" size="md" onClick={handleLogout}>
            <LogOut className="h-4 w-4" aria-hidden />
            {t.logOut}
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
                  {t.roles[user.role]}
                </Badge>
                <Badge variant="green">
                  <ShieldCheck className="h-3 w-3" aria-hidden />@{user.username}
                </Badge>
              </div>
              <p className="mt-4 text-xs text-text-subtle">
                {t.memberSince}
                {relativeTime(user.created_at)}
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
                {t.personalInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="pf-name">{t.displayName}</Label>
                <Input
                  id="pf-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="pf-email">{t.loginEmail}</Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                    aria-hidden
                  />
                  <Input id="pf-email" type="email" className="pl-9" value={email} disabled />
                </div>
                <p className="mt-1 text-xs text-text-subtle">{t.emailHint}</p>
              </div>
              <div>
                <Label htmlFor="pf-phone">{t.phone}</Label>
                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                    aria-hidden
                  />
                  <Input
                    id="pf-phone"
                    className="pl-9"
                    placeholder={t.phonePlaceholder}
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
                    placeholder={t.discordPlaceholder}
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
                {t.preferences}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pf-lang" className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-text-subtle" aria-hidden />
                  {t.language}
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
                <legend className="mb-1 text-sm font-medium text-text-muted">{t.notifications}</legend>
                <ToggleRow
                  label={t.orderNotifLabel}
                  description={t.orderNotifDesc}
                  checked={orderNotif}
                  onChange={setOrderNotif}
                />
                <ToggleRow
                  label={t.systemNotifLabel}
                  description={t.systemNotifDesc}
                  checked={emailNotif}
                  onChange={setEmailNotif}
                />
                <ToggleRow
                  label={t.promoNotifLabel}
                  description={t.promoNotifDesc}
                  checked={promoNotif}
                  onChange={setPromoNotif}
                />
              </fieldset>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs text-text-subtle">
              <ShieldCheck className="h-3.5 w-3.5 text-green" aria-hidden />
              {t.secureNote}
            </p>
            <Button type="submit" variant="primary" size="lg" disabled={saving}>
              <Save className="h-4 w-4" aria-hidden />
              {saving ? t.saving : t.saveChanges}
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
