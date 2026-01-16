import React, { useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Manrope, Space_Grotesk } from "next/font/google";
import dynamic from "next/dynamic";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ArrowDown,
  ArrowUpRight,
  BarChart2,
  Bell,
  Bot,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Cpu,
  Database,
  FileText,
  GitBranch,
  Github,
  HeartPulse,
  Layers,
  LineChart,
  Lock,
  MessageSquare,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

// Dynamically import react-slick to avoid SSR issues
// This is intentional - we want to load this only on the client side since
// it is for client side interactions only
const Slider = dynamic(() => import("react-slick"), { ssr: false });

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PrevArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-lg transition-transform hover:scale-105 cursor-pointer"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-lg transition-transform hover:scale-105 cursor-pointer"
    >
      <ChevronRight className="h-5 w-5" />
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
  const inView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { delay, duration: 0.6 } },
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
  autoplaySpeed: 4000,
  speed: 600,
  slidesToShow: 2,
  slidesToScroll: 1,
  prevArrow: <PrevArrow />,
  nextArrow: <NextArrow />,
  responsive: [
    {
      breakpoint: 1024,
      settings: { slidesToShow: 2 },
    },
    {
      breakpoint: 768,
      settings: { slidesToShow: 1 },
    },
  ],
};

const heroStats = [
  {
    label: "AI Agents",
    value: "5",
    detail: "LangGraph assembly line",
    icon: Brain,
  },
  {
    label: "Deployment",
    value: "AWS + Terraform",
    detail: "Infrastructure as code",
    icon: Cloud,
  },
  {
    label: "Monitoring",
    value: "Prometheus + Grafana",
    detail: "Live operational signals",
    icon: LineChart,
  },
];

const techBadges = [
  "LangGraph",
  "LangChain",
  "MCP Server",
  "AWS",
  "Terraform",
  "Docker",
  "Supabase",
  "PostgreSQL",
  "Prometheus",
  "Grafana",
];

const moduleHighlights = [
  {
    title: "AI Symptom Chat",
    description:
      "Multi-agent assistants that analyze symptoms, assess risk, and guide next steps.",
    icon: Bot,
  },
  {
    title: "Medication + Appointment Reminders",
    description:
      "Schedule dose times, follow-ups, and notifications across every care plan.",
    icon: Bell,
  },
  {
    title: "Health Logs + Trends",
    description:
      "Track symptoms, vitals, and activities with analytics-ready timelines.",
    icon: Activity,
  },
  {
    title: "Smart Calendar",
    description: "Unified view for medications, appointments, and care events.",
    icon: CalendarDays,
  },
  {
    title: "Insights + Reports",
    description:
      "Generate summaries, PDF exports, and trend visualizations for clinicians.",
    icon: BarChart2,
  },
  {
    title: "Secure Document Vault",
    description:
      "Store files, lab results, and care plans with privacy-first controls.",
    icon: FileText,
  },
  {
    title: "Wellness Signals",
    description:
      "Daily check-ins that combine your logs with AI insights and alerts.",
    icon: HeartPulse,
  },
  {
    title: "Personalized Guidance",
    description:
      "Adaptive recommendations based on health history and current context.",
    icon: Sparkles,
  },
];

const aiPipeline = [
  {
    title: "Symptom Extraction",
    description:
      "Structured parsing of natural language input into clinical signals.",
    icon: Sparkles,
  },
  {
    title: "Knowledge Retrieval",
    description:
      "RAG workflows across curated medical sources and vector stores.",
    icon: Database,
  },
  {
    title: "Diagnostic Analysis",
    description:
      "Agentic reasoning to produce preliminary insights and hypotheses.",
    icon: Brain,
  },
  {
    title: "Risk Assessment",
    description:
      "Severity scoring with escalation logic and guardrails for safety.",
    icon: ShieldCheck,
  },
  {
    title: "Recommendation Engine",
    description:
      "Personalized next steps, care suggestions, and follow-up reminders.",
    icon: CheckCircle2,
  },
];

