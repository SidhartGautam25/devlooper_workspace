import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Agency CRM",
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
