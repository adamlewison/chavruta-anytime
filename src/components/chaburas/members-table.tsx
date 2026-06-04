"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, UserRound, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { declineMember } from "@/server/actions/chaburas";

export type MemberRow = {
  userId: string;
  role: "rosh" | "member" | "pending";
  name: string | null;
  image: string | null;
};

function initialsOf(name: string | null): string {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp className="ml-1.5 h-3.5 w-3.5 shrink-0" />;
  if (sorted === "desc") return <ArrowDown className="ml-1.5 h-3.5 w-3.5 shrink-0" />;
  return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-40" />;
}

function MemberActions({
  member,
  chaburaId,
  isRosh,
}: {
  member: MemberRow;
  chaburaId: string;
  isRosh: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [removing, setRemoving] = useState(false);

  function handleRemove() {
    setRemoving(true);
    startTransition(async () => {
      await declineMember(chaburaId, member.userId);
      router.refresh();
      setRemoving(false);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/profile/${member.userId}`} className="flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            View profile
          </Link>
        </DropdownMenuItem>
        {isRosh && member.role !== "rosh" && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive flex items-center gap-2"
            disabled={removing}
            onSelect={handleRemove}
          >
            <UserMinus className="h-4 w-4" />
            Remove user
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MembersTable({
  members,
  chaburaId,
  isRosh,
}: {
  members: MemberRow[];
  chaburaId: string;
  isRosh: boolean;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<MemberRow>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Member
          <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={row.original.image ?? undefined} alt={row.original.name ?? "Member"} />
            <AvatarFallback className="text-xs">{initialsOf(row.original.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium truncate">{row.original.name || "Anonymous"}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <button
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Role
          <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) =>
        row.original.role === "rosh" ? (
          <Badge variant="secondary">Rosh</Badge>
        ) : (
          <span className="text-sm text-muted-foreground capitalize">{row.original.role}</span>
        ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <MemberActions member={row.original} chaburaId={chaburaId} isRosh={isRosh} />
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: members,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
