import React from "react";
import Link from "next/link";
import { Shield, FileText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-background text-muted-foreground py-8 px-4 text-center shadow-lg">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
        <p className="text-sm">
          © {new Date().getFullYear()}{" "}
          <strong className="font-bold">SymptomSync</strong>. All rights
          reserved.
        </p>
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <Link href="/privacy" legacyBehavior>
            <a className="flex items-center hover:text-primary transition-colors">
              <Shield className="w-4 h-4 mr-1" />
              <span className="text-sm">Privacy Policy</span>
            </a>
          </Link>
          <Link href="/terms" legacyBehavior>
            <a className="flex items-center hover:text-primary transition-colors">
              <FileText className="w-4 h-4 mr-1" />
              <span className="text-sm">Terms of Service</span>
            </a>
          </Link>
        </div>
      </div>
    </footer>
  );
}
