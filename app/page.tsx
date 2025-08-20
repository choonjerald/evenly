'use client'

import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInButton, UserButton } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircledIcon } from '@radix-ui/react-icons'
import { CreateGroupDialog } from '@/components/create-group-dialog'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Authenticated>
        <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
          <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
            Get started by editing&nbsp;
            <code className="font-mono font-bold">app/page.tsx</code>
          </p>
          <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
        <Content />
      </Authenticated>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
    </main>
  )
}

function Content() {
  const groups = useQuery(api.groups.list)

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-2xl font-bold tracking-tight">Your Groups</h2>
      <div className="flex items-center justify-between space-y-2">
        <CreateGroupDialog>
          <Button>
            <PlusCircledIcon className="mr-2 h-4 w-4" />
            Create New Group
          </Button>
        </CreateGroupDialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {groups?.map((group) => (
          <Link key={group._id} href={`/group/${group._id}`}>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="text-lg font-semibold leading-none tracking-tight">{group.name}</h3>
              <p className="text-sm text-muted-foreground">{group.homeCurrency}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}