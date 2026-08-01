import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BellOff, CheckCheck } from "lucide-react";

import { NotificationItem } from "@/components/notification-bell";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useNotifications, type Notification } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — CareerCollab" },
      {
        name: "description",
        content:
          "Every application update, milestone review and review you've received on CareerCollab, in one timeline.",
      },
      { property: "og:title", content: "Notifications — CareerCollab" },
      { property: "og:description", content: "Your CareerCollab activity history." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const { items, unread, query, markRead, markAllRead } = useNotifications(userId, 100);

  const open = (notification: Notification) => {
    if (!notification.read) markRead.mutate(notification.id);
    if (notification.link) navigate({ to: notification.link } as never);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={
          unread > 0 ? `${unread} unread update${unread === 1 ? "" : "s"}` : "You're all caught up."
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={unread === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        }
      />

      {query.isPending ? (
        <ListSkeleton rows={4} />
      ) : query.isError ? (
        <ErrorState message={(query.error as Error).message} onRetry={query.refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BellOff className="size-5" />}
          title="Nothing here yet"
          description="Applications, milestone reviews and new ratings will show up in this timeline."
        />
      ) : (
        <div className="panel divide-y divide-border p-1">
          {items.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} onOpen={open} />
          ))}
        </div>
      )}
    </div>
  );
}
