import React from "react";
import Head from "next/head";

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | SymptomSync</title>
        <meta
          name="description"
          content="Read our Privacy Policy at SymptomSync. Learn how we collect, use, and protect your personal data."
        />
      </Head>
      <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Your privacy is important to us at SymptomSync.
            </p>
          </header>

          <section className="space-y-10 text-base leading-7">
            <article>
              <h2 className="text-2xl font-bold mb-3">Introduction</h2>
              <p>
                Welcome to SymptomSync. We are committed to protecting your
                personal data and your right to privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our platform.
              </p>
            </article>

            <article>
              <h2 className="text-2xl font-bold mb-3">
                Information We Collect
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Personal Data:</strong> Name, email address, profile
                  image, etc.
                </li>
                <li>
                  <strong>Usage Data:</strong> IP address, browser type, access
                  times, etc.
                </li>
                <li>
                  <strong>Cookies:</strong> To enhance your experience.
                </li>
              </ul>
            </article>

            <article>
              <h2 className="text-2xl font-bold mb-3">How We Use Your Data</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Service Delivery:</strong> Managing accounts and
                  personalizing experiences.
                </li>
                <li>
                  <strong>Communication:</strong> Sending updates and responding
                  to inquiries.
                </li>
                <li>
                  <strong>Analytics:</strong> Analyzing usage to improve our
                  platform.
                </li>
                <li>
                  <strong>Compliance:</strong> Meeting legal and regulatory
                  requirements.
                </li>
              </ul>
            </article>

            <article>
              <h2 className="text-2xl font-bold mb-3">Information Sharing</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Service Providers:</strong> Trusted vendors assisting
                  with our operations.
                </li>
                <li>
                  <strong>Legal Requirements:</strong> Disclosures required by
                  law.
                </li>
                <li>
                  <strong>Business Transfers:</strong> In the event of a merger
                  or sale.
                </li>
              </ul>
            </article>

            <article>
              <h2 className="text-2xl font-bold mb-3">Data Security</h2>
              <p>
                We implement robust security measures to protect your data.
                However, no security system is impenetrable, and we cannot
                guarantee absolute safety.
              </p>
            </article>

            <article>
              <h2 className="text-2xl font-bold mb-3">Your Rights</h2>
              <p>
                You have the right to access, correct, or delete your personal
                data. To exercise these rights, please contact us at{" "}
                <a
                  href="mailto:privacy@symptomsync.com"
                  className="text-accent underline"
                >
                  privacy@symptomsync.com
                </a>
                .
              </p>
            </article>

            <article>
              <h2 className="text-2xl font-bold mb-3">
                Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy occasionally. Any changes will
                be posted here with an updated effective date.
              </p>
            </article>

            <article>
              <h2 className="text-2xl font-bold mb-3">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please
                email us at{" "}
                <a
                  href="mailto:privacy@symptomsync.com"
                  className="text-accent underline"
                >
                  privacy@symptomsync.com
                </a>
                .
              </p>
            </article>
          </section>
        </div>
      </div>
    </>
  );
}
