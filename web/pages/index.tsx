import React, { useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import { motion, useInView } from "framer-motion";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  BarChart2,
  Pill,
  Activity,
  FileText,
  Bell,
  HeartPulse,
  Smile,
  Star,
  User,
  CheckSquare,
  Zap,
  Clock,
  Lock,
  ThumbsUp,
  TrendingUp,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  Github,
} from "lucide-react";
import Head from "next/head";

// Dynamically import react-slick to avoid SSR issues
// This is intentional - we want to load this only on the client side since
// it is for client side interactions only
const Slider = dynamic(() => import("react-slick"), { ssr: false });

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PrevArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute left-0 top-1/2 z-10 transform -translate-y-1/2 bg-white text-primary p-2 rounded-full shadow hover:scale-105 cursor-pointer"
    >
      <ChevronLeft className="w-6 h-6" />
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute right-0 top-1/2 z-10 transform -translate-y-1/2 bg-white text-primary p-2 rounded-full shadow hover:scale-105 cursor-pointer"
    >
      <ChevronRight className="w-6 h-6" />
    </button>
  );
}

/**
 * An animated component that fades in when it comes into view, for a smoother user experience
 *
 * @param param0 - Props for the AnimatedInView component
 * @returns - A motion.div that animates its children when they come into view
 */
function AnimatedInView({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, amount: 0.3 });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { delay, duration: 0.5 } },
      }}
    >
      {children}
    </motion.div>
  );
}

