import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logout berhasil",
  });

  response.cookies.delete("warga_access_token");
  response.cookies.delete("warga_refresh_token");

  return response;
}

