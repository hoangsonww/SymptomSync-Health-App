import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Trash2,
  Loader2,
  Download,
  Eye,
  Plus,
  Tag,
  Search,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Edit3,
} from "lucide-react";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { fetchUserFiles, uploadUserFile } from "@/lib/files";
import { motion } from "framer-motion";
import Head from "next/head";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type FileRow = {
  id: string;
  filename: string;
  url: string;
  file_type: string;
  uploaded_at: string;
  tags?: string[];
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const ITEMS_PER_PAGE = 50;

export default function DocumentsPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [customFilename, setCustomFilename] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const [selectedForReport, setSelectedForReport] = useState<string[]>([]);
  const [reportProcessing, setReportProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcastChannelRef = useRef<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileRow | null>(null);
  const [editFilename, setEditFilename] = useState("");
  const [editTagsInput, setEditTagsInput] = useState("");

  useQuery({
    queryKey: ["files", currentPage],
    queryFn: async () => {
      await fetchFiles();
      return true;
    },
  });

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

  async function fetchFiles() {
    setLoadingFiles(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("User not logged in");
      setLoadingFiles(false);
      return;
    }
    try {
      const docs = await fetchUserFiles(user.id, currentPage);
      setFiles(docs);

      const { count, error: countError } = await supabase
        .from("files")
        .select("id", { count: "exact", head: true })
        .eq("user_profile_id", user.id);
      if (countError) {
        console.error("Error fetching documents count:", countError);
      } else {
        setTotalDocuments(count || 0);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to fetch files");
    }
    setLoadingFiles(false);
  }

  /**
   * Triggered when the user clicks the upload button. Handles the file upload process
   *
   * @returns void
   */
  async function handleUpload() {
    if (!fileToUpload) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("User not logged in");
      return;
    }
    setUploading(true);
    try {
      let fileToProcess = fileToUpload;
      if (customFilename.trim()) {
        fileToProcess = new File([fileToUpload], customFilename.trim(), {
          type: fileToUpload.type,
        });
      }

      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");
      const newFile = await uploadUserFile(fileToProcess, user.id, tags);
      setFiles((prev) => [newFile, ...prev]);
      toast.success("File uploaded successfully");

      setFileToUpload(null);
      setCustomFilename("");
      setTagsInput("");
      setDialogOpen(false);
      fetchFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  /**
   * Handles the download of a file. Creates a temporary link to download the file
   *
   * @param url - The URL of the file to download
   * @param filename - The name of the file to save as
   */
  async function handleDownload(url: string, filename: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  }

  /**
   * Handles the download of all files. Iterates through each file and triggers the download
   */
  function handleDownloadAll() {
    files.forEach((file) => {
      handleDownload(file.url, file.filename);
    });
  }

  /**
   * Opens the edit dialog for a specific file. Sets the editing file and its current values
   * in the state, so they can be modified by the user.
   *
   * @param file - The file object to be edited
   */
  function openEditDialog(file: FileRow) {
    setEditingFile(file);
    setEditFilename(file.filename);
    setEditTagsInput(file.tags?.join(", ") || "");
    setEditDialogOpen(true);
  }

  /**
   * Handles saving the edited file metadata. Updates the file's name and tags in the database
   * and updates the local state to reflect the changes.
   */
  async function handleSaveEdit() {
    if (!editingFile) return;
    const newTags = editTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      const { error } = await supabase
        .from("files")
        .update({ filename: editFilename.trim(), tags: newTags })
        .eq("id", editingFile.id);
      if (error) throw error;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === editingFile.id
            ? { ...f, filename: editFilename.trim(), tags: newTags }
            : f,
        ),
      );
      toast.success("Metadata updated");
      setEditDialogOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update");
    }
  }

  /**
   * Handles exporting a consolidated health report PDF. Creates a new PDF
   * document, adds a title page, and appends selected files to it.
   * The user can select which files to include in the report.
   */
  async function handleExportHealthReport() {
    if (selectedForReport.length === 0) {
      toast.error("Please select at least one document.");
      return;
    }
    setReportProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      const titlePage = mergedPdf.addPage();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { width, height } = titlePage.getSize();
      const font = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
      const fontSize = 24;
      titlePage.drawText("SymptomSync - Your Health Report", {
        x: 50,
        y: height - 4 * fontSize,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      for (const fileId of selectedForReport) {
        const file = files.find((f) => f.id === fileId);
        if (!file) continue;
        const ext = file.filename.split(".").pop()?.toLowerCase();
        const arrayBuffer = await fetch(file.url).then((res) =>
          res.arrayBuffer(),
        );

        if (ext === "pdf") {
          const donorPdf = await PDFDocument.load(arrayBuffer);
          const pages = await mergedPdf.copyPages(
            donorPdf,
            donorPdf.getPageIndices(),
          );
          pages.forEach((p) => mergedPdf.addPage(p));
        } else if (["png", "jpg", "jpeg"].includes(ext || "")) {
          let img;
          if (ext === "png") {
            img = await mergedPdf.embedPng(arrayBuffer);
          } else {
            img = await mergedPdf.embedJpg(arrayBuffer);
          }
          const dims = img.scale(1);
          const imgPage = mergedPdf.addPage([dims.width, dims.height]);
          imgPage.drawImage(img, {
            x: 0,
            y: 0,
            width: dims.width,
            height: dims.height,
          });
        }
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Health_Report.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setHealthDialogOpen(false);
      setSelectedForReport([]);
      toast.success("Health report exported successfully");
    } catch (error) {
      console.error("Error creating health report:", error);
      toast.error("Failed to export health report");
    } finally {
      setReportProcessing(false);
    }
  }

  const filteredFiles = files.filter((file) =>
    file.filename.toLowerCase().includes(search.toLowerCase()),
  );

  // Pagination logic: Ensure that only 50 items or fewer are shown per page
  const startIndex =
    filteredFiles.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endIndex = (currentPage - 1) * ITEMS_PER_PAGE + filteredFiles.length;

  return (
    <>
      <Head>
        <title>SymptomSync | Your Documents</title>
        <meta
          name="description"
          content="View and manage your health documents."
        />
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
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 pt-2">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col md:flex-row justify-between items-center mb-6"
              >
                <motion.div variants={slideInLeft}>
                  <h1 className="text-3xl font-extrabold">Your Documents 📝</h1>
                  <motion.p
                    variants={fadeInUp}
                    className="text-foreground mt-2 text-center md:text-left"
                  >
                    All Your Health Files, In One Place!
                  </motion.p>
                </motion.div>
              </motion.div>

              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mt-4 md:mt-0">
                <div className="relative w-full max-w-md">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search a Document..."
                    className="w-full pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto justify-center">
                  <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                  >
                    <Button
                      onClick={handleDownloadAll}
                      className="whitespace-nowrap flex items-center gap-2 cursor-pointer"
                      variant="secondary"
                    >
                      <Download size={18} />
                      Export All
                    </Button>
                  </motion.div>

                  <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                  >
                    <Button
                      onClick={() => setHealthDialogOpen(true)}
                      className="whitespace-nowrap flex items-center gap-2 cursor-pointer"
                      variant="secondary"
                    >
                      <HeartPulse size={18} />
                      Export Health Report
                    </Button>

                    <Dialog
                      open={healthDialogOpen}
                      onOpenChange={setHealthDialogOpen}
                    >
                      <DialogContent className="max-w-lg w-full">
                        <DialogHeader>
                          <DialogTitle>Export Health Report</DialogTitle>
                          <DialogDescription>
                            Select which PDF or image documents you would like
                            to include in your consolidated health report.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 max-h-64 overflow-y-auto">
                          {filteredFiles
                            .filter(
                              (file) =>
                                file.file_type === "application/pdf" ||
                                file.file_type.startsWith("image/"),
                            )
                            .map((file) => (
                              <label
                                key={file.id}
                                className="flex items-center gap-2 mb-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedForReport.includes(file.id)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedForReport((prev) =>
                                      checked
                                        ? [...prev, file.id]
                                        : prev.filter((id) => id !== file.id),
                                    );
                                  }}
                                />
                                <span>{file.filename}</span>
                              </label>
                            ))}
                          {filteredFiles.filter(
                            (file) =>
                              file.file_type === "application/pdf" ||
                              file.file_type.startsWith("image/"),
                          ).length === 0 && (
                            <p className="text-gray-500">
                              No PDF or image documents available.
                            </p>
                          )}
                        </div>
                        <div className="flex justify-end gap-4 mt-4">
                          <Button
                            variant="secondary"
                            onClick={() => setHealthDialogOpen(false)}
                            className="cursor-pointer"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleExportHealthReport}
                            disabled={reportProcessing}
                            className="cursor-pointer"
                          >
                            {reportProcessing ? (
                              <Loader2 className="animate-spin h-4 w-4" />
                            ) : (
                              "Export"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </motion.div>

                  <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                  >
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="whitespace-nowrap flex items-center gap-2 cursor-pointer">
                          <Plus className="mr-2 h-4 w-4" /> New Document
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload Document</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 mt-4">
                          <Input
                            type="file"
                            onChange={(e) =>
                              setFileToUpload(e.target.files?.[0] || null)
                            }
                            className="cursor-pointer"
                          />
                          <Input
                            placeholder="Custom Filename (optional)"
                            value={customFilename}
                            onChange={(e) => setCustomFilename(e.target.value)}
                            className="py-2"
                          />
                          <Input
                            placeholder="Enter tags, separated by commas (optional)"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            className="py-2"
                          />
                          <Button
                            onClick={handleUpload}
                            disabled={!fileToUpload || uploading}
                            className="mt-2 cursor-pointer"
                          >
                            {uploading ? (
                              <Loader2 className="animate-spin h-4 w-4" />
                            ) : (
                              "Upload"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </motion.div>
                </div>
              </div>
            </div>

            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card className="shadow-lg m-0">
                <CardContent className="p-0 m-0">
                  <div className="overflow-x-auto p-0 m-0">
                    <table className="min-w-full text-sm table-auto m-0">
                      <thead className="bg-primary text-white sticky top-0 z-10 m-0">
                        <tr className="m-0">
                          <th className="text-left p-4 m-0">Document Name</th>
                          <th className="text-left p-4 m-0">File Type</th>
                          <th className="text-left p-4 m-0">Uploaded</th>
                          <th className="text-left p-4 m-0">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="m-0">
                        {loadingFiles ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center">
                              <Loader2 className="animate-spin inline h-6 w-6" />
                            </td>
                          </tr>
                        ) : filteredFiles.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="p-4 text-center text-gray-500"
                            >
                              No documents found.
                            </td>
                          </tr>
                        ) : (
                          filteredFiles.map((file) => (
                            <tr
                              key={file.id}
                              className="border-b transition-all duration-150 ease-in-out m-0"
                            >
                              <td className="p-4 whitespace-nowrap">
                                <div className="font-medium">
                                  {file.filename}
                                </div>
                                {file.tags && file.tags.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
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
                              </td>
                              <td className="p-4 whitespace-nowrap capitalize">
                                {file.file_type}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                {format(
                                  new Date(file.uploaded_at),
                                  "MMM d, yyyy",
                                )}
                              </td>
                              <TooltipProvider>
                                <td className="p-4 flex gap-3 m-0">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <motion.div
                                        variants={fadeInUp}
                                        initial="hidden"
                                        animate="visible"
                                      >
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            router.push(`/files/${file.id}`)
                                          }
                                          className="transition-transform transform hover:scale-105 cursor-pointer"
                                        >
                                          <Eye size={18} />
                                        </Button>
                                      </motion.div>
                                    </TooltipTrigger>
                                    <TooltipContent>View</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <motion.div
                                        variants={fadeInUp}
                                        initial="hidden"
                                        animate="visible"
                                      >
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => openEditDialog(file)}
                                          className="transition-transform transform hover:scale-105 cursor-pointer"
                                        >
                                          <Edit3 size={18} />
                                        </Button>
                                      </motion.div>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <motion.div
                                        variants={fadeInUp}
                                        initial="hidden"
                                        animate="visible"
                                      >
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            handleDownload(
                                              file.url,
                                              file.filename,
                                            )
                                          }
                                          className="transition-transform transform hover:scale-105 cursor-pointer"
                                        >
                                          <Download size={18} />
                                        </Button>
                                      </motion.div>
                                    </TooltipTrigger>
                                    <TooltipContent>Export</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <motion.div
                                        variants={fadeInUp}
                                        initial="hidden"
                                        animate="visible"
                                      >
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-red-500 transition-transform transform hover:scale-105 cursor-pointer"
                                          onClick={() => {
                                            setFileToDelete(file.id);
                                            setConfirmDeleteDialogOpen(true);
                                          }}
                                        >
                                          <Trash2 size={18} />
                                        </Button>
                                      </motion.div>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                  </Tooltip>
                                </td>
                              </TooltipProvider>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="mt-4 flex items-center justify-end gap-4">
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
              >
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  variant="outline"
                  className="cursor-pointer"
                >
                  <ChevronLeft size={18} />
                  <span>Previous</span>
                </Button>
              </motion.div>
              <div className="text-foreground">
                {startIndex} - {endIndex} of {totalDocuments}
              </div>
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
              >
                <Button
                  disabled={endIndex >= totalDocuments}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  variant="outline"
                  className="cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight size={18} />
                </Button>
              </motion.div>
            </div>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="max-w-sm w-full">
                <DialogHeader>
                  <DialogTitle>Edit File Info</DialogTitle>
                  <DialogDescription>
                    Update filename and tags (comma‑separated).
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 mt-4">
                  <Input
                    value={editFilename}
                    onChange={(e) => setEditFilename(e.target.value)}
                    placeholder="Filename"
                  />
                  <Input
                    value={editTagsInput}
                    onChange={(e) => setEditTagsInput(e.target.value)}
                    placeholder="Tags, comma‑separated"
                  />
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => setEditDialogOpen(false)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit} className="cursor-pointer">
                    Save
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={confirmDeleteDialogOpen}
              onOpenChange={setConfirmDeleteDialogOpen}
            >
              <DialogContent className="max-w-sm w-full">
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this file?
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-4 mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setConfirmDeleteDialogOpen(false);
                      setFileToDelete(null);
                    }}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (fileToDelete) {
                        try {
                          await supabase
                            .from("files")
                            .delete()
                            .eq("id", fileToDelete);
                          toast.success("File deleted successfully");
                          fetchFiles();
                        } catch (error) {
                          console.error("Error deleting file:", error);
                          toast.error("Failed to delete file");
                        }
                      }
                      setConfirmDeleteDialogOpen(false);
                      setFileToDelete(null);
                    }}
                    className="cursor-pointer"
                  >
                    Yes, Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </>
  );
}
