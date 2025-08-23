"use client";

import { useParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpensesTab } from "@/components/group/expenses-tab";
import { BalancesTab } from "@/components/group/balances-tab";
import { MembersTab } from "@/components/group/members-tab";
import { SettingsTab } from "@/components/group/settings-tab";

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-6">
          <ExpensesTab groupId={groupId as string} />
        </TabsContent>
        <TabsContent value="balances" className="mt-6">
          <BalancesTab groupId={groupId as string} />
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <MembersTab groupId={groupId as string} />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

