/**
 * Example: Enhanced Medication Reminders page with Care Circle support
 * This shows how existing pages can be enhanced to support delegated access
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { getMedicationRemindersByUser, createMedicationReminder, MedicationReminder } from "@/lib/medications";
import { RestrictedAccessWrapper, useRestrictedAccess } from "@/components/RestrictedAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pill, Plus, UserPlus, Eye, Edit3 } from "lucide-react";
import { toast } from "sonner";

export default function EnhancedMedicationPage() {
  const router = useRouter();
  const { userId } = router.query; // Support for viewing other users' data
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check access permissions
  const { hasAccess, isOwnData, loading: accessLoading } = useRestrictedAccess(
    userId as string,
    'medications',
    'view'
  );

  const { hasAccess: canEdit } = useRestrictedAccess(
    userId as string,
    'medications',
    'update'
  );

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && hasAccess !== null) {
      loadMedications();
    }
  }, [currentUser, hasAccess, userId]);

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  }

  async function loadMedications() {
    if (!hasAccess) return;
    
    try {
      setLoading(true);
      const targetUserId = userId as string || currentUser?.id;
      const meds = await getMedicationRemindersByUser(targetUserId);
      setMedications(meds);
    } catch (error) {
      console.error("Error loading medications:", error);
      toast.error("Failed to load medications");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMedication(medicationData: any) {
    if (!canEdit) {
      toast.error("You don't have permission to add medications");
      return;
    }

    try {
      const targetUserId = userId as string || currentUser?.id;
      await createMedicationReminder({
        ...medicationData,
        user_profile_id: targetUserId,
      });
      
      toast.success("Medication added successfully");
      await loadMedications();
    } catch (error) {
      console.error("Error adding medication:", error);
      toast.error("Failed to add medication");
    }
  }

  if (accessLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <RestrictedAccessWrapper
      targetUserId={userId as string}
      requiredScope="medications"
      requiredAction="view"
      fallbackMessage="You need permission to view medications data."
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header with access indicators */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Pill className="w-8 h-8" />
              Medication Reminders
              {!isOwnData && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <UserPlus className="w-3 h-3 mr-1" />
                  Care Circle View
                </Badge>
              )}
            </h1>
            {!isOwnData && (
              <p className="text-muted-foreground mt-1">
                Viewing medication data via care circle access
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {/* Show current access level */}
            <Badge variant={canEdit ? "default" : "secondary"}>
              {canEdit ? <Edit3 className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              {canEdit ? "Edit Access" : "View Only"}
            </Badge>

            {canEdit && (
              <Button onClick={() => {/* Open add medication modal */}}>
                <Plus className="w-4 h-4 mr-2" />
                Add Medication
              </Button>
            )}
          </div>
        </div>

        {/* Read-only notice for viewers */}
        {!isOwnData && !canEdit && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Eye className="h-4 w-4" />
            <AlertDescription>
              You have view-only access to this medication data. Contact the owner to request edit permissions.
            </AlertDescription>
          </Alert>
        )}

        {/* Medications list */}
        <div className="grid gap-4">
          {medications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Pill className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No medications found</h3>
                <p className="text-muted-foreground">
                  {isOwnData 
                    ? "Start by adding your first medication reminder"
                    : "No medications have been shared with you"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            medications.map((medication) => (
              <Card key={medication.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{medication.medication_name}</span>
                    {!isOwnData && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Shared Data
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Dosage</p>
                      <p className="font-medium">{medication.dosage}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Next Reminder</p>
                      <p className="font-medium">
                        {new Date(medication.reminder_time).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons with permission checks */}
                  <div className="flex gap-2 mt-4">
                    {canEdit ? (
                      <>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          Delete
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Care circle context */}
        {!isOwnData && (
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Care Circle Access</h4>
            <p className="text-sm text-muted-foreground">
              You are viewing this data through a care circle invitation. 
              All your actions are logged for security and transparency.
            </p>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => router.push('/care-circle')}>
                View My Care Circle
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/audit-log')}>
                View Activity Log
              </Button>
            </div>
          </div>
        )}
      </div>
    </RestrictedAccessWrapper>
  );
}

/**
 * Usage Notes:
 * 
 * 1. URL Structure:
 *    - /medications (own data)
 *    - /medications?userId=other-user-id (delegated access)
 * 
 * 2. Access Control:
 *    - RestrictedAccessWrapper handles scope validation
 *    - useRestrictedAccess hook provides permission state
 *    - Graceful fallbacks for denied access
 * 
 * 3. UI Adaptations:
 *    - Access level badges and indicators
 *    - Conditional action buttons
 *    - Read-only notices for viewers
 *    - Care circle context information
 * 
 * 4. Audit Trail:
 *    - All actions automatically logged via database triggers
 *    - Owner receives notifications for changes
 *    - Complete audit trail available
 * 
 * 5. Security:
 *    - RLS policies enforce database-level security
 *    - Frontend restrictions prevent unauthorized actions
 *    - Time-based access expiration
 */