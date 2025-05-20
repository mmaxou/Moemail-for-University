import { ThemeProvider } from "@/components/theme/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import type { Metadata, Viewport } from "next"
import { zpix } from "./fonts"
import "./globals.css"
import { Providers } from "./providers"
import { FloatMenu } from "@/components/float-menu"

export const metadata: Metadata = {
  title: "MRI mail - University Email System",
  description: "安全、快速的大学邮件系统，保护您的隐私，远离垃圾邮件。支持即时收件。",
  keywords: [
    "大学邮箱",
    "邮件系统",
    "隐私保护",
    "垃圾邮件过滤",
    "即时收件",
    "安全邮箱",
    "注册验证",
    "电子邮件",
    "隐私安全",
    "邮件服务",
    "MRI mail"
  ].join(", "),
  authors: [{ name: "SoftMoe Studio" }],
  creator: "SoftMoe Studio",
  publisher: "SoftMoe Studio",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://moemail.app",
    title: "MRI mail - University Email System",
    description: "安全、快速的大学邮件系统，保护您的隐私，远离垃圾邮件。支持即时收件。",
    siteName: "MRI mail",
  },
  twitter: {
    card: "summary_large_image",
    title: "MRI mail - University Email System",
    description: "安全、快速的大学邮件系统，保护您的隐私，远离垃圾邮件。支持即时收件。",
  },
  manifest: '/manifest.json',
  icons: [
    { rel: 'apple-touch-icon', url: '/icons/icon-192x192.png' },
  ],
}

export const viewport: Viewport = {
  themeColor: '#826DD9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="MRI mail" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MRI mail" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body 
        className={cn(
          zpix.variable,
          "font-zpix min-h-screen antialiased",
          "bg-background text-foreground",
          "transition-colors duration-300"
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="temp-mail-theme"
        >
          <Providers>
            {children}
          </Providers>
          <Toaster />
          <FloatMenu />
        </ThemeProvider>
      </body>
    </html>
  )
}
