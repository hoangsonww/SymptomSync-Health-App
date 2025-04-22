import { motion } from "framer-motion";
import Link from "next/link";
import Head from "next/head";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>SymptomSync | 404 - Not Found</title>
        <meta name="description" content="Page not found" />
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary text-primary-foreground px-4">
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
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <motion.h1
            className="text-6xl md:text-8xl font-extrabold tracking-tight mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            404
          </motion.h1>

          <motion.p
            className="text-2xl md:text-3xl mb-8"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Oops! The page you&apos;re looking for doesn&apos;t exist.
          </motion.p>

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Link
              href="/home"
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
