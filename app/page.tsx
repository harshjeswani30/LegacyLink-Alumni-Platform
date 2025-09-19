import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { GraduationCap, Users, Calendar, Heart, Award, TrendingUp } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">LegacyLink</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl text-balance">
              Connect with Your{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Alumni Network
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground text-pretty">
              LegacyLink brings together alumni, students, and universities in one powerful platform. Mentor the next
              generation, attend exclusive events, and give back to your alma mater.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/auth/sign-up">
                <Button size="lg" className="px-8">
                  Join Your Network
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to stay connected
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A comprehensive platform designed for meaningful alumni engagement
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <Users className="h-10 w-10 text-primary" />
                <CardTitle>Mentorship Network</CardTitle>
                <CardDescription>
                  Connect with experienced alumni for career guidance and professional development
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary" />
                <CardTitle>Exclusive Events</CardTitle>
                <CardDescription>
                  Join networking events, workshops, and reunions tailored to your university community
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader>
                <Heart className="h-10 w-10 text-primary" />
                <CardTitle>Give Back</CardTitle>
                <CardDescription>Support your alma mater through donations and volunteer opportunities</CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader>
                <Award className="h-10 w-10 text-primary" />
                <CardTitle>Recognition System</CardTitle>
                <CardDescription>
                  Earn badges and recognition for your contributions to the alumni community
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary" />
                <CardTitle>Career Growth</CardTitle>
                <CardDescription>
                  Access job opportunities and career resources from your alumni network
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader>
                <GraduationCap className="h-10 w-10 text-primary" />
                <CardTitle>Multi-University</CardTitle>
                <CardDescription>
                  Support for multiple universities with dedicated spaces for each community
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to reconnect with your alumni network?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of alumni already making meaningful connections
            </p>
            <div className="mt-8">
              <Link href="/auth/sign-up">
                <Button size="lg" className="px-8">
                  Get Started Today
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">LegacyLink</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 LegacyLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
