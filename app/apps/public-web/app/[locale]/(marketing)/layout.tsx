"use client";

import type { ReactElement, ReactNode } from "react";

import { ConnectionStatusBubble } from "@/components/app/ConnectionStatusBubble";
import { Footer } from "@/components/app/Footer";
import { Header } from "@/components/app/Header";
import CookieConsentBanner from "@/components/legal/CookieConsentBanner";

interface MarketingLayoutProps {
  children: ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps): ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background-primary">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <ConnectionStatusBubble />
      <Footer />
      <CookieConsentBanner />
    </div>
  );
}
