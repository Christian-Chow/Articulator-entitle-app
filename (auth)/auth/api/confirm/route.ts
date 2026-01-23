import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/src/utils/supabase/server';
import { EmailOtpType } from "@supabase/supabase-js";

/**
 * Server action to handle user email confirmation
 * 
 * Validates the confirmation token and updates the user's email status in Supabase Auth.
 * 
 * @param request - Next.js request object containing the confirmation token
 * @returns NextResponse indicating success or failure of the confirmation process
 */

export async function GET(request: NextRequest) {
  return handleVerification(request);
}

export async function POST(request: NextRequest) {
  return handleVerification(request);
}

async function handleVerification(request: NextRequest) {
  console.log("Handling email confirmation...");
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const redirectTo = new URL(next, baseUrl);

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    if (!error) {
        console.log("Email confirmed successfully", "Redirecting to:", redirectTo.toString());
        return NextResponse.redirect(redirectTo);
    }
  }

  

  console.error("Error confirming email:", "Invalid token or type");
  const errorRedirectto = new URL("/auth/confirm/error", baseUrl);
  return NextResponse.redirect(errorRedirectto);
}