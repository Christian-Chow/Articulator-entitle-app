import { Metadata } from "next";
import ConfirmEmail from "@/src/components/Auth/confirm-email";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Confirm Email - Articulator",
  description: "This is Confirm Email page for ArticulatorAI",
  // other metadata
};

const ConfirmEmailPage = () => {
  return (
    <Suspense>
      <ConfirmEmail />
    </Suspense>
  );
};

export default ConfirmEmailPage;
