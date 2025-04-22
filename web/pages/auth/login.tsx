import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Eye, EyeOff, Loader } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      setIsSubmitting(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user, session } = await signIn(email, password);
      toast.success("Logged in successfully! Redirecting to Home...");
      router.push("/home");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const message = error.message || "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>SymptomSync | Log In</title>
        <meta
          name="description"
          content="Log in to your SymptomSync account to track and manage your health."
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
        <div className="bg-secondary w-full sm:w-1/2 flex-1 p-8 sm:py-12 sm:px-10 flex flex-col relative">
          <div className="absolute top-4 left-4">
            <Link
              href="/auth/signUp"
              className="border border-black px-4 py-1 rounded text-sm font-medium hover:text-white hover:bg-accent transition cursor-pointer"
            >
              Create Account
            </Link>
          </div>
          <div className="flex flex-col justify-center flex-1 max-w-md w-full mx-auto mt-12 sm:mt-0">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Log In</h2>

            <form onSubmit={handleSubmit}>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mb-4 px-4 py-2 rounded border border-gray-800 focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-foreground"
                required
              />

              <div className="relative mb-6">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mb-4 px-4 py-2 rounded border border-gray-800 focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-foreground"
                  required
                />
                <Button
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  variant="none"
                  aria-label="Toggle password visibility"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-2 right-2 flex items-center cursor-pointer h-5 w-5"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-600" />
                  )}
                </Button>
              </div>

              <Button
                type="submit"
                variant="default"
                aria-label="Log In"
                disabled={isSubmitting}
                className="cursor-pointer w-full bg-primary hover:bg-[#2c3f59] text-white py-2 rounded font-medium transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader className="animate-spin w-5 h-5" />}
                {isSubmitting ? "Logging in..." : "Log In"}
              </Button>

              <div className="text-right mb-4 mt-4 flex items-center justify-center gap-2">
                <Link
                  href="/auth/forgotPassword"
                  className="text-sm hover:underline cursor-pointer hover:text-blue-900"
                >
                  Forgot Password?
                </Link>
              </div>
            </form>

            <p className="text-sm text-center mt-3 text-black/90">
              By logging in, you agree to our{" "}
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

        <div className="bg-primary w-full sm:w-1/2 flex-1 p-8 sm:py-12 sm:px-10 flex flex-col">
          <div className="flex flex-col justify-between h-full">
            <div className="text-right mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                SymptomSync
              </h1>
            </div>
            <div className="mt-auto text-right">
              <h2 className="text-xl sm:text-2xl font-semibold text-white leading-snug">
                Track.
                <br />
                Understand.
                <br />
                Take Control of Your Health.
              </h2>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
