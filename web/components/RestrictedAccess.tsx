import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { checkUserAccess, Scope } from "@/lib/careCircle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit3, Lock, UserPlus } from "lucide-react";

interface RestrictedAccessWrapperProps {
  children: React.ReactNode;
  targetUserId?: string;
  requiredScope: Scope;
  requiredAction?: 'view' | 'create' | 'update' | 'delete';
  fallbackMessage?: string;
  showAccessBadge?: boolean;
}

export function RestrictedAccessWrapper({
  children,
  targetUserId,
  requiredScope,
  requiredAction = 'view',
  fallbackMessage,
  showAccessBadge = true,
}: RestrictedAccessWrapperProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwnData, setIsOwnData] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [targetUserId, requiredScope, requiredAction]);

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasAccess(false);
        return;
      }

      setCurrentUserId(user.id);

      // If no targetUserId is provided, assume it's the current user's data
      const effectiveTargetUserId = targetUserId || user.id;
      setIsOwnData(user.id === effectiveTargetUserId);

      // If it's the user's own data, they always have access
      if (user.id === effectiveTargetUserId) {
        setHasAccess(true);
        return;
      }

      // Check delegated access
      const access = await checkUserAccess(effectiveTargetUserId, requiredScope, requiredAction);
      setHasAccess(access);
    } catch (error) {
      console.error("Error checking access:", error);
      setHasAccess(false);
    }
  }

  // Loading state
  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          {fallbackMessage || `You don't have permission to ${requiredAction} ${requiredScope} data.`}
          {!isOwnData && (
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Render with access badge if requested
  if (showAccessBadge && !isOwnData) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <UserPlus className="w-3 h-3 mr-1" />
            Viewing via Care Circle
          </Badge>
          <Badge variant="outline" className="bg-gray-50">
            {requiredAction === 'view' ? <Eye className="w-3 h-3 mr-1" /> : <Edit3 className="w-3 h-3 mr-1" />}
            {requiredAction} access
          </Badge>
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}

// Higher-order component version for easy wrapping
export function withRestrictedAccess<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requiredScope: Scope;
    requiredAction?: 'view' | 'create' | 'update' | 'delete';
    fallbackMessage?: string;
  }
) {
  return function RestrictedComponent(props: P) {
    return (
      <RestrictedAccessWrapper {...options}>
        <Component {...props} />
      </RestrictedAccessWrapper>
    );
  };
}

// Hook for checking access in components
export function useRestrictedAccess(
  targetUserId: string | undefined,
  requiredScope: Scope,
  requiredAction: 'view' | 'create' | 'update' | 'delete' = 'view'
) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isOwnData, setIsOwnData] = useState(false);

  useEffect(() => {
    if (!targetUserId) return;

    async function checkAccess() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHasAccess(false);
          return;
        }

        setIsOwnData(user.id === targetUserId);

        if (user.id === targetUserId) {
          setHasAccess(true);
          return;
        }

        const access = await checkUserAccess(targetUserId, requiredScope, requiredAction);
        setHasAccess(access);
      } catch (error) {
        console.error("Error checking access:", error);
        setHasAccess(false);
      }
    }

    checkAccess();
  }, [targetUserId, requiredScope, requiredAction]);

  return { hasAccess, isOwnData, loading: hasAccess === null };
}