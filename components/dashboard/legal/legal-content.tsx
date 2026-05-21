// components/legal/legal-content.tsx
"use client";

import {Calendar} from "lucide-react";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function LegalSection({title, children, icon}: SectionProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        {icon && <div className="text-primary">{icon}</div>}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="text-muted-foreground space-y-3">{children}</div>
    </section>
  );
}

export function LastUpdated({date}: {date: string}) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 pb-4 border-b">
      <Calendar className="h-4 w-4" />
      <span>Last updated: {date}</span>
    </div>
  );
}

export function LegalContainer({
  children,
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
            {icon}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">
            Please read carefully. This document contains important information about your rights
            and obligations.
          </p>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
