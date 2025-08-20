import { Doc } from "../../../../convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Balances } from "./balances";
import { Settlements } from "./settlements";
import { ActivityFeed } from "./activity-feed";
import { Charts } from "./charts";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircledIcon } from "@radix-ui/react-icons";

export function GroupOverview({
  group,
}: { group: Doc<"groups"> & { membership: Doc<"members"> } }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{group.name}</h2>
        <AddExpenseDialog groupId={group._id}>
          <Button>
            <PlusCircledIcon className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </AddExpenseDialog>
      </div>
      <Tabs defaultValue="balances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>
        <TabsContent value="balances" className="space-y-4">
          <Balances groupId={group._id} />
        </TabsContent>
        <TabsContent value="settlements" className="space-y-4">
          <Settlements groupId={group._id} />
        </TabsContent>
        <TabsContent value="activity" className="space-y-4">
          <ActivityFeed groupId={group._id} />
        </TabsContent>
        <TabsContent value="charts" className="space-y-4">
          <Charts groupId={group._id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
