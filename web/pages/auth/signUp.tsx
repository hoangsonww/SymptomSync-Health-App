import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Eye, EyeOff, Loader } from "lucide-react";
import { toast } from "sonner";
import { signUp } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Head from "next/head";

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      setIsSubmitting(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user, session } = await signUp(email, password);
      toast.success("Signed up successfully! Redirecting...");
      router.push("/home");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || "Sign up failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>SymptomSync | Sign Up</title>
        <meta
          name="description"
          content="Create an account to track and manage your health with SymptomSync."
        />
      </Head>
      <div className="h-screen flex flex-col sm:flex-row">
        <style jsx global>{`
          html {
            scroll-behavior: smooth;
          }

          html,
          body {
            overscroll-behavior: none;
          }
        `}</style>
        <div className="bg-primary text-white w-full sm:w-1/2 flex-1 flex flex-col p-8 sm:py-12 sm:px-10">
          <div className="flex flex-col justify-between h-full">
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold">SymptomSync</h1>
            </div>
            <div className="mt-auto">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">
                Track. <br />
                Understand. <br />
                Take Control of Your Health.
              </h2>
            </div>
          </div>
        </div>

        <div className="bg-secondary w-full sm:w-1/2 flex-1 p-8 sm:py-12 sm:px-10 relative flex flex-col">
          <div className="absolute top-4 right-4">
            <Link
              href="/auth/login"
              className="border border-black px-4 py-1 rounded text-sm font-medium hover:text-white hover:bg-accent transition"
            >
              Login
            </Link>
          </div>

          <div className="flex flex-col justify-center flex-1 max-w-md w-full mx-auto mt-8 sm:mt-0">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">
              Create Account
            </h2>

            <form onSubmit={handleSubmit}>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                className="w-full mb-4 px-4 py-2 rounded border border-gray-800 focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-foreground"
                required
              />

              <div className="relative mb-4">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  className="w-full mb-4 px-4 py-2 rounded border border-gray-800 focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-foreground"
                  required
                />
                <Button
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  variant="none"
                  type="button"
                  aria-label="Toggle password visibility"
                  className="absolute inset-y-2 right-2 flex items-center cursor-pointer h-5 w-5"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-600" />
                  )}
                </Button>
              </div>

              <div className="relative mb-6">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  className="w-full mb-4 px-4 py-2 rounded border border-gray-800 focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-foreground"
                  required
                />
                <Button
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  variant="none"
                  aria-label="Toggle confirm password visibility"
                  type="button"
                  className="absolute inset-y-2 right-2 flex items-center cursor-pointer h-5 w-5"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-600" />
                  )}
                </Button>
              </div>

              <Button
                variant="default"
                aria-label="Sign Up"
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer bg-primary hover:bg-[#2c3f59] text-white py-2 rounded font-medium transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader className="animate-spin w-5 h-5" />}
                {isSubmitting ? "Signing up..." : "Sign up with Email"}
              </Button>
            </form>

            <p className="text-sm text-center mt-3 text-black/90">
              By clicking continue, you agree to our{" "}
              <Link href="/terms" className="underline cursor-pointer">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline cursor-pointer">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
