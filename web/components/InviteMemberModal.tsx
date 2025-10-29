import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Edit3,
  Calendar,
  FileText,
  Activity,
  Pill,
  User,
  Clock,
  Info,
} from "lucide-react";
import { inviteCareCircleMember, MemberRole, Scope, SCOPE_BUNDLES } from "@/lib/careCircle";
import { toast } from "sonner";
import { format, addDays, addWeeks, addMonths } from "date-fns";

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DURATION_PRESETS = [
  { label: "24 hours", value: () => addDays(new Date(), 1) },
  { label: "1 week", value: () => addWeeks(new Date(), 1) },
  { label: "1 month", value: () => addMonths(new Date(), 1) },
  { label: "3 months", value: () => addMonths(new Date(), 3) },
  { label: "6 months", value: () => addMonths(new Date(), 6) },
  { label: "1 year", value: () => addMonths(new Date(), 12) },
] as const;

export function InviteMemberModal({ open, onOpenChange, onSuccess }: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("viewer");
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [usePreset, setUsePreset] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState("1 month");

  function resetForm() {
    setEmail("");
    setRole("viewer");
    setScopes([]);
    setExpiresAt("");
    setPersonalMessage("");
    setUsePreset(true);
    setSelectedPreset("1 month");
  }

  function getScopeIcon(scope: Scope) {
    switch (scope) {
      case 'medications': return <Pill className="w-4 h-4" />;
      case 'appointments': return <Calendar className="w-4 h-4" />;
      case 'health_logs': return <Activity className="w-4 h-4" />;
      case 'documents': return <FileText className="w-4 h-4" />;
      case 'profile': return <User className="w-4 h-4" />;
      default: return null;
    }
  }

  function getScopeLabel(scope: Scope) {
    switch (scope) {
      case 'medications': return 'Medications';
      case 'appointments': return 'Appointments';
      case 'health_logs': return 'Health Logs';
      case 'documents': return 'Documents';
      case 'profile': return 'Profile';
      default: return scope;
    }
  }

  function getScopeDescription(scope: Scope) {
    switch (scope) {
      case 'medications': return 'View and manage medication reminders and schedules';
      case 'appointments': return 'View and manage medical appointments';
      case 'health_logs': return 'View and track health symptoms and logs';
      case 'documents': return 'View and manage uploaded health documents';
      case 'profile': return 'View basic profile information and emergency contacts';
      default: return '';
    }
  }

  function applyScopeBundle(bundleKey: keyof typeof SCOPE_BUNDLES) {
    setScopes(SCOPE_BUNDLES[bundleKey]);
  }

  function applyDurationPreset(presetLabel: string) {
    const preset = DURATION_PRESETS.find(p => p.label === presetLabel);
    if (preset) {
      const date = preset.value();
      setExpiresAt(format(date, "yyyy-MM-dd'T'HH:mm"));
      setSelectedPreset(presetLabel);
    }
  }

  async function handleSubmit() {
    if (!email || !role || scopes.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    let finalExpiresAt: Date;
    if (usePreset) {
      const preset = DURATION_PRESETS.find(p => p.label === selectedPreset);
      finalExpiresAt = preset ? preset.value() : addMonths(new Date(), 1);
    } else {
      if (!expiresAt) {
        toast.error("Please set an expiration date");
        return;
      }
      finalExpiresAt = new Date(expiresAt);
    }

    if (finalExpiresAt <= new Date()) {
      toast.error("Expiration date must be in the future");
      return;
    }

    setLoading(true);
    try {
      await inviteCareCircleMember({
        email,
        role,
        scopes,
        expiresAt: finalExpiresAt,
        personalMessage: personalMessage || undefined,
      });

      toast.success(`Invitation sent to ${email}`);
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    } finally {
      setLoading(false);
    }
  }

  function getPermissionPreview() {
    const canEdit = role === 'editor';
    const actions = canEdit ? ['View', 'Create', 'Edit', 'Delete'] : ['View'];
    
    return (
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h4 className="font-medium flex items-center gap-2">
          <Info className="w-4 h-4" />
          Permission Preview
        </h4>
        <p className="text-sm text-muted-foreground">
          <strong>{email || "The invitee"}</strong> will be able to <strong>{actions.join(', ').toLowerCase()}</strong> the following data:
        </p>
        <div className="flex flex-wrap gap-1">
          {scopes.map((scope) => (
            <Badge key={scope} variant="outline" className="text-xs">
              {getScopeIcon(scope)}
              <span className="ml-1">{getScopeLabel(scope)}</span>
            </Badge>
          ))}
        </div>
        {scopes.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No data access selected</p>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Care Circle Member</DialogTitle>
          <DialogDescription>
            Share specific parts of your health data with trusted family, caregivers, or clinicians.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="caregiver@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="role">Access Level *</Label>
              <Select value={role} onValueChange={(value: MemberRole) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <div>
                        <div>Viewer</div>
                        <div className="text-xs text-muted-foreground">Read-only access</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      <div>
                        <div>Editor</div>
                        <div className="text-xs text-muted-foreground">Can view and modify data</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scope Bundles */}
          <div>
            <Label>Quick Access Presets</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Object.entries(SCOPE_BUNDLES).map(([key, scopeList]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => applyScopeBundle(key as keyof typeof SCOPE_BUNDLES)}
                  className="justify-start text-left h-auto p-3"
                >
                  <div>
                    <div className="font-medium text-sm">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {scopeList.map(s => getScopeLabel(s)).join(', ')}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Individual Scopes */}
          <div>
            <Label>Data Access Permissions *</Label>
            <div className="space-y-3 mt-2">
              {(['medications', 'appointments', 'health_logs', 'documents', 'profile'] as Scope[]).map((scope) => (
                <div key={scope} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`scope-${scope}`}
                    checked={scopes.includes(scope)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setScopes([...scopes, scope]);
                      } else {
                        setScopes(scopes.filter(s => s !== scope));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getScopeIcon(scope)}
                      <label htmlFor={`scope-${scope}`} className="font-medium text-sm">
                        {getScopeLabel(scope)}
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getScopeDescription(scope)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label>Access Duration *</Label>
            <div className="space-y-3 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-preset"
                  checked={usePreset}
                  onCheckedChange={(checked) => setUsePreset(checked === true)}
                />
                <label htmlFor="use-preset" className="text-sm">Use preset duration</label>
              </div>

              {usePreset ? (
                <Select value={selectedPreset} onValueChange={applyDurationPreset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_PRESETS.map((preset) => (
                      <SelectItem key={preset.label} value={preset.label}>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {preset.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div>
                  <Label htmlFor="expires-at">Custom expiration date</Label>
                  <Input
                    id="expires-at"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Personal Message */}
          <div>
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Hi! I'm inviting you to access my health data to help with my care..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Permission Preview */}
          {getPermissionPreview()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !email || scopes.length === 0}
          >
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}