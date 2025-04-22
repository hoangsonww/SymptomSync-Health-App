import Head from "next/head";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
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

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function TermsAndConditions() {
  return (
    <>
      <Head>
        <title>SymptomSync | Terms and Conditions</title>
        <meta
          name="description"
          content="Read the Terms and Conditions for SymptomSync. Understand the rules and guidelines for using our app."
        />
      </Head>
      <motion.main
        className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-8 lg:px-16"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <style jsx global>{`
          html {
            scroll-behavior: smooth;
          }

          html,
          body {
            overscroll-behavior: none;
          }
        `}</style>
        <div className="max-w-4xl mx-auto">
          <motion.header className="mb-12 text-center" variants={slideInLeft}>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
              Terms & Conditions
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Please read these terms and conditions carefully before using
              SymptomSync.
            </p>
          </motion.header>

          <motion.section className="space-y-8" variants={containerVariants}>
            <motion.article variants={fadeInUp}>
              <h2 className="text-2xl font-bold mb-4">Acceptance of Terms</h2>
              <p className="leading-7">
                By accessing and using SymptomSync (&quot;the App&quot;), you
                accept and agree to be bound by the terms and provision of this
                agreement. If you do not agree to these terms, please do not use
                our services.
              </p>
            </motion.article>

            <motion.article variants={fadeInUp}>
              <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
              <p className="leading-7">
                We reserve the right to update or change these Terms and
                Conditions at any time without prior notice. Any changes will be
                effective immediately upon posting on the App. Your continued
                use of the service after any modifications to the Terms
                constitutes your acceptance of the new Terms.
              </p>
            </motion.article>

            <motion.article variants={fadeInUp}>
              <h2 className="text-2xl font-bold mb-4">User Responsibilities</h2>
              <p className="leading-7 mb-4">
                When you use SymptomSync, you agree that you will not engage in
                any activity that interferes with or disrupts the services. You
                are responsible for all activities that occur under your
                account.
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>
                  You agree to provide accurate, current, and complete
                  information during the registration process.
                </li>
                <li>
                  You must not use the App for any unlawful or fraudulent
                  purpose.
                </li>
                <li>
                  You are responsible for maintaining the confidentiality of
                  your account information.
                </li>
              </ul>
            </motion.article>

            <motion.article variants={fadeInUp}>
              <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
              <p className="leading-7">
                All content, trademarks, and data on SymptomSync, including but
                not limited to text, graphics, logos, icons, images, as well as
                the software used, are the property of SymptomSync or its
                licensors. Unauthorized use of any material may violate
                copyright laws.
              </p>
            </motion.article>

            <motion.article variants={fadeInUp}>
              <h2 className="text-2xl font-bold mb-4">
                Limitation of Liability
              </h2>
              <p className="leading-7">
                In no event shall SymptomSync, nor its directors, employees,
                partners, agents, suppliers, or affiliates, be liable for any
                indirect, incidental, special, consequential or punitive
                damages, arising out of your use of or inability to use the App.
              </p>
            </motion.article>

            <motion.article variants={fadeInUp}>
              <h2 className="text-2xl font-bold mb-4">Governing Law</h2>
              <p className="leading-7">
                These Terms shall be governed and construed in accordance with
                the laws of the jurisdiction in which SymptomSync operates,
                without regard to its conflict of law provisions.
              </p>
            </motion.article>

            <motion.article variants={fadeInUp}>
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <p className="leading-7">
                If you have any questions about these Terms and Conditions,
                please contact us at{" "}
                <a
                  href="mailto:support@symptomsync.com"
                  className="text-foreground underline"
                >
                  support@symptomsync.com
                </a>
                .
              </p>
            </motion.article>
          </motion.section>
        </div>
      </motion.main>
    </>
  );
}
