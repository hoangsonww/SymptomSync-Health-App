import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  User,
  Search,
  Trash2,
  Edit,
  UploadCloud,
  Tag,
  CalendarDays,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCurrentProfile,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  searchProfiles,
  type Profile,
} from "@/lib/profile";
import { supabase } from "@/lib/supabaseClient";
import Head from "next/head";

// A simple debounce hook to limit frequent search calls
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

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

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [profileLoading, setProfileLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [conditionTags, setConditionTags] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const profileToDisplay = selectedProfile || profile;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcastChannelRef = useRef<any>(null);

  useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        data: { user },
      } = await supabase.auth.getUser();
      const data = await getCurrentProfile();
      if (!data) {
        router.push("/auth/login");
        return null;
      }
      setProfile(data);
      setFullName(data.full_name || data.email);
      setConditionTags((data.condition_tags || []).join(", "));
      setLoading(false);
      return data;
    },
    enabled: true,
  });

  useQuery({
    queryKey: ["profileSearch", debouncedSearchQuery],
    queryFn: async () => {
      if (debouncedSearchQuery.trim() === "") {
        setSearchResults([]);
        return [];
      }
      setSearchLoading(true);
      try {
        const results = await searchProfiles(debouncedSearchQuery.trim());
        setSearchResults(results);
        return results;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast.error("Error searching profiles: " + error.message);
        return [];
      } finally {
        setSearchLoading(false);
      }
    },
    enabled: true,
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

  /**
   * Handles the change event for the avatar file input
   *
   * @param e - The change event from the file input
   */
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAvatarFile(e.target.files[0]);
    }
  };

  /**
   * Handles the form submission to update the profile
   *
   * @param e - The form event
   */
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      let avatar_url = profile?.avatar_url || null;
      if (avatarFile) {
        avatar_url = await uploadAvatar(avatarFile);
      }
      const tagsArray = conditionTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      const updatedProfile = await updateProfile({
        full_name: fullName,
        avatar_url,
        condition_tags: tagsArray,
      });
      setProfile(updatedProfile);
      toast.success("Profile updated successfully!");
      setEditDialogOpen(false);
      setAvatarFile(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error("Error updating profile: " + error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  /**
   * Handles the removal of the avatar
   */
  const handleRemoveAvatar = async () => {
    setProfileLoading(true);
    try {
      await removeAvatar();
      const updatedProfile = await updateProfile({
        full_name: fullName,
        avatar_url: null,
        condition_tags: profile?.condition_tags,
      });
      setProfile(updatedProfile);
      toast.success("Avatar removed successfully!");

      window.location.reload();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error("Error removing avatar: " + error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>
          SymptomSync |{" "}
          {profileToDisplay?.id === profile?.id
            ? "Your Profile"
            : `Viewing ${profileToDisplay?.full_name || profileToDisplay?.email}'s Profile`}{" "}
        </title>
        <meta name="description" content="View and update your profile" />
      </Head>

      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
        <style jsx global>{`
          html {
            scroll-behavior: smooth;
          }

          html,
          body {
            overscroll-behavior: none;
          }
        `}</style>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto space-y-8 pt-2 bg-background"
        >
          <motion.header
            variants={slideInLeft}
            className="text-center md:text-left"
          >
            <h1 className="text-3xl text-foreground font-bold">
              {profileToDisplay?.id === profile?.id
                ? "Your Profile 🙋‍♂️"
                : `Viewing ${profileToDisplay?.full_name || profileToDisplay?.email}'s Profile 🧐`}
            </h1>
            <p className="text-lg text-foreground mt-1">
              {profileToDisplay?.email}
            </p>
          </motion.header>

          <motion.div variants={fadeInUp} className="mb-8">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </span>
              <Input
                placeholder="Search profiles by name or email…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedProfile(null);
                }}
                className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 cursor-pointer"
              />
              {searchLoading && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
                </span>
              )}
            </div>
            {searchResults.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 border border-gray-300 rounded-md p-2 max-h-60 overflow-y-auto bg-white text-gray-900 shadow-lg"
              >
                {searchResults.slice(0, 5).map((usr) => (
                  <motion.li
                    key={usr.id}
                    className="p-2 cursor-pointer flex items-center space-x-3 rounded hover:bg-gray-200 transition-colors"
                    onClick={() => {
                      setSelectedProfile(usr);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                  >
                    <Avatar className="w-8 h-8">
                      {usr.avatar_url ? (
                        <AvatarImage
                          src={usr.avatar_url}
                          alt={usr.full_name || usr.email}
                        />
                      ) : (
                        <AvatarFallback>
                          <User className="w-5 h-5 text-foreground" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="font-medium truncate">
                      {usr.full_name || usr.email}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="p-6 flex flex-col sm:flex-row items-center shadow-2xl rounded-xl bg-background gap-0 overflow-hidden">
              <Avatar className="ml-2 w-24 h-24">
                {profileToDisplay?.avatar_url ? (
                  <AvatarImage
                    src={profileToDisplay.avatar_url}
                    alt={profileToDisplay.full_name || profileToDisplay.email}
                  />
                ) : (
                  <AvatarFallback>
                    <User className="w-10 h-10" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="mt-4 sm:mt-0 sm:ml-6 flex-1 text-left w-full">
                <h2 className="text-3xl font-bold truncate">
                  {profileToDisplay?.full_name || "Unnamed User"}
                </h2>
                <p className="text-md text-foreground truncate">
                  {profileToDisplay?.email}
                </p>
                <p className="text-sm text-foreground flex items-center mt-1 truncate">
                  <CalendarDays className="w-4 h-4 mr-1" /> Joined:{" "}
                  {profileToDisplay?.created_at
                    ? new Date(profileToDisplay.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
                {(profileToDisplay?.condition_tags || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(profileToDisplay?.condition_tags || []).map(
                      (tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-secondary text-background rounded-full text-xs flex items-center truncate"
                        >
                          <Tag className="w-4 h-4 mr-1" /> {tag}
                        </span>
                      ),
                    )}
                  </div>
                )}
              </div>
              {profileToDisplay?.id === profile?.id && (
                <div className="mt-4 sm:mt-0">
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <Edit className="mr-2 w-4 h-4" /> Edit Profile
                  </Button>
                </div>
              )}
            </Card>

            {profileToDisplay?.id !== profile?.id && (
              <div className="mt-4 flex justify-center items-center">
                <Button
                  variant="outline"
                  className="mt-4 cursor-pointer"
                  onClick={() => {
                    setSelectedProfile(null);
                    setSearchQuery("");
                  }}
                >
                  <ChevronLeft className="mr-2 w-4 h-4" /> Back to Your Profile
                </Button>
              </div>
            )}
          </motion.div>

          {profileToDisplay?.id === profile?.id && (
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="bg-background p-8 rounded-xl shadow-2xl max-w-lg mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    Edit Your Profile
                  </DialogTitle>
                  <DialogDescription className="text-foreground">
                    Update your full name, avatar, and condition tags.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateProfile} className="space-y-6 mt-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Avatar className="w-16 h-16">
                      {avatarFile ? (
                        <AvatarImage
                          src={URL.createObjectURL(avatarFile)}
                          alt="New Avatar"
                        />
                      ) : profileToDisplay?.avatar_url ? (
                        <AvatarImage
                          src={profileToDisplay.avatar_url}
                          alt={
                            profileToDisplay.full_name || profileToDisplay.email
                          }
                        />
                      ) : (
                        <AvatarFallback>
                          <User className="w-8 h-8" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <Label
                        htmlFor="avatar"
                        className="mb-1 block text-foreground"
                      >
                        Change Avatar
                      </Label>
                      <Input
                        type="file"
                        id="avatar"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="border border-gray-300 rounded-md p-0 pl-2 h-8 flex items-center hover:bg-background cursor-pointer"
                      />
                      {profileToDisplay?.avatar_url && !avatarFile && (
                        <Button
                          variant="destructive"
                          onClick={handleRemoveAvatar}
                          className="mt-2 w-full sm:w-auto cursor-pointer"
                        >
                          <Trash2 className="mr-1 w-4 h-4" /> Remove Avatar
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="fullName" className="mb-2 text-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full border border-gray-300 rounded-md p-2 cursor-pointer pl-4"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="conditionTags"
                      className="mb-2 text-foreground"
                    >
                      Conditions (comma separated)
                    </Label>
                    <Input
                      id="conditionTags"
                      type="text"
                      value={conditionTags}
                      onChange={(e) => setConditionTags(e.target.value)}
                      placeholder="e.g., Diabetes, Hypertension"
                      className="w-full border border-gray-300 rounded-md p-2 cursor-pointer pl-4"
                    />
                  </div>
                  <DialogFooter className="mt-6 flex justify-end gap-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setEditDialogOpen(false)}
                      className="hover:scale-105 transition-transform cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="hover:scale-105 transition-transform cursor-pointer"
                    >
                      <UploadCloud className="mr-2 w-4 h-4" /> Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>
      </div>
    </>
  );
}
