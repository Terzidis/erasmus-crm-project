import { useState } from "react";
import { DateRange } from "react-day-picker";
import { trpc } from "@/lib/trpc";
import { ExportButton } from "@/components/ExportButton";
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
import { toast } from "sonner";
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Briefcase,
  TrendingUp,
  ArrowRight
} from "lucide-react";

type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

const stageConfig: Record<DealStage, { label: string; color: string; bgColor: string }> = {
  lead: { label: "Lead", color: "text-blue-700", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  qualified: { label: "Qualified", color: "text-purple-700", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  proposal: { label: "Proposal", color: "text-amber-700", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  negotiation: { label: "Negotiation", color: "text-orange-700", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  closed_won: { label: "Won", color: "text-emerald-700", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
  closed_lost: { label: "Lost", color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-800/50" },
};

interface DealFormData {
  title: string;
  value: string;
  currency: string;
  stage: DealStage;
  probability: string;
  description: string;
}

const initialFormData: DealFormData = {
  title: "",
  value: "",
  currency: "EUR",
  stage: "lead",
  probability: "10",
  description: "",
};

function formatCurrency(value: string | number | null, currency: string = "EUR"): string {
  if (!value) return "€0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "€0";
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

const stageOptions = [
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed_won", label: "Won" },
  { value: "closed_lost", label: "Lost" },
];

export default function Deals() {
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [valueMin, setValueMin] = useState<string>("");
  const [valueMax, setValueMax] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<number | null>(null);
  const [formData, setFormData] = useState<DealFormData>(initialFormData);

  const utils = trpc.useUtils();

  const { data: deals, isLoading } = trpc.deals.list.useQuery({
    stage: stageFilter !== "all" ? stageFilter : undefined,
    stages: selectedStages.length > 0 ? selectedStages : undefined,
    valueMin: valueMin ? parseFloat(valueMin) : undefined,
    valueMax: valueMax ? parseFloat(valueMax) : undefined,
    dateFrom: dateRange?.from,
    dateTo: dateRange?.to,
  });

  const activeFilterCount = 
    (selectedStages.length > 0 ? 1 : 0) + 
    (valueMin || valueMax ? 1 : 0) + 
    (dateRange ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedStages([]);
    setValueMin("");
    setValueMax("");
    setDateRange(undefined);
  };

  const { data: pipelineStats } = trpc.deals.pipelineStats.useQuery();

  const createMutation = trpc.deals.create.useMutation({
    onSuccess: () => {
      utils.deals.list.invalidate();
      utils.deals.pipelineStats.invalidate();
      utils.dashboard.stats.invalidate();
      setIsCreateOpen(false);
      setFormData(initialFormData);
      toast.success("Deal created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create deal");
    },
  });

  const updateMutation = trpc.deals.update.useMutation({
    onSuccess: () => {
      utils.deals.list.invalidate();
      utils.deals.pipelineStats.invalidate();
      utils.dashboard.stats.invalidate();
      setIsEditOpen(false);
      setSelectedDeal(null);
      setFormData(initialFormData);
      toast.success("Deal updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update deal");
    },
  });

  const deleteMutation = trpc.deals.delete.useMutation({
    onSuccess: () => {
      utils.deals.list.invalidate();
      utils.deals.pipelineStats.invalidate();
      utils.dashboard.stats.invalidate();
      setIsDeleteOpen(false);
      setSelectedDeal(null);
      toast.success("Deal deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete deal");
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      title: formData.title,
      value: formData.value || null,
      currency: formData.currency,
      stage: formData.stage,
      probability: formData.probability ? parseInt(formData.probability) : 10,
      description: formData.description || null,
    });
  };

  const handleUpdate = () => {
    if (!selectedDeal) return;
    updateMutation.mutate({
      id: selectedDeal,
      data: {
        title: formData.title,
        value: formData.value || null,
        currency: formData.currency,
        stage: formData.stage,
        probability: formData.probability ? parseInt(formData.probability) : undefined,
        description: formData.description || null,
      },
    });
  };

  const handleDelete = () => {
    if (!selectedDeal) return;
    deleteMutation.mutate({ id: selectedDeal });
  };

  const openEditDialog = (deal: NonNullable<typeof deals>[0]) => {
    setSelectedDeal(deal.id);
    setFormData({
      title: deal.title,
      value: deal.value?.toString() || "",
      currency: deal.currency || "EUR",
      stage: deal.stage as DealStage,
      probability: deal.probability?.toString() || "10",
      description: deal.description || "",
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (id: number) => {
    setSelectedDeal(id);
    setIsDeleteOpen(true);
  };

  // Group deals by stage for pipeline view
  const dealsByStage = deals?.reduce((acc, deal) => {
    const stage = deal.stage as DealStage;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(deal);
    return acc;
  }, {} as Record<DealStage, typeof deals>);

  const stages: DealStage[] = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your sales pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            label="Export"
            onExport={async (format) => {
              const result = await utils.client.export.deals.mutate({ format });
              return result;
            }}
          />
          <Button onClick={() => setIsCreateOpen(true)} className="gradient-primary border-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stages.map((stage) => {
          const stats = pipelineStats?.find((s) => s.stage === stage);
          const config = stageConfig[stage];
          return (
            <Card 
              key={stage} 
              className={`card-elegant cursor-pointer transition-all hover:scale-[1.02] ${
                stageFilter === stage ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setStageFilter(stageFilter === stage ? "all" : stage)}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={`${config.bgColor} ${config.color} border-0`}>
                    {config.label}
                  </Badge>
                  <span className="text-2xl font-bold">{stats?.count ?? 0}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(stats?.totalValue ?? "0")}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters activeFilterCount={activeFilterCount} onClearAll={clearAllFilters}>
        <FilterField label="Stage">
          <MultiSelect
            options={stageOptions}
            selected={selectedStages}
            onChange={setSelectedStages}
            placeholder="Select stages..."
          />
        </FilterField>
        <FilterField label="Value Range">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={valueMin}
              onChange={(e) => setValueMin(e.target.value)}
              className="w-full"
            />
            <Input
              type="number"
              placeholder="Max"
              value={valueMax}
              onChange={(e) => setValueMax(e.target.value)}
              className="w-full"
            />
          </div>
        </FilterField>
        <FilterField label="Created Date">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            placeholder="Select date range..."
          />
        </FilterField>
      </AdvancedFilters>

      {/* Deals List */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {stageFilter !== "all" ? stageConfig[stageFilter as DealStage].label : "All"} Deals
              </CardTitle>
              <CardDescription>
                {deals?.length ?? 0} deals found
              </CardDescription>
            </div>
            {stageFilter !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setStageFilter("all")}>
                Clear filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : deals && deals.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {deals.map((deal) => {
                const config = stageConfig[deal.stage as DealStage];
                return (
                  <Card key={deal.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={`${config.bgColor} ${config.color} border-0`}>
                          {config.label}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(deal)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(deal.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h3 className="font-semibold mb-2 line-clamp-2">{deal.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(deal.value, deal.currency || "EUR")}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          {deal.probability}%
                        </div>
                      </div>
                      {deal.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {deal.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">No deals found</h3>
              <p className="text-muted-foreground mb-4">
                {stageFilter !== "all" 
                  ? "No deals in this stage"
                  : "Get started by adding your first deal"}
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Deal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
            <DialogDescription>
              Enter the deal details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Deal Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enterprise Software License"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="10000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value: DealStage) => setFormData({ ...formData, stage: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stageConfig[stage].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="probability">Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the deal..."
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
              disabled={!formData.title || createMutation.isPending}
              className="gradient-primary border-0"
            >
              {createMutation.isPending ? "Creating..." : "Create Deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
            <DialogDescription>
              Update the deal information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Deal Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-value">Value</Label>
                <Input
                  id="edit-value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-stage">Stage</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value: DealStage) => setFormData({ ...formData, stage: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stageConfig[stage].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-probability">Probability (%)</Label>
                <Input
                  id="edit-probability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                />
              </div>
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
              disabled={!formData.title || updateMutation.isPending}
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
            <DialogTitle>Delete Deal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this deal? This action cannot be undone.
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
