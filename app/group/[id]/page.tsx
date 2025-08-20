import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { notFound } from "next/navigation";
import { GroupOverview } from "./_components/group-overview";

type GroupPageProps = {
  params: {
    id: Id<"groups">;
  };
};

export default function GroupPage({ params: { id } }: GroupPageProps) {
  const group = useQuery(api.groups.get, { groupId: id });

  if (group === undefined) {
    return <div>Loading...</div>; // Or a skeleton loader
  }

  if (group === null) {
    notFound(); // Group not found or user not a member
  }

  return (
    <div className="container mx-auto py-10">
      <GroupOverview group={group} />
    </div>
  );
}
