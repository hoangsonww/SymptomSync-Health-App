// pages/404.tsx
import { motion } from "framer-motion";
import Link from "next/link";
import Head from "next/head";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Not Found | SymptomSync</title>
        <meta name="description" content="Page not found" />
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary text-primary-foreground px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          {/* Animated Heading */}
          <motion.h1
            className="text-6xl md:text-8xl font-extrabold tracking-tight mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            404
          </motion.h1>

          {/* Animated Tagline */}
          <motion.p
            className="text-2xl md:text-3xl mb-8"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Oops! The page you&apos;re looking for doesn&apos;t exist.
          </motion.p>

          {/* Animated Button with continuous pulse effect */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Link
              href="/"
              className="px-6 py-3 bg-white text-primary rounded-full font-semibold hover:bg-gray-100 transition-colors duration-300"
            >
              Return Home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
