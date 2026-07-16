import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User2, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle } from "lucide-react";
import { AuthCard } from "@/components/account/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";

export function Register() {
  const user = useAuthStore((state) => state.user);
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agree) {
      setError("Bạn cần đồng ý với Điều khoản dịch vụ để tiếp tục.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu cần tối thiểu 6 ký tự.");
      return;
    }

    setSubmitting(true);
    const result = await register({ username, email, password });
    if (result.success) {
      // Nếu Confirm email đang bật, đăng ký xong chưa có phiên — hướng người
      // dùng sang trang đăng nhập sau khi xác nhận email.
      if (useAuthStore.getState().session) {
        toast.success("Tạo tài khoản thành công", {
          description: "Chào mừng bạn đến với Uniemarket!",
        });
        navigate("/dashboard", { replace: true });
      } else {
        toast.info("Kiểm tra email để xác nhận tài khoản", {
          description: "Sau khi xác nhận, hãy đăng nhập lại.",
        });
        navigate("/login", { replace: true });
      }
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Tạo tài khoản"
      subtitle="Đăng ký miễn phí để theo dõi đơn hàng và mua sắm nhanh hơn."
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-yellow hover:text-yellow-hover">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="reg-username">Tên hiển thị</Label>
          <div className="relative">
            <User2
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
              aria-hidden
            />
            <Input
              id="reg-username"
              type="text"
              autoComplete="username"
              placeholder="VD: KhoiNguyen"
              className="pl-9"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <p className="mt-1 text-xs text-text-subtle">
            Tên in-game để nhận hàng sẽ được hỏi riêng cho từng đơn hàng.
          </p>
        </div>

        <div>
          <Label htmlFor="reg-email">Email</Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
              aria-hidden
            />
            <Input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder="ban@email.com"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="reg-password">Mật khẩu</Label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
              aria-hidden
            />
            <Input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Tối thiểu 6 ký tự"
              className="px-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle transition-colors hover:text-text"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border-strong bg-surface-2 accent-yellow"
            required
          />
          <span>
            Tôi đồng ý với{" "}
            <Link to="/terms" className="text-yellow hover:text-yellow-hover">
              Điều khoản dịch vụ
            </Link>{" "}
            và{" "}
            <Link to="/privacy" className="text-yellow hover:text-yellow-hover">
              Chính sách bảo mật
            </Link>
            .
          </span>
        </label>

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
          <UserPlus className="h-4 w-4" aria-hidden />
          {submitting ? "Đang tạo tài khoản…" : "Đăng ký"}
        </Button>
      </form>
    </AuthCard>
  );
}
