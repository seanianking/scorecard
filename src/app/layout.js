import { Geist, Fraunces } from "next/font/google";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const display = Fraunces({ variable: "--font-display", subsets: ["latin"] });

export const metadata = {
  title: { default: "Scorecard", template: "%s · Scorecard" },
  description: "Run pageants: registration, judging, scoring and feedback in one place.",
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href={user ? "/dashboard" : "/"} className="font-display text-xl text-plum-800">
              Scorecard
            </Link>
            {user ? (
              <div className="flex items-center gap-4 text-sm">
                <Link href="/dashboard" className="text-stone-600 hover:text-stone-900">
                  Dashboard
                </Link>
                <span className="hidden text-stone-400 sm:inline">{user.name}</span>
                <form action={logout}>
                  <button className="text-stone-600 hover:text-stone-900">Sign out</button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-sm">
                <Link href="/login" className="text-stone-600 hover:text-stone-900">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-plum-700 px-3 py-1.5 font-medium text-white hover:bg-plum-800"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
