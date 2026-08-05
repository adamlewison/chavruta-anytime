"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, Pencil, X, Loader2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cancelOccurrence, restoreOccurrence } from "@/server/actions/session-occurrences";
import { toast } from "sonner";

export type OccurrenceRow = {
  id: string;
  sessionId: string;
  startsAt: string;
  endsAt: string;
  status: "scheduled" | "cancelled" | "completed" | "missed";
  meetUrl: string;
  title: string;
};

const STATUS_CLASSES: Record<OccurrenceRow["status"], string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  missed:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc")
    return <ArrowUp className="ml-1.5 h-3.5 w-3.5 shrink-0" />;
  if (sorted === "desc")
    return <ArrowDown className="ml-1.5 h-3.5 w-3.5 shrink-0" />;
  return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-40" />;
}

export function OccurrencesTable({
  occurrences,
  isOwner,
}: {
  occurrences: OccurrenceRow[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "startsAt", desc: false },
  ]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function handleCancel(occurrenceId: string) {
    setCancellingId(occurrenceId);
    const result = await cancelOccurrence(occurrenceId);
    if (result.success) {
      toast.success("Occurrence cancelled.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Couldn't cancel — try again?");
    }
    setCancellingId(null);
  }

  async function handleRestore(occurrenceId: string) {
    setRestoringId(occurrenceId);
    const result = await restoreOccurrence(occurrenceId);
    if (result.success) {
      toast.success("Occurrence restored.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Couldn't restore — try again?");
    }
    setRestoringId(null);
  }

  const columns: ColumnDef<OccurrenceRow>[] = [
    {
      id: "startsAt",
      accessorFn: (row) => row.startsAt,
      header: ({ column }) => (
        <button
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
        </button>
      ),
      cell: ({ row }) => {
        const dt = DateTime.fromISO(row.original.startsAt).toLocal();
        return (
          <div>
            <p className="font-medium">{dt.toFormat("EEE, MMM d, yyyy")}</p>
          </div>
        );
      },
      sortingFn: (a, b) =>
        new Date(a.original.startsAt).getTime() -
        new Date(b.original.startsAt).getTime(),
    },
    {
      id: "time",
      header: () => <span className="text-muted-foreground">Time</span>,
      cell: ({ row }) => {
        const start = DateTime.fromISO(row.original.startsAt).toLocal();
        const end = DateTime.fromISO(row.original.endsAt).toLocal();
        return (
          <span className="text-muted-foreground text-sm">
            {start.toFormat("h:mm a")}–{end.toFormat("h:mm a ZZZZ")}
          </span>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <button
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
        </button>
      ),
      cell: ({ row }) => (
        <Badge className={STATUS_CLASSES[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const occ = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/sessions/${occ.sessionId}/o/${occ.id}`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
            {isOwner && occ.status === "scheduled" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                disabled={cancellingId === occ.id}
                onClick={() => handleCancel(occ.id)}
              >
                {cancellingId === occ.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span className="sr-only">Cancel</span>
              </Button>
            )}
            {isOwner && occ.status === "cancelled" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                disabled={restoringId === occ.id}
                onClick={() => handleRestore(occ.id)}
              >
                {restoringId === occ.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                <span className="sr-only">Restore</span>
              </Button>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data: occurrences,
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
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent border-b">
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
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
