import { Metadata } from "next";
import Signin from "@/src/components/Auth/Signin";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Login - Articulator",
  description: "This is Login page for ArticulatorAI",
  // other metadata
};

const SigninPage = () => {
  return (
    <Suspense>
      <Signin />
    </Suspense>
  );
};

export default SigninPage;
