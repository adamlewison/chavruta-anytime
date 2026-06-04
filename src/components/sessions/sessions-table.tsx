"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { cancelSession } from "@/server/actions/sessions";
import { describeSchedule } from "@/lib/rrule";
import { toast } from "sonner";

export type SessionRow = {
  id: string;
  title: string | null;
  status: string;
  createdById: string;
  rrule: string | null;
  dtstart: Date | null;
  durationMin: number | null;
  timezone: string | null;
};

function StatusDot({ status }: { status: string }) {
  if (status === "active")
    return (
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
    );
  if (status === "paused")
    return <span className="inline-flex h-2 w-2 rounded-full bg-yellow-400 shrink-0" />;
  if (status === "cancelled")
    return <span className="inline-flex h-2 w-2 rounded-full bg-red-400 shrink-0" />;
  return <span className="inline-flex h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />;
}

function formatDuration(min: number | null): string | null {
  if (!min) return null;
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp className="ml-1.5 h-3.5 w-3.5 shrink-0" />;
  if (sorted === "desc") return <ArrowDown className="ml-1.5 h-3.5 w-3.5 shrink-0" />;
  return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-40" />;
}

export function SessionsTable({
  sessions,
  currentUserId,
  canEdit = true,
}: {
  sessions: SessionRow[];
  currentUserId: string;
  canEdit?: boolean;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const router = useRouter();

  async function handleDelete(sessionId: string) {
    if (!confirm("Cancel this session series? This cannot be undone.")) return;
    const result = await cancelSession(sessionId);
    if (result.success) {
      toast.success("Session cancelled");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to cancel session");
    }
  }

  const columns: ColumnDef<SessionRow>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <button
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Session
          <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="flex items-center gap-2 font-medium">
          <StatusDot status={row.original.status} />
          {row.original.title ?? "Learning Session"}
        </span>
      ),
    },
    {
      id: "schedule",
      header: () => (
        <span className="text-muted-foreground">Schedule</span>
      ),
      cell: ({ row }) => {
        const s = row.original;
        const label = describeSchedule(s.rrule, s.dtstart, s.timezone);
        if (!label)
          return <span className="text-muted-foreground italic text-xs">No schedule</span>;
        return <span className="text-muted-foreground text-sm">{label}</span>;
      },
    },
    {
      id: "duration",
      header: () => <span className="text-muted-foreground">Duration</span>,
      cell: ({ row }) => {
        const d = formatDuration(row.original.durationMin);
        if (!d)
          return <span className="text-muted-foreground italic text-xs">—</span>;
        return <span className="text-muted-foreground text-sm">{d}</span>;
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const canDelete = row.original.createdById === currentUserId;
        if (!canEdit && !canDelete) return null;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem asChild>
                    <Link href={`/sessions/${row.original.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDelete(row.original.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cancel session
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: sessions,
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
