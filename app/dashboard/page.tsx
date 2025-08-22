"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default function Dashboard() {
  const groups = useQuery(api.functions.groups.myGroups) ?? [];
  const createGroup = useMutation(api.functions.groups.createGroup);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("SGD");

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Your groups</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Create group</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SGD">SGD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                onClick={async () => {
                  await createGroup({ name, currency });
                  setOpen(false); setName(""); setCurrency("SGD");
                }}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <div className="text-muted-foreground">No groups yet — create your first one.</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {groups.map((g: any) => (
            <Link key={g._id} href={`/g/${g._id}`}>
              <Card className="hover:shadow">
                <CardHeader>
                  <CardTitle>{g.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Currency: {g.currency}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
