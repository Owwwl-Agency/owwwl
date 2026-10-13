import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import "@/styles/globals.scss";
import { fontVariables } from "@/config/fonts";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { Header } from "@/components/layout/Header/Header";
import { BottomNav } from "@/components/layout/BottomNav/BottomNav";
import { Footer } from "@/components/layout/Footer/Footer";
import { ProjectDialog } from "@/components/layout/ProjectDialog/ProjectDialog";
import { Grain } from "@/components/ui/Grain/Grain";
import { CurrentYear } from "@/components/ui/CurrentYear/CurrentYear";

export const metadata: Metadata = {
  title: "Owwwl Agency",
  description: "From name to launch. One team. One flow.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body>
        <SmoothScrollProvider>
          <Grain />
          <Header />
          {children}
          <Footer year={<CurrentYear />} />
          <BottomNav />
          <ProjectDialog />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
