import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { InviteMemberDialog } from "./invite-member-dialog";

export function MemberList({ groupId }: { groupId: Id<"groups"> }) {
  const members = useQuery(api.members.get, { groupId });
  const invites = useQuery(api.invites.list, { groupId });
  const updateRole = useMutation(api.members.updateRole);
  const removeMember = useMutation(api.members.removeMember);
  const deleteInvite = useMutation(api.invites.deleteInvite);

  if (members === undefined || invites === undefined) {
    return <div>Loading members...</div>; // Or a skeleton loader
  }

  const handleUpdateRole = async (membershipId: Id<"members">, role: "owner" | "admin" | "member" | "viewer") => {
    try {
      await updateRole({ membershipId, role });
      toast.success("Role updated!");
    } catch (error) {
      toast.error("Error updating role", {
        description: (error as Error).message,
      });
    };

    const handleRemoveMember = async (membershipId: Id<"members">) => {
      try {
        await removeMember({ membershipId });
        toast.success("Member removed!");
      } catch (error) {
        toast.error("Error removing member", {
          description: (error as Error).message,
        });
      };

      const handleDeleteInvite = async (inviteId: Id<"invites">) => {
        try {
          await deleteInvite({ inviteId });
          toast.success("Invite deleted!");
        } catch (error) {
          toast.error("Error deleting invite", {
            description: (error as Error).message,
          });
        };

        return (
          <div className="space-y-4">
            <InviteMemberDialog groupId={groupId} />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell>{member.user?.name || "Unknown User"}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <DotsHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateRole(member._id, "owner")}>Make Owner</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(member._id, "admin")}>Make Admin</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(member._id, "member")}>Make Member</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(member._id, "viewer")}>Make Viewer</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRemoveMember(member._id)}>Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {invites.map((invite) => (
                  <TableRow key={invite._id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>{invite.role}</TableCell>
                    <TableCell>Pending Invite</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" onClick={() => handleDeleteInvite(invite._id)}>Delete Invite</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      }
    }
  }
}
