import { GraduationCap } from "lucide-react"
import { EmailExistsChecker } from "@/components/email-exists-checker"
import Link from "next/link"

export default function AuthLandingPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">LegacyLink</span>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Welcome to LegacyLink</h1>
            <p className="text-muted-foreground">
              Connect with your alumni network and unlock opportunities
            </p>
          </div>

          <EmailExistsChecker />

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Or choose an option below:</p>
            <div className="flex space-x-2">
              <Link href="/auth/login" className="flex-1">
                <button className="w-full px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors">
                  I have an account
                </button>
              </Link>
              <Link href="/auth/sign-up" className="flex-1">
                <button className="w-full px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  Create new account
                </button>
              </Link>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              SIH 2025 - Problem ID: 25017<br />
              Digital Platform for Centralized Alumni Data Management
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}