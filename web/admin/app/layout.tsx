import type { Metadata } from "next";
import "./globals.css";
import { getServerSession } from "next-auth";
import { Next_Auth_Config } from "../lib/auth";
import { Toaster } from "./Component/ui/toaster";
import Provider from "../lib/provider"
import Navbar from "./Component/Navbar";

export const metadata: Metadata = {
  title: "ConnectUS",
  description: "Connect and Travel",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(Next_Auth_Config);
  console.log(session);
  return (
    <html lang="en">
      <body>
        <main>
        <Navbar />
          <Provider session={session}>
           
            <div className="">{children}</div>
          </Provider>
          <Toaster />
        </main>
      </body>
    </html>
  );
}
