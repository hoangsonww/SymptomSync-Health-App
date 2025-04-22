import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Eye, EyeOff, Loader } from "lucide-react";
import { toast } from "sonner";
import Head from "next/head";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export default function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        toast.error("Session not found. Try requesting a new reset link.");
        router.push("/auth/forgot");
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password updated! Redirecting...");
      router.push("/home");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>SymptomSync | Update Password</title>
        <meta
          name="description"
          content="Set a new password for your SymptomSync account."
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
              href="/auth/login"
              className="border border-black px-4 py-1 rounded text-sm font-medium hover:text-white hover:bg-accent transition"
            >
              Back to Login
            </Link>
          </div>

          <div className="flex flex-col justify-center flex-1 max-w-md w-full mx-auto mt-12 sm:mt-0">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">
              Set New Password
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="relative mb-4">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full mb-4 px-4 py-2 rounded border border-gray-800 focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-foreground"
                />
                <Button
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  variant="none"
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
                  required
                  className="w-full mb-4 px-4 py-2 rounded border border-gray-800 focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-foreground"
                />
                <Button
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  variant="none"
                  aria-label="Toggle password visibility"
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
                type="submit"
                variant="default"
                disabled={isSubmitting}
                className="cursor-pointer w-full bg-primary hover:bg-[#2c3f59] text-white py-2 rounded font-medium transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader className="animate-spin w-5 h-5" />}
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </form>
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
                Reset.
                <br />
                Renew.
                <br />
                Reclaim Control of Your Health.
              </h2>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
