import "../styles/globals.css";
import type { Metadata } from "next";
import { type ReactNode } from "react";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Hello Amor 🎉",
  description: "Minimum Viable Amor",
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto w-10/12 sm:w-3/5 md:w-1/2">
          {props.children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
