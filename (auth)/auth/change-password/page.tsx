import { Metadata } from "next";
import ChangePassword from "@/src/components/Auth/change-password";
import { Suspense } from "react";

const ChangePasswordPage = () => {
  return (
    <Suspense>
      <ChangePassword />
    </Suspense>
  );
};

export default ChangePasswordPage;