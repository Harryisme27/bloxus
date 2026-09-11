// Cloudflare Pages Function: GET /api/auth/discord/login
// Bước 1 của đăng nhập Discord trên chính bloxus.store — xem server/discord-auth.ts.
import { handleLogin, type Env } from "../../../../server/discord-auth";

export const onRequestGet = ({ request, env }: { request: Request; env: Env }) => handleLogin(request, env);
