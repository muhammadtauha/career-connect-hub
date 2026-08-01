import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth";
import { useNotifications, type Notification } from "@/lib/notifications";
import { relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export function NotificationItem({
  notification,
  onOpen,
}: {
  notification: Notification;
  onOpen: (notification: Notification) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent/60",
        !notification.read && "bg-primary/5",
      )}
    >
      <span
        className={cn(
          "mt-1.5 size-1.5 shrink-0 rounded-full",
          notification.read ? "bg-transparent" : "bg-primary",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{notification.title}</span>
        {notification.body ? (
          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
            {notification.body}
          </span>
        ) : null}
        <span className="mt-1 block text-[11px] text-muted-foreground">
          {relativeTime(notification.created_at)}
        </span>
      </span>
    </button>
  );
}

export function NotificationBell() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const { items, unread, markRead, markAllRead, query } = useNotifications(userId, 15);

  const open = (notification: Notification) => {
    if (!notification.read) markRead.mutate(notification.id);
    if (notification.link) navigate({ to: notification.link } as never);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unread > 0 ? (
            <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] leading-4 text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={unread === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="size-3.5" /> Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-80">
          <div className="p-1">
            {query.isPending ? (
              <div className="space-y-2 p-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-muted/60" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                You're all caught up.
              </p>
            ) : (
              items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onOpen={open}
                />
              ))
            )}
          </div>
        </ScrollArea>
        <div className="border-t border-border p-1">
          <Button asChild variant="ghost" size="sm" className="w-full justify-center text-xs">
            <Link to="/notifications">View all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
