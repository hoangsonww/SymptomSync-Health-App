import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Upload, Eye, Plus } from "lucide-react";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FileRow {
  id: string;
  filename: string;
  url: string;
  file_type: string;
  uploaded_at: string;
}

export default function DocumentsPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) console.error("Error fetching files:", error);
    else setFiles(data || []);
  }

  async function handleUpload() {
    if (!fileToUpload) return;
    setUploading(true);
  
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      alert("User not logged in");
      return;
    }
  
    const fileExt = fileToUpload.name.split(".").pop();
    const fileName = `${Date.now()}-${fileToUpload.name}`;
    const filePath = `documents/${fileName}`;
  
    console.log("Uploading file to storage...");
  
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, fileToUpload);
  
    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      setUploading(false);
      return;
    }
  
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;
  
    console.log("Public URL:", publicUrl);
  
    const { error: insertError } = await supabase.from("files").insert({
      user_profile_id: user.id,
      filename: fileToUpload.name,
      url: publicUrl,
      file_type: fileExt,
      uploaded_at: new Date(),
    });
  
    if (insertError) {
      console.error("Insert error:", insertError);
    } else {
      console.log("Inserted successfully into files table");
      setFileToUpload(null);
      fetchFiles(); // refreshing view
    }
  
    setUploading(false);
  }
  
  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <h1 className="text-3xl font-bold">Your Documents</h1>
          <p className="text-muted-foreground mb-6">
            All Your Health Files, In One Place!
          </p>

          {/* Search & Upload */}
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Search a Document..."
              className="w-full max-w-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* Upload Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                <Input
                  type="file"
                  onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                />
                <Button
                  onClick={handleUpload}
                  disabled={!fileToUpload || uploading}
                  className="mt-4 w-full"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left p-3">Document Name</th>
                    <th className="text-left p-3">File Type</th>
                    <th className="text-left p-3">Uploaded</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{file.filename}</td>
                      <td className="p-3 capitalize">{file.file_type}</td>
                      <td>{format(new Date(file.uploaded_at), "MMM d, yyyy")}</td>
                      
                      <TooltipProvider>
                      <td className="p-3 flex gap-2">
                        {/* View */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(file.url, "_blank")}
                        >
                          <Eye size={16} />
                        </Button>
                        </TooltipTrigger>
                        <TooltipContent>View</TooltipContent>
                      </Tooltip>

                        {/* Download */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Upload size={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download</TooltipContent>
                        </Tooltip>
                        
                        {/* Delete */}
                        <Tooltip>
                        <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={async () => {
                            await supabase.from("files").delete().eq("id", file.id);
                            fetchFiles();
                          }}>
                          <Trash2 size={16} />
                        </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </td>
                      </TooltipProvider>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