const infraHighlights = [
  {
    title: "AWS Cloud Stack",
    description: "ECS/Fargate, RDS, S3, and CloudWatch for scale and uptime.",
    icon: Cloud,
  },
  {
    title: "Terraform Infrastructure",
    description: "Repeatable environments with policy-driven provisioning.",
    icon: Layers,
  },
  {
    title: "Containerized Services",
    description: "Dockerized web, AI, and worker services for portability.",
    icon: Server,
  },
  {
    title: "CI/CD Pipelines",
    description: "Jenkins automation and quality gates for safe releases.",
    icon: GitBranch,
  },
  {
    title: "Observability",
    description: "Prometheus metrics, Grafana dashboards, and alerting.",
    icon: LineChart,
  },
  {
    title: "Data + Auth Layer",
    description: "PostgreSQL with Supabase auth, storage, and row-level rules.",
    icon: Database,
  },
];

const securityHighlights = [
  {
    title: "HIPAA-aligned patterns",
    description:
      "Security-first architecture with audit trails and access controls.",
    icon: Shield,
  },
  {
    title: "Encryption by default",
    description: "In-transit and at-rest encryption across services and data.",
    icon: Lock,
  },
  {
    title: "Operational resilience",
    description:
      "Automated alerts, backups, and recovery workflows to reduce risk.",
    icon: ShieldCheck,
  },
];

const testimonials = [
  {
    quote:
      "SymptomSync feels like a clinical assistant. The AI summaries save us hours every week.",
    name: "Dr. Alex Morgan",
    icon: Sparkles,
  },
  {
    quote:
      "The reminders and calendar make care plans actually stick. Patients stay on track.",
    name: "Jamie Patel",
    icon: HeartPulse,
  },
  {
    quote:
      "The infrastructure story is real. We deployed to AWS in days, not weeks. It's solid.",
    name: "Taylor Rios",
    icon: Cloud,
  },
  {
    quote:
      "Clean reports, beautiful dashboards, and a delightful UX. It feels enterprise-ready.",
    name: "Morgan Lee",
    icon: Star,
  },
];

