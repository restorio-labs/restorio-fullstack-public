import type { ReactElement, ReactNode } from "react";

interface LegalPageLayoutProps {
  children: ReactNode;
}

export const LegalPageLayout = ({ children }: LegalPageLayoutProps): ReactElement => {
  return (
    <div className="w-full bg-background-primary text-text-primary scroll-smooth">
      <main
        id="legal-main"
        className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 print:bg-white print:text-black"
        aria-label="Legal documents"
      >
        {children}
      </main>
    </div>
  );
};
