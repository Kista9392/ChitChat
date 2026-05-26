import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Relay | A Premium Social Network",
  description: "Connect, share stories, chat in real-time, and scroll through premium reels on Relay - the ultimate next-gen social experience.",
  manifest: "/manifest.json",
  keywords: ["Relay", "social network", "real-time chat", "stories", "reels", "premium social networking", "Relay App"],
  metadataBase: new URL("https://chit-chat-beta-seven.vercel.app"),
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" }
    ]
  },
  openGraph: {
    type: "website",
    title: "Relay | A Premium Social Network",
    description: "Connect, share stories, chat in real-time, and scroll through premium reels on Relay.",
    siteName: "Relay",
    url: "https://chit-chat-beta-seven.vercel.app"
  },
  twitter: {
    card: "summary_large_image",
    title: "Relay | A Premium Social Network",
    description: "Connect, share stories, chat in real-time, and scroll through premium reels on Relay."
  },
  verification: {
    google: "google-site-verification-placeholder"
  }
};


export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Relay",
    "url": "https://relay.social",
    "description": "Connect, share stories, chat in real-time, and scroll through premium reels on Relay - the ultimate next-gen social experience.",
    "applicationCategory": "SocialNetworkingApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript. Requires HTML5."
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-black dark:bg-zinc-950 dark:text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
