"use server";

import { signOut } from "@/auth";
import { currentUser } from "../session";
import { AccountError, deleteAccount } from "../services/account";

export async function deleteMyAccount(): Promise<{ ok: false; error: string } | void> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "UNAUTHENTICATED" };
  try {
    await deleteAccount(user.id);
  } catch (e) {
    if (e instanceof AccountError) return { ok: false, error: e.message };
    throw e;
  }
  await signOut({ redirectTo: "/" });
}
