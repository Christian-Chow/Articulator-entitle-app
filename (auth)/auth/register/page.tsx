import Signup from "@/src/components/Auth/Signup";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Articulator",
  description: "This is Sign Up page for ArticulatorAI",
  // other metadata
};

export default function Register() {
  return (
    <>
      <Signup />
    </>
  );
}
