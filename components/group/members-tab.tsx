"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function MembersTab({ groupId }: { groupId: string }) {
  const members =
    useQuery(api.functions.groups.listMembers, { groupId: groupId as any }) ?? [];
  const createInvite = useMutation(api.functions.groups.createInvite);

  return (
    <>
      <div className="space-y-2">
        {members.map((m: any) => (
          <Card key={m._id} className="p-3 flex items-center justify-between">
            <div className="font-medium">{m.user.name}</div>
            <div className="text-xs text-muted-foreground">{m.role}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Button
          onClick={async () => {
            const invite = await createInvite({ groupId: groupId as any });
            if (!invite) {
              alert("Could not create invite. Please try again.");
              return;
            }
            const url = `${window.location.origin}/join/${invite.code}`;
            await navigator.clipboard.writeText(url);
            alert("Invite link copied: " + url);
          }}
        >
          Copy invite link
        </Button>
      </div>
    </>
  );
}

