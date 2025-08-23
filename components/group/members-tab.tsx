"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export function MembersTab({ groupId }: { groupId: string }) {
    const members =
      useQuery(api.functions.groups.listMembers, {
        groupId: groupId as Id<"groups">,
      }) ?? [];
  const createInvite = useMutation(api.functions.groups.createInvite);

  return (
    <>
      <div className="space-y-2">
          {members.map((m) => (
            <Card key={m._id} className="p-3 flex items-center justify-between">
              <div className="font-medium">{m.user.name}</div>
              <div className="text-xs text-muted-foreground">{m.role}</div>
            </Card>
          ))}
      </div>

      <div className="mt-6">
        <Button
          onClick={async () => {
              const invite = await createInvite({ groupId: groupId as Id<"groups"> });
            if (!invite) {
              toast.error("Could not create invite. Please try again.");
              return;
            }
            const url = `${window.location.origin}/join/${invite.code}`;
            await navigator.clipboard.writeText(url);
            toast.success("Invite link copied", { description: url });
          }}
        >
          Copy invite link
        </Button>
      </div>
    </>
  );
}

