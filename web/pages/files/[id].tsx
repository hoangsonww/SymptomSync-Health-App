import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Tag, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import Head from "next/head";

type FileRow = {
  id: string;
  filename: string;
  url: string;
  file_type: string;
  uploaded_at: string;
  tags?: string[];
};

export default function FileViewPage() {
  const router = useRouter();
  const { id } = router.query;
  const [file, setFile] = useState<FileRow | null>(null);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchFile() {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        toast.error("Failed to fetch file");
        console.error("Error fetching file:", error);
      } else {
        setFile(data);
      }
      setLoading(false);
    }

    fetchFile();
  }, [id, router]);

  return (
    <>
      <Head>
        <title>SymptomSync | File View</title>
        <meta name="description" content="View your uploaded files" />
      </Head>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={() => router.back()}
              className="mb-6 cursor-pointer"
            >
              <ChevronLeft />
              Back
            </Button>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin h-8 w-8" />
              </div>
            ) : file ? (
              <>
                <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
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
                      // Using img instead of Next Image because Next Image uses up bandwidth and requires more
                      // configuration
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
