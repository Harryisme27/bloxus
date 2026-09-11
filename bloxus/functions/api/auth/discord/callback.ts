// Cloudflare Pages Function: GET /api/auth/discord/callback
// Discord gọi về đây kèm ?code=&state= — xem server/discord-auth.ts.
import { handleCallback, type Env } from "../../../../server/discord-auth";

export const onRequestGet = ({ request, env }: { request: Request; env: Env }) => handleCallback(request, env);
