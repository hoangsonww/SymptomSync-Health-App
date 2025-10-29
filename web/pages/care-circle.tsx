import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import {
  getCareCircleMembers,
  updateCareCircleMember,
  revokeCareCircleMember,
  CareCircleMember,
  AccessGrant,
  MemberRole,
  Scope,
} from "@/lib/careCircle";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  Clock,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle,
  Calendar,
  FileText,
  Activity,
  Pill,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import Head from "next/head";
import { InviteMemberModal } from "@/components/InviteMemberModal";
import { AuditLogViewer } from "@/components/AuditLogViewer";

interface MemberWithGrant extends CareCircleMember {
  grant: AccessGrant;
}

export default function CareCirclePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberWithGrant[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberWithGrant | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [memberToRevoke, setMemberToRevoke] = useState<MemberWithGrant | null>(null);

  // Form states for editing
  const [editRole, setEditRole] = useState<MemberRole>("viewer");
  const [editScopes, setEditScopes] = useState<Scope[]>([]);
  const [editExpiresAt, setEditExpiresAt] = useState("");

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  async function checkAuth() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push("/auth");
        return;
      }
      setUser(user);
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/auth");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMembers() {
    try {
      const membersList = await getCareCircleMembers();
      setMembers(membersList);
    } catch (error) {
      console.error("Error fetching care circle members:", error);
      toast.error("Failed to load care circle members");
    }
  }

  function handleEditMember(member: MemberWithGrant) {
    setEditingMember(member);
    setEditRole(member.role);
    setEditScopes(member.grant.scopes as Scope[]);
    setEditExpiresAt(format(new Date(member.grant.expires_at), "yyyy-MM-dd'T'HH:mm"));
    setEditModalOpen(true);
  }

  async function handleSaveEdit() {
    if (!editingMember) return;

    try {
      await updateCareCircleMember(editingMember.id, {
        role: editRole,
        scopes: editScopes,
        expiresAt: new Date(editExpiresAt),
      });

      toast.success("Member permissions updated successfully");
      setEditModalOpen(false);
      setEditingMember(null);
      await fetchMembers();
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error("Failed to update member permissions");
    }
  }

  function handleRevokeMember(member: MemberWithGrant) {
    setMemberToRevoke(member);
    setRevokeModalOpen(true);
  }

  async function confirmRevoke() {
    if (!memberToRevoke) return;

    try {
      await revokeCareCircleMember(memberToRevoke.id);
      toast.success("Member access revoked successfully");
      setRevokeModalOpen(false);
      setMemberToRevoke(null);
      await fetchMembers();
    } catch (error) {
      console.error("Error revoking member:", error);
      toast.error("Failed to revoke member access");
    }
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

  function getStatusColor(member: MemberWithGrant) {
    if (member.status === 'revoked') return 'bg-red-100 text-red-800';
    if (member.status === 'expired') return 'bg-gray-100 text-gray-800';
    if (isPast(new Date(member.grant.expires_at))) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  function getStatusLabel(member: MemberWithGrant) {
    if (member.status === 'revoked') return 'Revoked';
    if (member.status === 'expired') return 'Expired';
    if (member.status === 'invited') return 'Pending';
    if (isPast(new Date(member.grant.expires_at))) return 'Expired';
    return 'Active';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Care Circle - SymptomSync</title>
        <meta name="description" content="Manage your care circle and shared access" />
      </Head>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Users className="w-8 h-8" />
                Care Circle
              </h1>
              <p className="text-muted-foreground mt-2">
                Share your health data securely with trusted caregivers, family, and clinicians
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setAuditModalOpen(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Activity
              </Button>
              <Button
                onClick={() => setInviteModalOpen(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Invite Member
              </Button>
            </div>
          </div>

          {/* Members List */}
          <div className="grid gap-4">
            {members.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No care circle members yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by inviting trusted family members, caregivers, or clinicians to access your health data
                  </p>
                  <Button onClick={() => setInviteModalOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite First Member
                  </Button>
                </CardContent>
              </Card>
            ) : (
              members.map((member) => (
                <Card key={member.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{member.email}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant={member.role === 'editor' ? 'default' : 'secondary'}>
                                {member.role === 'editor' ? <Edit3 className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                                {member.role}
                              </Badge>
                              <Badge variant="outline" className={getStatusColor(member)}>
                                {getStatusLabel(member)}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Scopes */}
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground mb-2">Access to:</p>
                          <div className="flex flex-wrap gap-1">
                            {member.grant.scopes.map((scope) => (
                              <Badge key={scope} variant="outline" className="text-xs">
                                {getScopeIcon(scope as Scope)}
                                <span className="ml-1">{getScopeLabel(scope as Scope)}</span>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Timing info */}
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span>
                              Invited: {format(new Date(member.invited_at), "MMM d, yyyy")}
                            </span>
                            {member.accepted_at && (
                              <span>
                                Accepted: {format(new Date(member.accepted_at), "MMM d, yyyy")}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires: {format(new Date(member.grant.expires_at), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {member.status === 'active' && (
                          <Button
                            onClick={() => handleEditMember(member)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        )}
                        {member.status !== 'revoked' && (
                          <Button
                            onClick={() => handleRevokeMember(member)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Invite Modal */}
        <InviteMemberModal
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
          onSuccess={fetchMembers}
        />

        {/* Audit Log Modal */}
        <AuditLogViewer
          open={auditModalOpen}
          onOpenChange={setAuditModalOpen}
        />

        {/* Edit Member Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Member Permissions</DialogTitle>
              <DialogDescription>
                Update access level and permissions for {editingMember?.email}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editRole} onValueChange={(value: MemberRole) => setEditRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Viewer (read-only)
                      </div>
                    </SelectItem>
                    <SelectItem value="editor">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4" />
                        Editor (can modify)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Access Scopes</Label>
                <div className="space-y-2 mt-2">
                  {(['medications', 'appointments', 'health_logs', 'documents', 'profile'] as Scope[]).map((scope) => (
                    <div key={scope} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-scope-${scope}`}
                        checked={editScopes.includes(scope)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditScopes([...editScopes, scope]);
                          } else {
                            setEditScopes(editScopes.filter(s => s !== scope));
                          }
                        }}
                      />
                      <div className="flex items-center gap-2">
                        {getScopeIcon(scope)}
                        <label htmlFor={`edit-scope-${scope}`} className="text-sm">
                          {getScopeLabel(scope)}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-expires">Expires At</Label>
                <Input
                  id="edit-expires"
                  type="datetime-local"
                  value={editExpiresAt}
                  onChange={(e) => setEditExpiresAt(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={editScopes.length === 0}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Revoke Confirmation Modal */}
        <Dialog open={revokeModalOpen} onOpenChange={setRevokeModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Revoke Access
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to revoke access for {memberToRevoke?.email}? 
                This action cannot be undone and they will immediately lose access to your health data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRevokeModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmRevoke}>
                Revoke Access
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}