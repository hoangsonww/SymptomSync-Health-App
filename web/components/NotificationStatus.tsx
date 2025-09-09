/**
 * Notification status indicator component
 * Shows notification permission status and offline queue count
 */

import React from 'react';
import { Bell, BellOff, Wifi, WifiOff, CloudOff, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNotifications } from '@/lib/useNotifications';

interface NotificationStatusProps {
  userId?: string;
  authToken?: string;
  showLabel?: boolean;
  onClick?: () => void;
}

export function NotificationStatus({ 
  userId, 
  authToken, 
  showLabel = false, 
  onClick 
}: NotificationStatusProps) {
  const {
    permission,
    isSubscribed,
    isSupported,
    swReady,
    offlineQueue,
    loading
  } = useNotifications({ userId, authToken });

  if (loading || !isSupported) {
    return null;
  }

  const isOnline = navigator.onLine;
  const hasQueuedItems = offlineQueue.notificationActions > 0 || offlineQueue.offlineData > 0;
  const totalQueueItems = offlineQueue.notificationActions + offlineQueue.offlineData;

  // Determine status icon and color
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: 'text-orange-500',
        status: 'offline',
        tooltip: 'You are offline. Changes will be synced when connection is restored.'
      };
    }

    if (hasQueuedItems) {
      return {
        icon: CloudOff,
        color: 'text-amber-500',
        status: 'syncing',
        tooltip: `${totalQueueItems} items pending sync`
      };
    }

    if (permission === 'granted' && isSubscribed && swReady) {
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        status: 'enabled',
        tooltip: 'Push notifications are enabled'
      };
    }

    if (permission === 'denied') {
      return {
        icon: BellOff,
        color: 'text-red-500',
        status: 'blocked',
        tooltip: 'Push notifications are blocked. Enable in browser settings.'
      };
    }

    return {
      icon: Bell,
      color: 'text-gray-500',
      status: 'disabled',
      tooltip: 'Push notifications are disabled. Click to enable.'
    };
  };

  const { icon: StatusIcon, color, status, tooltip } = getStatusInfo();

  const buttonContent = (
    <div className="flex items-center gap-2">
      <div className="relative">
        <StatusIcon className={`w-4 h-4 ${color}`} />
        {hasQueuedItems && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center min-w-0"
          >
            {totalQueueItems > 99 ? '99+' : totalQueueItems}
          </Badge>
        )}
      </div>
      {showLabel && (
        <span className="text-sm">
          {status === 'offline' && 'Offline'}
          {status === 'syncing' && 'Syncing'}
          {status === 'enabled' && 'Notifications'}
          {status === 'blocked' && 'Blocked'}
          {status === 'disabled' && 'Notifications'}
        </span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClick}
              className="h-8 px-2"
            >
              {buttonContent}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-2 py-1 rounded">
            {buttonContent}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Simplified notification bell for navigation
 */
export function NotificationBell({ userId, authToken, onClick }: NotificationStatusProps) {
  return (
    <NotificationStatus
      userId={userId}
      authToken={authToken}
      showLabel={false}
      onClick={onClick}
    />
  );
}

/**
 * Detailed notification status for settings or dashboard
 */
export function NotificationStatusDetail({ userId, authToken }: Omit<NotificationStatusProps, 'onClick'>) {
  const {
    permission,
    isSubscribed,
    isSupported,
    offlineQueue,
    loading
  } = useNotifications({ userId, authToken });

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        Loading...
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="w-4 h-4" />
        Push notifications not supported
      </div>
    );
  }

  const isOnline = navigator.onLine;
  const hasQueuedItems = offlineQueue.notificationActions > 0 || offlineQueue.offlineData > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        {permission === 'granted' && isSubscribed ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : permission === 'denied' ? (
          <BellOff className="w-4 h-4 text-red-500" />
        ) : (
          <Bell className="w-4 h-4 text-gray-500" />
        )}
        <span>
          {permission === 'granted' && isSubscribed
            ? 'Push notifications enabled'
            : permission === 'denied'
            ? 'Push notifications blocked'
            : 'Push notifications disabled'}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-orange-500" />
        )}
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {hasQueuedItems && (
        <div className="flex items-center gap-2 text-sm">
          <CloudOff className="w-4 h-4 text-amber-500" />
          <span>
            {offlineQueue.notificationActions + offlineQueue.offlineData} items pending sync
          </span>
        </div>
      )}
    </div>
  );
}