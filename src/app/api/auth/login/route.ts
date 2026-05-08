import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const targetHash = "f370146d4e4d840d8e42800d2cf5c096f396d6cbf5586cca2d0253d0cc90aad4";
    const currentHash = crypto.createHash('sha256').update(password).digest('hex');

    console.log(`Intento de login - Pass length: ${password.length}`);

    if (currentHash === targetHash) {
      const cookieStore = await cookies();
      cookieStore.set("auth_session", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      });
      return NextResponse.json({ success: true });
    }

    return new NextResponse("Unauthorized", { status: 401 });
  } catch (error) {
    console.error("Login Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
