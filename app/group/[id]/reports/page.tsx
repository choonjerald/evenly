import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type ReportsPageProps = {
  params: {
    id: Id<"groups">;
  };
};

export default function ReportsPage({ params: { id } }: ReportsPageProps) {
  const group = useQuery(api.groups.get, { groupId: id });

  if (group === undefined) {
    return <div>Loading...</div>; // Or a skeleton loader
  }

  if (group === null) {
    notFound(); // Group not found or user not a member
  }

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-3xl font-bold tracking-tight">Reports for {group.name}</h2>
      <div className="mt-4 space-y-4">
        <p>Generate CSV exports for your group's data.</p>
        <Button asChild>
          <Link href={`/api/export?groupId=${id}`}>Export All Expenses (CSV)</Link>
        </Button>
        {/* Add more export options here later */}
      </div>
    </div>
  );
}
