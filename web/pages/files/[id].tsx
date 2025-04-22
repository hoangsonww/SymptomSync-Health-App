"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { fetchFileDetails, FileRow } from "@/lib/fileDetails";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Tag, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import Head from "next/head";

export default function FileViewPage() {
  const router = useRouter();
  const { id } = router.query;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcastChannelRef = useRef<any>(null);

  /**
   * Using React Query to fetch file details and handle loading and error states.
   * Only using React Query for this page since it depends on the file ID from the URL,
   * so using React Query might mitigate the race condition of the file ID being undefined
   * or if the user selects one file then another one before the first one is loaded.
   * Other pages, including the dashboard, are not too prone to race conditions since
   * they are not dependent on the URL (and data is always fetched for this particular
   * signed in user).
   */
  const {
    data: file,
    isLoading,
    error,
  } = useQuery<FileRow | null, Error>({
    queryKey: ["file", id],
    queryFn: async () => {
      if (!id || Array.isArray(id))
        throw new Error("Invalid file id - File not found");

      const { file, error } = await fetchFileDetails(id);

      if (error) {
        if (error.message === "User not authenticated") {
          router.push("/auth/login");
          return null;
        }
        if (error.message.toLowerCase().includes("no rows")) {
          return null;
        }
        throw new Error("Failed to fetch file - File not found");
      }

      return file!;
    },
    enabled: !!id,
    retry: false,
  });

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  useEffect(() => {
    async function subscribeToUserChannel() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const userChannelName = `user-channel-${user.id}`;
      broadcastChannelRef.current = supabase.channel(userChannelName, {
        config: { broadcast: { self: false } },
      });
      const channel = broadcastChannelRef.current;

      channel
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("broadcast", { event: "*" }, (payload: any) => {
          toast.success(
            `Notification: ${payload.payload.message.replace(/\./g, "")} from another device or tab.`,
          );
        })
        .subscribe((status: string) => {
          console.log("User-specific channel status:", status);
        });

      return () => {
        supabase.removeChannel(channel);
        broadcastChannelRef.current = null;
      };
    }

    subscribeToUserChannel();
  }, [router]);

  return (
    <>
      <Head>
        <title>SymptomSync | File View</title>
        <meta name="description" content="View your uploaded files" />
      </Head>

      <div className="flex flex-col min-h-screen">
        <style jsx global>{`
          html {
            scroll-behavior: smooth;
          }

          html,
          body {
            overscroll-behavior: none;
          }
        `}</style>

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={() => router.back()}
              className="mb-6 cursor-pointer"
            >
              <ChevronLeft />
              Back
            </Button>

            {!id || isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin h-8 w-8" />
              </div>
            ) : file ? (
              <>
                <h1 className="text-4xl font-extrabold text-foreground mb-2">
                  {file.filename}
                </h1>
                {file.tags && file.tags.length > 0 && (
                  <div className="mb-6 flex flex-wrap gap-1">
                    {file.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded"
                      >
                        <Tag size={12} /> {tag}
                      </span>
                    ))}
                  </div>
                )}
                <Card className="shadow-lg m-0">
                  <CardContent className="p-0 m-0">
                    {file.file_type.startsWith("image") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={file.url}
                        alt={file.filename}
                        className="w-full h-auto rounded-none transition-transform duration-300"
                      />
                    ) : file.file_type === "application/pdf" ? (
                      <iframe
                        src={file.url}
                        title={file.filename}
                        className="w-full h-screen rounded-none transition-opacity duration-300"
                      />
                    ) : (
                      <div className="p-6 text-center">
                        <p className="mb-4 text-gray-600">
                          Preview not available for this file type.
                        </p>
                        <a
                          href={file.url}
                          download={file.filename}
                          className="text-blue-600 underline"
                        >
                          Download File
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="text-center text-gray-600">File not found.</p>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
