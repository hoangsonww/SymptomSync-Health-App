import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  FileText,
  Activity,
  Pill,
  User,
  Download,
  Eye,
  Edit,
  Plus,
  Trash,
  Filter,
  Download as DownloadIcon,
} from "lucide-react";
import { getAuditLog, AuditLog } from "@/lib/careCircle";
import { toast } from "sonner";
import { format, startOfDay, endOfDay } from "date-fns";

interface AuditLogViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogViewer({ open, onOpenChange }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [limit, setLimit] = useState("50");

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params: {
        resourceType?: 'medication' | 'appointment' | 'health_log' | 'document' | 'profile';
        startDate?: Date;
        endDate?: Date;
        limit?: number;
      } = {};
      
      if (resourceTypeFilter !== "all") {
        const validTypes = ['medication', 'appointment', 'health_log', 'document', 'profile'] as const;
        if (validTypes.includes(resourceTypeFilter as typeof validTypes[number])) {
          params.resourceType = resourceTypeFilter as typeof validTypes[number];
        }
      }
      
      if (startDate) {
        params.startDate = startOfDay(new Date(startDate));
      }
      
      if (endDate) {
        params.endDate = endOfDay(new Date(endDate));
      }
      
      if (limit) {
        params.limit = parseInt(limit, 10);
      }

      const auditLogs = await getAuditLog(params);
      setLogs(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  function getActionIcon(action: AuditLog['action']) {
    switch (action) {
      case 'create': return <Plus className="w-4 h-4 text-green-600" />;
      case 'update': return <Edit className="w-4 h-4 text-blue-600" />;
      case 'delete': return <Trash className="w-4 h-4 text-red-600" />;
      case 'download': return <Download className="w-4 h-4 text-purple-600" />;
      case 'view': return <Eye className="w-4 h-4 text-gray-600" />;
      default: return null;
    }
  }

  function getResourceIcon(resourceType: AuditLog['resource_type']) {
    switch (resourceType) {
      case 'medication': return <Pill className="w-4 h-4" />;
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'health_log': return <Activity className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'profile': return <User className="w-4 h-4" />;
      default: return null;
    }
  }

  function getActionLabel(action: AuditLog['action']) {
    switch (action) {
      case 'create': return 'Created';
      case 'update': return 'Updated';
      case 'delete': return 'Deleted';
      case 'download': return 'Downloaded';
      case 'view': return 'Viewed';
      default: return action;
    }
  }

  function getResourceLabel(resourceType: AuditLog['resource_type']) {
    switch (resourceType) {
      case 'medication': return 'Medication';
      case 'appointment': return 'Appointment';
      case 'health_log': return 'Health Log';
      case 'document': return 'Document';
      case 'profile': return 'Profile';
      default: return resourceType;
    }
  }

  function exportToCsv() {
    const headers = ['Date', 'Actor', 'Action', 'Resource Type', 'Resource ID', 'Metadata'];
    const csvData = logs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.actor_user_id,
      getActionLabel(log.action),
      getResourceLabel(log.resource_type),
      log.resource_id || '',
      JSON.stringify(log.metadata)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Activity Audit Log</DialogTitle>
          <DialogDescription>
            View all actions performed by care circle members on your health data
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-4 border-b pb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="resource-filter">Resource Type</Label>
              <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="medication">Medications</SelectItem>
                  <SelectItem value="appointment">Appointments</SelectItem>
                  <SelectItem value="health_log">Health Logs</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="limit">Limit</Label>
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 entries</SelectItem>
                  <SelectItem value="50">50 entries</SelectItem>
                  <SelectItem value="100">100 entries</SelectItem>
                  <SelectItem value="250">250 entries</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchLogs} disabled={loading} size="sm">
              <Filter className="w-4 h-4 mr-2" />
              {loading ? "Loading..." : "Apply Filters"}
            </Button>
            <Button onClick={exportToCsv} variant="outline" size="sm" disabled={logs.length === 0}>
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No activity found</p>
              <p className="text-sm">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      {getResourceIcon(log.resource_type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {getActionLabel(log.action)} {getResourceLabel(log.resource_type)}
                        </span>
                        {log.resource_id && (
                          <Badge variant="outline" className="text-xs">
                            ID: {log.resource_id.slice(0, 8)}...
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>By user: {log.actor_user_id.slice(0, 8)}...</p>
                        <p>{format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                      </div>

                      {/* Metadata */}
                      {Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View details
                          </summary>
                          <div className="mt-1 p-2 bg-muted rounded text-xs">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {logs.length > 0 && (
          <div className="border-t pt-4 text-sm text-muted-foreground">
            Showing {logs.length} entries
            {startDate && ` from ${format(new Date(startDate), 'MMM d, yyyy')}`}
            {endDate && ` to ${format(new Date(endDate), 'MMM d, yyyy')}`}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}