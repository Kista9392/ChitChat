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
  title: "Vibely | A Premium Social Network",
  description: "Connect, share stories, chat in real-time, and scroll through premium reels on Vibely - the ultimate next-gen social experience.",
  manifest: "/manifest.json",
  keywords: ["Vibely", "social network", "real-time chat", "stories", "reels", "premium social networking", "Vibely App"],
  metadataBase: new URL("https://vibely-social.vercel.app"),
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  openGraph: {
    type: "website",
    title: "Vibely | A Premium Social Network",
    description: "Connect, share stories, chat in real-time, and scroll through premium reels on Vibely.",
    siteName: "Vibely",
    url: "https://vibely-social.vercel.app"
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibely | A Premium Social Network",
    description: "Connect, share stories, chat in real-time, and scroll through premium reels on Vibely."
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
    "name": "Vibely",
    "url": "https://vibely-social.vercel.app",
    "description": "Connect, share stories, chat in real-time, and scroll through premium reels on Vibely - the ultimate next-gen social experience.",
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
