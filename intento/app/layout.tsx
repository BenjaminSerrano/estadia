import type React from "react"
import "./globals.css"
import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" })
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
})

export const metadata = {
  title: "Interactive Venn Diagram",
  description: "Explore the relationships between sets with this interactive Venn diagram",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${bricolage.variable} ${ibmPlexMono.variable}`}>
      <body className={bricolage.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
