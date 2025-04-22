import React, { useState } from "react";
import Link from "next/link";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Head from "next/head";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }
    try {
      setIsSubmitting(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/updatePassword`,
      });

      if (error) throw error;

      toast.success("Reset link sent! Check your email.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>SymptomSync | Forgot Password</title>
        <meta
          name="description"
          content="Reset your password to access your SymptomSync account."
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
              Forgot Password
            </h2>
            <form onSubmit={handleReset}>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mb-6 px-4 py-2 rounded border border-gray-800 focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-foreground"
                required
              />

              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting}
                className="w-full cursor-pointer bg-primary hover:bg-[#2c3f59] text-white py-2 rounded font-medium transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader className="animate-spin w-5 h-5" />}
                {isSubmitting ? "Sending..." : "Send Reset Link"}
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
                Reconnect.
                <br />
                Continue Your Health Journey.
              </h2>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
