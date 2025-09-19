import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, DollarSign, TrendingUp, Calendar, Plus, Download } from "lucide-react"

export default async function DonationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Get donation statistics
  const [
    { count: totalDonations },
    { data: totalAmountResult },
    { count: thisMonthDonations },
    { data: thisMonthAmountResult },
  ] = await Promise.all([
    supabase
      .from("donations")
      .select("*", { count: "exact", head: true })
      .eq("donor_id", user.id)
      .eq("payment_status", "completed"),
    supabase.from("donations").select("amount").eq("donor_id", user.id).eq("payment_status", "completed"),
    supabase
      .from("donations")
      .select("*", { count: "exact", head: true })
      .eq("donor_id", user.id)
      .eq("payment_status", "completed")
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase
      .from("donations")
      .select("amount")
      .eq("donor_id", user.id)
      .eq("payment_status", "completed")
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ])

  const totalAmount = totalAmountResult?.reduce((sum, donation) => sum + donation.amount, 0) || 0
  const thisMonthAmount = thisMonthAmountResult?.reduce((sum, donation) => sum + donation.amount, 0) || 0

  // Get user's donations with university details
  const { data: userDonations } = await supabase
    .from("donations")
    .select(`
      *,
      university:universities(name, logo_url)
    `)
    .eq("donor_id", user.id)
    .order("created_at", { ascending: false })

  // Get university donation opportunities (if user is not super admin)
  const { data: donationOpportunities } = await supabase.from("universities").select("*").eq("approved", true).limit(6)

  const completedDonations = userDonations?.filter((d) => d.payment_status === "completed") || []
  const pendingDonations = userDonations?.filter((d) => d.payment_status === "pending") || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Donations</h1>
        <p className="text-muted-foreground">Support your alma mater and other universities</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDonations || 0}</div>
            <p className="text-xs text-muted-foreground">Lifetime contributions</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time donations</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthDonations || 0}</div>
            <p className="text-xs text-muted-foreground">₹{thisMonthAmount.toLocaleString()} donated</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
            <Heart className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(totalAmount / 100)}</div>
            <p className="text-xs text-muted-foreground">Community impact points</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="opportunities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="opportunities">Donation Opportunities</TabsTrigger>
          <TabsTrigger value="history">My Donations ({completedDonations.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingDonations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Support Universities</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Make Donation
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {donationOpportunities?.map((university) => (
              <Card
                key={university.id}
                className="glass-card border-border/50 hover:border-primary/50 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={university.logo_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {university.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{university.name}</CardTitle>
                      <CardDescription>Support education and infrastructure</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Goal Progress</span>
                      <span>₹2,50,000 / ₹10,00,000</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "25%" }}></div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <Heart className="mr-1 h-3 w-3" />
                      Donate
                    </Button>
                    <Button size="sm" variant="outline">
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Donation History</h2>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {completedDonations.length === 0 ? (
            <Card className="glass-card border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Donations Yet</h3>
                <p className="text-muted-foreground text-center">
                  Start making a difference by supporting universities and causes you care about.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedDonations.map((donation) => (
                <Card key={donation.id} className="glass-card border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={donation.university?.logo_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {donation.university?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{donation.university?.name}</CardTitle>
                          <CardDescription>{new Date(donation.created_at).toLocaleDateString()}</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">₹{donation.amount.toLocaleString()}</div>
                        <Badge variant="default" className="bg-green-500/10 text-green-500">
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Payment ID: {donation.payment_id || "N/A"}</span>
                      {donation.receipt_url && (
                        <Button size="sm" variant="outline">
                          <Download className="mr-1 h-3 w-3" />
                          Receipt
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Pending Donations</h2>

          {pendingDonations.length === 0 ? (
            <Card className="glass-card border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Donations</h3>
                <p className="text-muted-foreground text-center">
                  All your donations have been processed successfully.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingDonations.map((donation) => (
                <Card key={donation.id} className="glass-card border-border/50 border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={donation.university?.logo_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {donation.university?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{donation.university?.name}</CardTitle>
                          <CardDescription>{new Date(donation.created_at).toLocaleDateString()}</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">₹{donation.amount.toLocaleString()}</div>
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Complete Payment
                      </Button>
                      <Button size="sm" variant="destructive">
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