const faqs = [
  {
    q: "How secure is my data?",
    a: "Your data is encrypted in transit and at rest, with access controls and audit-ready logs.",
  },
  {
    q: "Can I access detailed reports?",
    a: "Yes. The dashboard offers exports and downloadable reports to share with care teams.",
  },
  {
    q: "How do I set reminders?",
    a: "Add medications or appointments with a due date and SymptomSync handles the rest.",
  },
  {
    q: "Is the AI available 24/7?",
    a: "Absolutely. The AI assistant is always on and built for quick, reliable guidance.",
  },
  {
    q: "Does SymptomSync support deployment automation?",
    a: "Yes. Terraform, Docker, and CI/CD pipelines enable repeatable and safe releases.",
  },
  {
    q: "Is there a mobile app available?",
    a: "The platform is fully responsive today, and a dedicated mobile app is on the roadmap.",
  },
];

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
        <title>SymptomSync | AI-Driven Health Platform</title>
        <meta
          name="description"
          content="SymptomSync is an AI-powered health platform with multi-agent analysis, secure tracking, and cloud-native deployment on AWS and Terraform."
        />
      </Head>
      <div
        className={`${spaceGrotesk.variable} ${manrope.variable} landing font-sans overflow-x-hidden`}
      >
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

          .landing {
            font-family: var(--font-body);
            color: #0f172a;
          }

          .landing .font-display {
            font-family: var(--font-display);
            letter-spacing: -0.02em;
          }

          .landing-hero {
            position: relative;
            background:
              radial-gradient(
                1200px circle at 10% 10%,
                rgba(56, 189, 248, 0.35),
                transparent 55%
              ),
              radial-gradient(
                900px circle at 90% 20%,
                rgba(20, 184, 166, 0.35),
                transparent 55%
              ),
              linear-gradient(120deg, #0b1120 0%, #0f172a 60%, #0b1120 100%);
            color: #f8fafc;
          }

          .landing-hero::before {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(
              120deg,
              rgba(255, 255, 255, 0.08),
              transparent 40%,
              rgba(255, 255, 255, 0.06)
            );
            opacity: 0.7;
            animation: heroShimmer 14s ease-in-out infinite;
          }

          .landing-grid {
            position: absolute;
            inset: 0;
            background-image:
              linear-gradient(rgba(148, 163, 184, 0.2) 1px, transparent 1px),
              linear-gradient(
                90deg,
                rgba(148, 163, 184, 0.2) 1px,
                transparent 1px
              );
            background-size: 48px 48px;
            opacity: 0.2;
            animation: gridDrift 22s linear infinite;
          }

          .landing-orb {
            position: absolute;
            border-radius: 999px;
            filter: blur(40px);
            opacity: 0.6;
            animation: floatOrb 12s ease-in-out infinite;
          }

          .landing-orb.orb-one {
            width: 320px;
            height: 320px;
            background: rgba(14, 165, 233, 0.55);
            top: -120px;
            left: -120px;
          }

          .landing-orb.orb-two {
            width: 280px;
            height: 280px;
            background: rgba(20, 184, 166, 0.55);
            top: 140px;
            right: -80px;
            animation-delay: -3s;
          }

          .landing-orb.orb-three {
            width: 240px;
            height: 240px;
            background: rgba(125, 211, 252, 0.4);
            bottom: -120px;
            left: 30%;
            animation-delay: -6s;
          }

          .landing-panel {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(148, 163, 184, 0.2);
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35);
            backdrop-filter: blur(16px);
          }

          .hero-float {
            position: absolute;
            background: rgba(15, 23, 42, 0.75);
            border: 1px solid rgba(148, 163, 184, 0.2);
            backdrop-filter: blur(12px);
            animation: floatCard 10s ease-in-out infinite;
          }

          .hero-float.float-one {
            top: -40px;
            right: -20px;
            animation-delay: -2s;
          }

          .hero-float.float-two {
            bottom: -30px;
            left: -30px;
            animation-delay: -5s;
          }

          .landing-section {
            position: relative;
          }

          .landing-section::before {
            content: "";
            position: absolute;
            inset: 0;
            background: radial-gradient(
              700px circle at 80% 10%,
              rgba(14, 165, 233, 0.08),
              transparent 50%
            );
            pointer-events: none;
          }

          .landing-dark {
            position: relative;
            background:
              radial-gradient(
                1000px circle at 90% 0%,
                rgba(14, 116, 144, 0.45),
                transparent 55%
              ),
              linear-gradient(120deg, #0b1120 0%, #0f172a 70%, #0b1120 100%);
            color: #f8fafc;
          }

          .landing-dark::after {
            content: "";
            position: absolute;
            inset: 0;
            background-image: radial-gradient(
              rgba(148, 163, 184, 0.25) 1px,
              transparent 1px
            );
            background-size: 36px 36px;
            opacity: 0.15;
            pointer-events: none;
          }

          @keyframes heroShimmer {
            0% {
              transform: translateX(-20%);
              opacity: 0.5;
            }
            50% {
              transform: translateX(0%);
              opacity: 0.8;
            }
            100% {
              transform: translateX(20%);
              opacity: 0.5;
            }
          }

          @keyframes gridDrift {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(-48px, -48px, 0);
            }
          }

          @keyframes floatOrb {
            0% {
              transform: translate3d(0, 0, 0);
            }
            50% {
              transform: translate3d(10px, -20px, 0);
            }
            100% {
              transform: translate3d(0, 0, 0);
            }
          }

          @keyframes floatCard {
            0% {
              transform: translate3d(0, 0, 0);
            }
            50% {
              transform: translate3d(0, -12px, 0);
            }
            100% {
              transform: translate3d(0, 0, 0);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .landing * {
              animation: none !important;
              transition: none !important;
            }
          }
        `}</style>

        <section className="landing-hero min-h-screen overflow-hidden px-6 pb-20 pt-8">
          <div className="landing-grid" />
          <div className="landing-orb orb-one" />
          <div className="landing-orb orb-two" />
          <div className="landing-orb orb-three" />

          <div className="relative z-10 mx-auto flex max-w-6xl flex-col">
            <div className="flex items-center justify-between text-white/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <span className="font-display text-lg tracking-tight">
                  SymptomSync
                </span>
              </div>
              <nav className="hidden items-center gap-6 text-sm md:flex">
                <Link href="#modules" className="hover:text-white">
                  Modules
                </Link>
                <Link href="#ai-engine" className="hover:text-white">
                  AI Engine
                </Link>
                <Link href="#infrastructure" className="hover:text-white">
                  Infrastructure
                </Link>
                <Link href="#security" className="hover:text-white">
                  Security
                </Link>
              </nav>
              <div className="hidden md:block">
                <Link href={user ? "/home" : "/auth/login"}>
                  <Button className="rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer">
                    {user ? "Open Console" : "Sign In"}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-16 grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <AnimatedInView delay={0}>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white">
                      AI-driven health OS
                    </Badge>
                    <span className="text-sm text-white/70">
                      LangGraph + MCP orchestration
                    </span>
                  </div>
                </AnimatedInView>
                <AnimatedInView delay={0.1}>
                  <h1 className="font-display mt-6 text-4xl leading-tight text-white md:text-6xl">
                    Clinical-grade insight with an AI assistant built for care
                    teams.
                  </h1>
                </AnimatedInView>
                <AnimatedInView delay={0.2}>
                  <p className="mt-6 text-lg text-white/70 md:text-xl">
                    SymptomSync unifies symptom tracking, reminders, AI
                    analysis, and secure reporting in one platform. Deploy
                    confidently with AWS, Terraform, and enterprise-ready
                    observability.
                  </p>
                </AnimatedInView>
                <AnimatedInView delay={0.3}>
                  <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link href={user ? "/home" : "/auth/signUp"}>
                        <Button className="h-11 rounded-full bg-white text-slate-900 hover:bg-white/90 cursor-pointer">
                          {user ? "Continue your journey" : "Get started"}
                        </Button>
                      </Link>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link href="#modules">
                        <Button
                          variant="outline"
                          className="h-11 rounded-full border-white/30 bg-transparent text-white hover:bg-white/10 cursor-pointer"
                        >
                          Explore the platform
                          <ArrowDown className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </motion.div>
                  </div>
                  <p className="mt-4 text-sm text-white/60">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-white underline">
                      Sign in
                    </Link>
                  </p>
                </AnimatedInView>
                <AnimatedInView delay={0.4}>
                  <div className="mt-10 grid gap-4 sm:grid-cols-3">
                    {heroStats.map(({ label, value, detail, icon: Icon }) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4"
                      >
                        <div className="flex items-center gap-2 text-sm text-white/70">
                          <Icon className="h-4 w-4" />
                          {label}
                        </div>
                        <div className="mt-2 text-xl font-semibold text-white">
                          {value}
                        </div>
                        <p className="mt-1 text-xs text-white/60">{detail}</p>
                      </div>
                    ))}
                  </div>
                </AnimatedInView>
                <AnimatedInView delay={0.5}>
                  <div className="mt-8 flex flex-wrap gap-2">
                    {techBadges.map((item) => (
                      <Badge
                        key={item}
                        variant="outline"
                        className="border-white/20 bg-white/5 text-xs text-white/80"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </AnimatedInView>
              </div>

              <AnimatedInView delay={0.2} className="relative">
                <div className="landing-panel relative rounded-3xl p-6">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60">
                    <span>AI Command Center</span>
                    <span className="flex items-center gap-2 text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      Live
                    </span>
                  </div>
                  <div className="mt-6 grid gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">
                          AI Risk Radar
                        </span>
                        <span className="text-xs text-white/60">
                          Confidence 92%
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/10">
                        <motion.div
                          className="h-2 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-teal-300"
                          initial={{ width: 0 }}
                          animate={{ width: "82%" }}
                          transition={{ duration: 1.2, delay: 0.4 }}
                        />
                      </div>
                      <p className="mt-3 text-xs text-white/60">
                        Escalation flag set: low risk, monitor hydration.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <MessageSquare className="h-4 w-4" />
                          Symptom intake
                        </div>
                        <p className="mt-2 text-sm text-white">
                          14 signals detected
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Zap className="h-4 w-4" />
                          Reminder engine
                        </div>
                        <p className="mt-2 text-sm text-white">98% on-time</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span>Deployment</span>
                        <span>AWS / Terraform</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-white">
                        <span>Services healthy</span>
                        <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs text-emerald-200">
                          12/12 running
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hero-float float-one hidden rounded-2xl px-4 py-3 text-xs text-white/80 sm:block">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-sky-300" />
                    <span>Latency</span>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    1.8s
                  </div>
                </div>
                <div className="hero-float float-two hidden rounded-2xl px-4 py-3 text-xs text-white/80 sm:block">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    <span>Security status</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    All checks passed
                  </div>
                </div>
              </AnimatedInView>
            </div>
          </div>
        </section>

        <section
          id="modules"
          className="landing-section bg-slate-50 px-6 py-24"
        >
          <div className="mx-auto max-w-6xl">
            <AnimatedInView>
              <div className="max-w-2xl">
                <h2 className="font-display text-3xl text-slate-900 md:text-4xl">
                  Comprehensive care in one platform
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Every workflow is connected, from daily symptom tracking to
                  AI-guided recommendations and clinician-ready reporting.
                </p>
              </div>
            </AnimatedInView>
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {moduleHighlights.map(
                ({ title, description, icon: Icon }, idx) => (
                  <AnimatedInView key={title} delay={0.05 * idx}>
                    <Card className="group h-full border-slate-200/70 bg-white/80 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <CardHeader className="flex flex-row items-start gap-4">
                        <div className="rounded-2xl bg-slate-900 p-3 text-white shadow">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-slate-900">
                            {title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm text-slate-600">
                        {description}
                      </CardContent>
                    </Card>
                  </AnimatedInView>
                ),
              )}
            </div>
          </div>
        </section>

        <section id="ai-engine" className="landing-section px-6 py-24">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <AnimatedInView>
                <Badge className="rounded-full bg-slate-900 text-white">
                  AI Engine
                </Badge>
                <h2 className="font-display mt-4 text-3xl text-slate-900 md:text-4xl">
                  Multi-agent intelligence built for healthcare
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  SymptomSync runs a LangGraph-powered assembly line where
                  specialized agents extract symptoms, retrieve knowledge,
                  analyze risks, and deliver personalized guidance in seconds.
                </p>
              </AnimatedInView>
              <AnimatedInView delay={0.2}>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3 text-slate-700">
                    <Brain className="mt-1 h-5 w-5 text-slate-900" />
                    <div>
                      <p className="text-sm font-semibold">
                        LangGraph + LangChain orchestration
                      </p>
                      <p className="text-sm text-slate-600">
                        Coordinated agent workflows with stateful guardrails.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-slate-700">
                    <Database className="mt-1 h-5 w-5 text-slate-900" />
                    <div>
                      <p className="text-sm font-semibold">
                        RAG knowledge retrieval
                      </p>
                      <p className="text-sm text-slate-600">
                        Connects to curated data and vector stores for accuracy.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-slate-700">
                    <Server className="mt-1 h-5 w-5 text-slate-900" />
                    <div>
                      <p className="text-sm font-semibold">
                        MCP server architecture
                      </p>
                      <p className="text-sm text-slate-600">
                        FastAPI-backed service layer with secure integrations.
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedInView>
            </div>

            <div className="grid gap-4">
              {aiPipeline.map(({ title, description, icon: Icon }, idx) => (
                <AnimatedInView key={title} delay={0.1 * idx}>
                  <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-slate-900 p-2 text-white">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {title}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {description}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </AnimatedInView>
              ))}
            </div>
          </div>
        </section>

        <section
          id="infrastructure"
          className="landing-dark px-6 py-24 text-white"
        >
          <div className="relative mx-auto max-w-6xl">
            <AnimatedInView>
              <div className="max-w-2xl">
                <Badge className="rounded-full border border-white/20 bg-white/10 text-white">
                  Infrastructure + Deployment
                </Badge>
                <h2 className="font-display mt-4 text-3xl md:text-4xl">
                  Cloud-native, automated, and production ready
                </h2>
                <p className="mt-4 text-lg text-white/70">
                  Run SymptomSync on AWS or Azure with Terraform-managed
                  environments, Dockerized services, and CI/CD pipelines for
                  reliable releases.
                </p>
              </div>
            </AnimatedInView>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {infraHighlights.map(
                ({ title, description, icon: Icon }, idx) => (
                  <AnimatedInView key={title} delay={0.08 * idx}>
                    <div className="flex h-full items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                      <div className="rounded-xl bg-white/10 p-3">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {title}
                        </h3>
                        <p className="mt-2 text-sm text-white/70">
                          {description}
                        </p>
                      </div>
                    </div>
                  </AnimatedInView>
                ),
              )}
            </div>

            <AnimatedInView delay={0.2}>
              <div className="mt-10 flex flex-wrap gap-3">
                {[
                  "AWS",
                  "Terraform",
                  "Docker",
                  "ECS",
                  "RDS",
                  "S3",
                  "Ansible",
                  "Jenkins",
                ].map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className="border-white/20 bg-white/5 text-white"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </AnimatedInView>
          </div>
        </section>

        <section
          id="security"
          className="landing-section bg-slate-50 px-6 py-24"
        >
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1fr]">
            <AnimatedInView>
              <div>
                <Badge className="rounded-full bg-slate-900 text-white">
                  Security
                </Badge>
                <h2 className="font-display mt-4 text-3xl text-slate-900 md:text-4xl">
                  Built to protect sensitive health data
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  From encryption to audit trails, SymptomSync applies
                  healthcare-grade protections across every layer of the stack.
                </p>
                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Role-based access with secure authentication flows
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Audit-ready logs and monitoring instrumentation
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Privacy-first storage for documents and health records
                  </div>
                </div>
              </div>
            </AnimatedInView>
            <div className="grid gap-5">
              {securityHighlights.map(
                ({ title, description, icon: Icon }, idx) => (
                  <AnimatedInView key={title} delay={0.1 * idx}>
                    <Card className="border-slate-200/70 bg-white/80 shadow-sm backdrop-blur">
                      <CardHeader className="flex flex-row items-center gap-4">
                        <div className="rounded-2xl bg-slate-900 p-3 text-white">
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-xl text-slate-900">
                          {title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-slate-600">
                        {description}
                      </CardContent>
                    </Card>
                  </AnimatedInView>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="landing-section bg-white px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <AnimatedInView>
              <div className="text-center">
                <h2 className="font-display text-3xl text-slate-900 md:text-4xl">
                  What teams are saying
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Clinicians, engineers, and care teams trust SymptomSync for
                  modern, AI-powered workflows.
                </p>
              </div>
            </AnimatedInView>
            <AnimatedInView delay={0.1} className="mt-12">
              <Slider {...sliderSettings}>
                {testimonials.map(({ quote, name, icon: Icon }) => (
                  <div key={name} className="px-4">
                    <Card className="h-full border-slate-200/70 bg-slate-50 shadow-sm">
                      <CardContent className="flex h-full flex-col justify-between p-6">
                        <p className="text-sm text-slate-600">
                          &quot;{quote}&quot;
                        </p>
                        <div className="mt-6 flex items-center gap-3">
                          <div className="rounded-full bg-slate-900 p-2 text-white">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-semibold text-slate-900">
                            {name}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </Slider>
            </AnimatedInView>
          </div>
        </section>

        <section className="landing-section bg-slate-50 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <AnimatedInView>
              <div className="text-center">
                <h2 className="font-display text-3xl text-slate-900 md:text-4xl">
                  Frequently asked questions
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Quick answers to help you evaluate SymptomSync.
                </p>
              </div>
            </AnimatedInView>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {faqs.map(({ q, a }, idx) => (
                <AnimatedInView key={q} delay={0.05 * idx}>
                  <Card className="h-full border-slate-200/70 bg-white/90 shadow-sm">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {q}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">{a}</p>
                    </CardContent>
                  </Card>
                </AnimatedInView>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-dark px-6 py-20 text-center">
          <div className="relative mx-auto max-w-4xl">
            <AnimatedInView>
              <h2 className="font-display text-3xl md:text-4xl">
                Ready to deliver smarter, safer care?
              </h2>
              <p className="mt-4 text-lg text-white/70">
                Launch SymptomSync with a production-grade AI stack, robust
                deployment tooling, and a delightful patient experience.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link href={user ? "/home" : "/auth/signUp"}>
                    <Button className="h-11 rounded-full bg-white text-slate-900 hover:bg-white/90 cursor-pointer">
                      {user ? "Open your dashboard" : "Sign up for free"}
                    </Button>
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link href="#ai-engine">
                    <Button
                      variant="outline"
                      className="h-11 rounded-full border-white/30 bg-transparent text-white hover:bg-white/10 cursor-pointer"
                    >
                      View the AI pipeline
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </AnimatedInView>
          </div>
        </section>

        <footer className="bg-slate-950 px-6 py-8 text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-white/70">
              © {new Date().getFullYear()} SymptomSync. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/70">
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white">
                Terms of Service
              </Link>
              <Link
                href="https://github.com/hoangsonww/SymptomSync-Health-App"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white"
              >
                <Github className="h-4 w-4" />
                GitHub
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
