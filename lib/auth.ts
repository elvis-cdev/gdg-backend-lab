import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
const COOKIE = "gdg_lab_session";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
export async function createSession(userId: string) {
  const raw = randomBytes(32).toString("base64url");
  await db.session.create({data:{tokenHash:sha(raw),userId,expiresAt:new Date(Date.now()+7*86400000)}});
  (await cookies()).set(COOKIE,raw,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:7*86400});
}
export async function currentUser() {
  const raw=(await cookies()).get(COOKIE)?.value;
  if(!raw)return null;
  const session=await db.session.findUnique({where:{tokenHash:sha(raw)},include:{user:true}});
  if(!session || session.expiresAt < new Date())return null;
  return session.user;
}
export async function destroySession() {
  const raw=(await cookies()).get(COOKIE)?.value;
  if(raw)await db.session.deleteMany({where:{tokenHash:sha(raw)}});
  (await cookies()).delete(COOKIE);
}
