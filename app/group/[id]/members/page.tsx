import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { notFound } from "next/navigation";
import { MemberList } from "./_components/member-list";

type MembersPageProps = {
  params: {
    id: Id<"groups">;
  };
};

export default function MembersPage({ params: { id } }: MembersPageProps) {
  const group = useQuery(api.groups.get, { groupId: id });

  if (group === undefined) {
    return <div>Loading...</div>; // Or a skeleton loader
  }

  if (group === null) {
    notFound(); // Group not found or user not a member
  }

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-3xl font-bold tracking-tight">Members of {group.name}</h2>
      <MemberList groupId={id} />
    </div>
  );
}
