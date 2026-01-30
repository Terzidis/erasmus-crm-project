import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Mail, 
  Calendar,
  Clock,
  Bell,
  TrendingUp,
  Trophy,
  TrendingDown,
  AlertTriangle,
  CalendarClock,
  Loader2
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Fetch email preferences
  const { data: emailPrefs, isLoading: prefsLoading } = trpc.users.getEmailPreferences.useQuery();

  // Update email preferences mutation
  const updatePrefsMutation = trpc.users.updateEmailPreferences.useMutation({
    onSuccess: () => {
      utils.users.getEmailPreferences.invalidate();
      toast.success("Email preferences updated");
    },
    onError: (error) => {
      toast.error("Failed to update preferences: " + error.message);
    },
  });

  const handleToggle = (key: string, value: boolean) => {
    updatePrefsMutation.mutate({ [key]: value });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Card */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your account details and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-semibold">{user?.name || "User"}</h2>
                  <Badge 
                    variant={user?.role === "admin" ? "default" : "secondary"}
                    className={user?.role === "admin" ? "gradient-primary border-0" : ""}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {user?.role === "admin" ? "Administrator" : "User"}
                  </Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user?.email || "No email provided"}
                </p>
              </div>
              
              <Separator />
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </p>
                  <p className="font-medium">
                    {user?.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Unknown"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Last Sign In
                  </p>
                  <p className="font-medium">
                    {user?.lastSignedIn 
                      ? new Date(user.lastSignedIn).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Notification Preferences */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose which email notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prefsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Deal Notifications */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Deal Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <Label htmlFor="emailNotifyNewDeal" className="font-medium">New Deals</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when a new deal is created
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="emailNotifyNewDeal"
                      checked={emailPrefs?.emailNotifyNewDeal ?? true}
                      onCheckedChange={(checked) => handleToggle("emailNotifyNewDeal", checked)}
                      disabled={updatePrefsMutation.isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <Label htmlFor="emailNotifyDealWon" className="font-medium">Deals Won</Label>
                        <p className="text-sm text-muted-foreground">
                          Celebrate when a deal is marked as won
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="emailNotifyDealWon"
                      checked={emailPrefs?.emailNotifyDealWon ?? true}
                      onCheckedChange={(checked) => handleToggle("emailNotifyDealWon", checked)}
                      disabled={updatePrefsMutation.isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <Label htmlFor="emailNotifyDealLost" className="font-medium">Deals Lost</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when a deal is marked as lost
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="emailNotifyDealLost"
                      checked={emailPrefs?.emailNotifyDealLost ?? true}
                      onCheckedChange={(checked) => handleToggle("emailNotifyDealLost", checked)}
                      disabled={updatePrefsMutation.isPending}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Activity Notifications */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Activity Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <CalendarClock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <Label htmlFor="emailNotifyActivityDue" className="font-medium">Upcoming Activities</Label>
                        <p className="text-sm text-muted-foreground">
                          Reminders for activities due soon
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="emailNotifyActivityDue"
                      checked={emailPrefs?.emailNotifyActivityDue ?? true}
                      onCheckedChange={(checked) => handleToggle("emailNotifyActivityDue", checked)}
                      disabled={updatePrefsMutation.isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <Label htmlFor="emailNotifyOverdue" className="font-medium">Overdue Activities</Label>
                        <p className="text-sm text-muted-foreground">
                          Alerts for overdue tasks and activities
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="emailNotifyOverdue"
                      checked={emailPrefs?.emailNotifyOverdue ?? true}
                      onCheckedChange={(checked) => handleToggle("emailNotifyOverdue", checked)}
                      disabled={updatePrefsMutation.isPending}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Account Settings
          </CardTitle>
          <CardDescription>
            Manage your account preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Login Method</p>
                <p className="text-sm text-muted-foreground">
                  How you sign in to your account
                </p>
              </div>
              <Badge variant="outline">
                {user?.loginMethod || "Manus OAuth"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Account ID</p>
                <p className="text-sm text-muted-foreground">
                  Your unique identifier
                </p>
              </div>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {user?.openId?.slice(0, 12)}...
              </code>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Role</p>
                <p className="text-sm text-muted-foreground">
                  Your permission level in the system
                </p>
              </div>
              <Badge variant={user?.role === "admin" ? "default" : "secondary"}>
                {user?.role === "admin" ? "Administrator" : "Standard User"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>About Erasmus CRM</CardTitle>
          <CardDescription>
            Customer Relationship Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Built with</span>
              <span className="font-medium">React + tRPC + PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Project</span>
              <span className="font-medium">Erasmus CRM Project</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
