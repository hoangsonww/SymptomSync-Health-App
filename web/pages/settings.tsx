import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion } from "framer-motion";
import { ChevronLeft, Bell, User, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NotificationSettings } from "@/components/NotificationSettings";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

type User = {
  id: string;
  [key: string]: unknown;
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
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/auth/login');
        return;
      }

      setUser(user as unknown as User);
      
      // Get auth token for API calls
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setAuthToken(session.access_token);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      toast.error('Authentication error');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    router.push('/home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Settings - SymptomSync</title>
        <meta name="description" content="Manage your SymptomSync settings and preferences" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
        <motion.div
          className="container mx-auto px-4 py-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div
            className="flex items-center justify-between mb-8"
            variants={slideInLeft}
          >
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleBackToHome}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">
                  Manage your preferences and account settings
                </p>
              </div>
            </div>
          </motion.div>

          {/* Settings Tabs */}
          <motion.div variants={slideInLeft}>
            <Tabs defaultValue="notifications" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="privacy" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Appearance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notifications" className="mt-6">
                <NotificationSettings 
                  userId={user.id} 
                  authToken={authToken} 
                />
              </TabsContent>

              <TabsContent value="account" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Account settings will be available in a future update.
                      For now, please use the Profile page to manage your account information.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => router.push('/profile')}
                    >
                      Go to Profile
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="privacy" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy & Security</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Privacy and security settings will be available in a future update.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appearance" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Appearance settings will be available in a future update.
                      The theme toggle is available in the navigation bar.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}