
'use client';
import "./globals.css";
import { Patrick_Hand } from "next/font/google";


import { SessionProvider } from "next-auth/react";

const patrickHand = Patrick_Hand({
  weight: "400", // You can specify the weight, here it is 400 (regular)
  style: "normal",
  subsets: ["latin"],
  variable: "--font-patrick-hand", // Custom variable to use across the app
});


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

