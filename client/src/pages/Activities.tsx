import { useState } from "react";
import { DateRange } from "react-day-picker";
import { trpc } from "@/lib/trpc";
import { MultiSelect } from "@/components/MultiSelect";
import { DateRangePicker } from "@/components/DateRangePicker";
import { AdvancedFilters, FilterField } from "@/components/AdvancedFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  CalendarCheck,
  Phone,
  Mail,
  Users,
  FileText,
  CheckCircle2,
  Circle
} from "lucide-react";

type ActivityType = "call" | "email" | "meeting" | "task" | "note";

const typeConfig: Record<ActivityType, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  call: { label: "Call", icon: Phone, color: "text-blue-700", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  email: { label: "Email", icon: Mail, color: "text-purple-700", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  meeting: { label: "Meeting", icon: Users, color: "text-amber-700", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  task: { label: "Task", icon: CalendarCheck, color: "text-emerald-700", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
  note: { label: "Note", icon: FileText, color: "text-gray-700", bgColor: "bg-gray-100 dark:bg-gray-800/50" },
};

interface ActivityFormData {
  type: ActivityType;
  subject: string;
  description: string;
}

const initialFormData: ActivityFormData = {
  type: "task",
  subject: "",
  description: "",
};

const typeOptions = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "task", label: "Task" },
  { value: "note", label: "Note" },
];

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
];

export default function Activities() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [completedFilter, setCompletedFilter] = useState<string>("all");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [formData, setFormData] = useState<ActivityFormData>(initialFormData);

  const utils = trpc.useUtils();

  const { data: activities, isLoading } = trpc.activities.list.useQuery({
    type: typeFilter !== "all" ? typeFilter : undefined,
    types: selectedTypes.length > 0 ? selectedTypes : undefined,
    isCompleted: completedFilter === "all" ? undefined : completedFilter === "completed",
    status: selectedStatus ? selectedStatus as "pending" | "completed" | "overdue" : undefined,
    dateFrom: dateRange?.from,
    dateTo: dateRange?.to,
  });

  const activeFilterCount = 
    (selectedTypes.length > 0 ? 1 : 0) + 
    (selectedStatus ? 1 : 0) + 
    (dateRange ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedStatus("");
    setDateRange(undefined);
  };

  const { data: activityStats } = trpc.activities.byType.useQuery();

  const createMutation = trpc.activities.create.useMutation({
    onSuccess: () => {
      utils.activities.list.invalidate();
      utils.activities.byType.invalidate();
      utils.activities.recent.invalidate();
      utils.dashboard.stats.invalidate();
      setIsCreateOpen(false);
      setFormData(initialFormData);
      toast.success("Activity created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create activity");
    },
  });

  const updateMutation = trpc.activities.update.useMutation({
    onSuccess: () => {
      utils.activities.list.invalidate();
      utils.activities.byType.invalidate();
      utils.activities.recent.invalidate();
      setIsEditOpen(false);
      setSelectedActivity(null);
      setFormData(initialFormData);
      toast.success("Activity updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update activity");
    },
  });

  const completeMutation = trpc.activities.complete.useMutation({
    onSuccess: () => {
      utils.activities.list.invalidate();
      utils.activities.recent.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Activity marked as complete");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to complete activity");
    },
  });

  const deleteMutation = trpc.activities.delete.useMutation({
    onSuccess: () => {
      utils.activities.list.invalidate();
      utils.activities.byType.invalidate();
      utils.activities.recent.invalidate();
      utils.dashboard.stats.invalidate();
      setIsDeleteOpen(false);
      setSelectedActivity(null);
      toast.success("Activity deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete activity");
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      type: formData.type,
      subject: formData.subject,
      description: formData.description || null,
    });
  };

  const handleUpdate = () => {
    if (!selectedActivity) return;
    updateMutation.mutate({
      id: selectedActivity,
      data: {
        type: formData.type,
        subject: formData.subject,
        description: formData.description || null,
      },
    });
  };

  const handleComplete = (id: number) => {
    completeMutation.mutate({ id });
  };

  const handleDelete = () => {
    if (!selectedActivity) return;
    deleteMutation.mutate({ id: selectedActivity });
  };

  const openEditDialog = (activity: NonNullable<typeof activities>[0]) => {
    setSelectedActivity(activity.id);
    setFormData({
      type: activity.type as ActivityType,
      subject: activity.subject,
      description: activity.description || "",
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (id: number) => {
    setSelectedActivity(id);
    setIsDeleteOpen(true);
  };

  const types: ActivityType[] = ["call", "email", "meeting", "task", "note"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
          <p className="text-muted-foreground mt-1">
            Track calls, emails, meetings, and tasks
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gradient-primary border-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Activity
        </Button>
      </div>

      {/* Activity Type Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {types.map((type) => {
          const stats = activityStats?.find((s) => s.type === type);
          const config = typeConfig[type];
          const Icon = config.icon;
          return (
            <Card 
              key={type} 
              className={`card-elegant cursor-pointer transition-all hover:scale-[1.02] ${
                typeFilter === type ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className={`h-10 w-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <span className="text-2xl font-bold">{stats?.count ?? 0}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{config.label}s</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="card-elegant">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={completedFilter} onValueChange={setCompletedFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            {(typeFilter !== "all" || completedFilter !== "all") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setTypeFilter("all");
                  setCompletedFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <AdvancedFilters activeFilterCount={activeFilterCount} onClearAll={clearAllFilters}>
        <FilterField label="Type">
          <MultiSelect
            options={typeOptions}
            selected={selectedTypes}
            onChange={setSelectedTypes}
            placeholder="Select types..."
          />
        </FilterField>
        <FilterField label="Status">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Due Date">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            placeholder="Select date range..."
          />
        </FilterField>
      </AdvancedFilters>

      {/* Activities List */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Activity List
          </CardTitle>
          <CardDescription>
            {activities?.length ?? 0} activities found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => {
                const config = typeConfig[activity.type as ActivityType];
                const Icon = config.icon;
                return (
                  <div 
                    key={activity.id} 
                    className={`flex items-start gap-4 p-4 border rounded-lg transition-colors hover:bg-muted/50 ${
                      activity.isCompleted ? "opacity-60" : ""
                    }`}
                  >
                    <button
                      onClick={() => !activity.isCompleted && handleComplete(activity.id)}
                      disabled={activity.isCompleted || completeMutation.isPending}
                      className="mt-0.5"
                    >
                      {activity.isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </button>
                    <div className={`h-10 w-10 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${activity.isCompleted ? "line-through" : ""}`}>
                          {activity.subject}
                        </h3>
                        <Badge className={`${config.bgColor} ${config.color} border-0 text-xs`}>
                          {config.label}
                        </Badge>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Created {new Date(activity.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {activity.completedAt && (
                          <> • Completed {new Date(activity.completedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}</>
                        )}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(activity)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(activity.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">No activities found</h3>
              <p className="text-muted-foreground mb-4">
                {typeFilter !== "all" || completedFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by adding your first activity"}
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Activity</DialogTitle>
            <DialogDescription>
              Create a new activity to track.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ActivityType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = typeConfig[type].icon;
                          return <Icon className="h-4 w-4" />;
                        })()}
                        {typeConfig[type].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Follow up with client"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={!formData.subject || createMutation.isPending}
              className="gradient-primary border-0"
            >
              {createMutation.isPending ? "Creating..." : "Create Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>
              Update the activity details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ActivityType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeConfig[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-subject">Subject *</Label>
              <Input
                id="edit-subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={!formData.subject || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this activity? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
