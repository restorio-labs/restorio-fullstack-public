"use client";

import { ContentContainer } from "@restorio/ui";
import type { ReactElement, ReactNode } from "react";

import { ConnectionStatusBubble } from "@/components/app/ConnectionStatusBubble";
import { Footer } from "@/components/app/Footer";
import { Header } from "@/components/app/Header";
import CookieConsentBanner from "@/components/legal/CookieConsentBanner";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps): ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background-primary">
      <Header />
      <main id="main-content" className="flex-1">
        <ContentContainer maxWidth="lg" padding>
          {children}
        </ContentContainer>
      </main>
      <ConnectionStatusBubble />
      <Footer />
      <CookieConsentBanner />
    </div>
  );
}