const sliderSettings = {
  dots: true,
  arrows: true,
  infinite: true,
  autoplay: true,
  autoplaySpeed: 2500,
  speed: 500,
  slidesToShow: 3,
  slidesToScroll: 1,
  prevArrow: <PrevArrow />,
  nextArrow: <NextArrow />,
  responsive: [
    {
      breakpoint: 1024,
      settings: { slidesToShow: 2 },
    },
    {
      breakpoint: 640,
      settings: { slidesToShow: 1 },
    },
  ],
};

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setUser(user);
    };

    fetchUser();
  }, []);

  return (
    <>
      <Head>
        <title>SymptomSync | Welcome</title>
        <meta
          name="description"
          content="Your health companion to track, understand, and manage your daily health seamlessly."
        />
      </Head>
      <div className={`${inter.className} font-sans overflow-x-hidden`}>
        {/* Gotta override the default scroll behavior */}
        {/* This is a workaround for smooth scrolling */}
        <style jsx global>{`
          html {
            scroll-behavior: smooth;
          }

          html,
          body {
            overscroll-behavior: none;
          }
        `}</style>

        <section className="bg-primary text-primary-foreground min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute animate-spin-slow rounded-full border-8 border-solid border-primary border-t-transparent w-96 h-96 -top-20 -left-20"></div>
          </div>
          <AnimatedInView delay={0}>
            <h1 className="text-5xl md:text-7xl font-bold mb-4">SymptomSync</h1>
          </AnimatedInView>
          <AnimatedInView delay={0.2}>
            <p className="text-lg md:text-2xl mb-8">
              Your Health Companion – Track, understand, and manage your daily
              health with ease.
            </p>
          </AnimatedInView>
          <AnimatedInView delay={0.4}>
            <Link
              href={user ? "/home" : "/auth/login"}
              className="inline-block"
            >
              <Button
                variant="default"
                className="bg-white text-primary rounded-full px-8 py-4 text-lg hover:scale-105 hover:shadow-2xl hover:text-white cursor-pointer"
              >
                {user ? "Continue Your Journey" : "Get Started"}
              </Button>
            </Link>
          </AnimatedInView>
          <AnimatedInView delay={0.6}>
            <Link href="#features" className="inline-block mt-4">
              <Button
                variant="ghost"
                className="text-white rounded-full px-8 py-4 text-lg cursor-pointer transform transition-transform duration-300 hover:translate-y-2"
              >
                Learn More
                <ArrowDown className="w-5 h-5 ml-2 inline-block" />
              </Button>
            </Link>
          </AnimatedInView>
        </section>

        <section
          id="features"
          className="bg-background text-foreground py-20 px-4"
        >
          <AnimatedInView
            delay={0}
            className="max-w-6xl mx-auto text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Features</h2>
            <p className="text-lg text-muted-foreground">
              Our advanced tools for comprehensive health tracking.
            </p>
          </AnimatedInView>
          <AnimatedInView
            delay={0.1}
            className="max-w-6xl mx-auto overflow-hidden"
          >
            <Slider {...sliderSettings}>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <CalendarDays className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Daily Tracking
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 text-center text-muted-foreground">
                      Log your daily health metrics seamlessly.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <BarChart2 className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 text-center text-muted-foreground">
                      Visualize trends in your health data.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <Pill className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Med Reminders
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 text-center text-muted-foreground">
                      Get timely medication reminders.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <HeartPulse className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        AI Health Assistant
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 text-center text-muted-foreground">
                      Get personalized health advice anytime.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <Activity className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Health Log
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 text-center text-muted-foreground">
                      Record your daily health activities and symptoms.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <FileText className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 text-center text-muted-foreground">
                      Generate detailed health reports.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <Bell className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Custom Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 text-center text-muted-foreground">
                      Set alerts for your health milestones.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <ThumbsUp className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Dark/Light Modes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      Choose your preferred theme for a personalized experience.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
            </Slider>
          </AnimatedInView>
        </section>

        <section className="bg-background text-foreground py-20 px-4">
          <AnimatedInView
            delay={0}
            className="max-w-6xl mx-auto text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Testimonials</h2>
            <p className="text-lg text-muted-foreground">
              Hear what our users have to say.
            </p>
          </AnimatedInView>
          <AnimatedInView
            delay={0.1}
            className="max-w-6xl mx-auto overflow-hidden"
          >
            <Slider {...sliderSettings}>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-38 shadow-lg">
                    <CardContent className="flex flex-col justify-evenly text-center">
                      <p className="italic">
                        &quot;SymptomSync transformed my health journey. I can
                        finally track my progress!&quot;
                      </p>
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        <Smile className="w-6 h-6 text-primary" />
                        <span className="font-bold">— Alex</span>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-38 shadow-lg">
                    <CardContent className="flex flex-col justify-evenly text-center">
                      <p className="italic">
                        &quot;The medication reminders keep me on track – life
                        changing!&quot;
                      </p>
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        <HeartPulse className="w-6 h-6 text-primary" />
                        <span className="font-bold">— Jamie</span>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-38 shadow-lg">
                    <CardContent className="flex flex-col justify-evenly text-center">
                      <p className="italic">
                        &quot;The detailed reports pinpoint exactly where I need
                        to improve.&quot;
                      </p>
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        <Star className="w-6 h-6 text-primary" />
                        <span className="font-bold">— Pat</span>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-38 shadow-lg">
                    <CardContent className="flex flex-col justify-evenly text-center">
                      <p className="italic">
                        &quot;The custom alerts and insights truly set
                        SymptomSync apart.&quot;
                      </p>
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        <CheckSquare className="w-6 h-6 text-primary" />
                        <span className="font-bold">— Morgan</span>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-38 shadow-lg">
                    <CardContent className="flex flex-col justify-evenly text-center">
                      <p className="italic">
                        &quot;I love the AI health assistant – it feels like
                        having a personal coach!&quot;
                      </p>
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        <Zap className="w-6 h-6 text-primary" />
                        <span className="font-bold">— Taylor</span>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
            </Slider>
          </AnimatedInView>
        </section>

        <section className="bg-background text-foreground py-20 px-4">
          <AnimatedInView
            delay={0}
            className="max-w-6xl mx-auto text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              A simple process to boost your health.
            </p>
          </AnimatedInView>
          <AnimatedInView
            delay={0.1}
            className="max-w-6xl mx-auto overflow-hidden"
          >
            <Slider {...sliderSettings}>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <User className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Sign Up
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      Create your account in minutes.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <CalendarDays className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Log Health
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      Track your daily metrics effortlessly.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <BarChart2 className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Analyze Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      Uncover insights to improve your wellness.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <Bell className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Get Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      Receive timely notifications.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <Activity className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Chat with AI
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      Engage with our AI health assistant for personalized
                      advice.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <HeartPulse className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Stay Healthy
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      Monitor your health and stay on track.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <Zap className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Boost Wellness
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      Experience a healthier, happier you.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <Clock className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Save Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      Spend less time worrying, more time living.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
            </Slider>
          </AnimatedInView>
        </section>

        <section className="bg-background text-foreground py-20 px-4">
          <AnimatedInView
            delay={0}
            className="max-w-6xl mx-auto text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Why Choose SymptomSync</h2>
            <p className="text-lg text-muted-foreground">
              Discover the benefits that set us apart.
            </p>
          </AnimatedInView>
          <AnimatedInView
            delay={0.1}
            className="max-w-6xl mx-auto overflow-hidden"
          >
            <Slider {...sliderSettings}>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <ThumbsUp className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        User-Friendly
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      Intuitive design that&apos;s easy for everyone.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <Lock className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Data Privacy
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      Your information is secure and confidential.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <Zap className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Reliable Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      Optimized for speed and consistency.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <Shield className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Secure Tracking
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      State-of-the-art security for your data.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <TrendingUp className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Innovative Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      Cutting-edge analytics to elevate your wellness.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <HeartPulse className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        AI Health Assistant
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      Get personalized health advice anytime.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <Clock className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        24/7 Support
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      We&apos;re here for you around the clock.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
              <div className="px-4">
                <AnimatedInView>
                  <Card className="h-64 shadow-lg">
                    <CardHeader className="flex flex-col items-center">
                      <CheckSquare className="w-16 h-16 text-primary" />
                      <CardTitle className="text-2xl font-bold">
                        Comprehensive Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                      All-in-one platform for your health needs.
                    </CardContent>
                  </Card>
                </AnimatedInView>
              </div>
            </Slider>
          </AnimatedInView>
        </section>

        <section className="bg-background text-foreground py-20 px-4">
          <AnimatedInView
            delay={0}
            className="max-w-6xl mx-auto text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Find answers to our most common queries.
            </p>
          </AnimatedInView>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {[
              {
                q: "How secure is my data?",
                a: `Your data is always encrypted and stored securely. We use the
            latest security protocols to ensure your information is safe.
            We never share your data with third parties without your
            consent.`,
              },
              {
                q: "Can I access detailed reports?",
                a: `Yes. Our dashboard offers in-depth health reports with
            interactive charts and insights. You can also export your
            health reports as PDFs from the Documents page for easy
            sharing with healthcare providers.`,
              },
              {
                q: "How do I set reminders?",
                a: `Simply navigate to the Home page, then add your
            medications/appointments with a due date/time to receive
            timely reminders!`,
              },
              {
                q: "Is customer support available 24/7?",
                a: `Absolutely! Our support team is here around the clock. Send an
            email to <a href="mailto:hoangson091104@gmail.com" className="text-primary underline">our support email</a> for assistance.`,
              },
              {
                q: "Is there a chatbot for quick questions?",
                a: `Yes, our AI-powered chatbot is available 24/7 to answer your
            questions and give you health advice. Just navigate to the
            Chatbot page to start a conversation!`,
              },
              {
                q: "How do I log my health information?",
                a: `You can log your health information directly from the Home
            page. Just click on the "Log Health" button and fill
            in your daily metrics. It's quick and easy! Your
            dashboard will automatically update with your latest entries,
            allowing you to track your health trends over time.`,
              },
              {
                q: "How do I view my upcoming appointments/medications in a calendar?",
                a: `You can view your upcoming appointments and medications in the
            Calendar page. It provides a clear overview of your schedule,
            allowing you to stay organized and never miss an important
            date. You can also add medications and appointments directly
            from the Calendar page, making it easy to keep track of your
            health commitments!`,
              },
              {
                q: "Is there a mobile app available?",
                a: `Unfortunately, our platform is only available as a web
            application at the moment. However, it is fully responsive and
            works seamlessly on mobile devices. We are actively working on
            a mobile app version, so stay tuned for updates!`,
              },
            ].map(({ q, a }, idx) => (
              <AnimatedInView key={idx} delay={0.1 * (idx + 1)}>
                <Card className="h-full flex flex-col shadow-lg rounded-lg p-6 hover:shadow-xl hover:scale-102 duration-300 transition-transform">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{q}</h3>
                    <p
                      className="text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: a }}
                    />
                  </div>
                </Card>
              </AnimatedInView>
            ))}
          </div>
        </section>

        <section className="bg-primary text-primary-foreground py-20 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute animate-spin-slow rounded-full border-8 border-solid border-primary border-t-transparent w-72 h-72 -bottom-16 -right-16"></div>
          </div>
          <AnimatedInView delay={0.2} className="max-w-4xl mx-auto relative">
            <h2 className="text-4xl font-bold mb-4">
              Take Control of Your Health Today
            </h2>
            <p className="text-lg mb-8">
              Join thousands of users transforming their health journey with
              SymptomSync.
            </p>
            <motion.a
              href={user ? "/home" : "/auth/signUp"}
              className="inline-block shadow-2xl rounded-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="default"
                className="rounded-full px-10 py-4 text-lg shadow-3xl hover:shadow-3xl hover:bg-white hover:text-foreground cursor-pointer"
              >
                {user ? "Continue Your Journey" : "Sign Up for Free!"}
              </Button>
            </motion.a>
          </AnimatedInView>
        </section>

        <footer className="bg-background text-foreground py-8 px-4 text-center shadow-lg">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm whitespace-nowrap">
              © {new Date().getFullYear()}{" "}
              <strong className="font-bold">SymptomSync</strong>. All rights
              reserved.
            </p>
            <div className="mt-4 md:mt-0 flex flex-wrap items-center justify-center md:justify-end gap-4">
              <Link
                href="/privacy"
                className="flex items-center hover:text-primary transition-colors whitespace-nowrap"
              >
                <Shield className="w-4 h-4 mr-1" />
                <span className="text-sm">Privacy Policy</span>
              </Link>
              <Link
                href="/terms"
                className="flex items-center hover:text-primary transition-colors whitespace-nowrap"
              >
                <FileText className="w-4 h-4 mr-1" />
                <span className="text-sm">Terms of Service</span>
              </Link>
              <Link
                href="https://github.com/hoangsonww/SymptomSync-Health-App"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:text-primary transition-colors whitespace-nowrap"
              >
                <Github className="w-4 h-4 mr-1" />
                <span className="text-sm">GitHub Repository</span>
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
