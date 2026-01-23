import { Metadata } from "next";
import Reset from "@/src/components/Auth/reset";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reset Password - Articulator",
  description: "This is Reset Password page for ArticulatorAI",
  // other metadata
};

const SigninPage = () => {
  return (
    <Suspense>
      <Reset />
    </Suspense>
  );
};

export default SigninPage;
