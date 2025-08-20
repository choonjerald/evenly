import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export function ActivityFeed({ groupId }: { groupId: Id<"groups"> }) {
  const activity = useQuery(api.activity.list, { groupId });

  if (activity === undefined) {
    return <div>Loading activity...</div>; // Or a skeleton loader
  }

  if (activity.length === 0) {
    return <p>No activity yet.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activity.map((item) => (
            <div key={item._id} className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={item.user?.avatarUrl || ""} />
                <AvatarFallback>{item.user?.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">
                  {item.user?.name || "Unknown User"} {item.verb} a {item.entityType}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
