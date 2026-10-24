"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  Building2,
  CalendarDays,
  CalendarX2,
  Pencil,
  Plus,
  SquarePen,
  Trash,
  Users,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import {
  ApiError,
  getDashboard,
  type DashboardData,
  type DashboardLeaveEntry,
} from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { AccessDenied } from "@/components/access-denied";
import { tintStyle } from "@/lib/color";

function ChartFallback() {
  return <Skeleton className="h-[280px] w-full rounded-xl" />;
}
const activityDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateKeyFormatters = new Map<string, Intl.DateTimeFormat>();

function formatDateKey(
  value: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return value;

  const key = JSON.stringify(options);
  let formatter = dateKeyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", options);
    dateKeyFormatters.set(key, formatter);
  }
  return formatter.format(date);
}

function formatDateRange(startDate: string, endDate: string) {
  return startDate === endDate
    ? formatDateKey(startDate)
    : `${formatDateKey(startDate)} – ${formatDateKey(endDate)}`;
}

const activityVisuals = {
  CREATE: {
    icon: Pencil,
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  },
  UPDATE: {
    icon: SquarePen,
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  },
  DELETE: {
    icon: Trash,
    className: "bg-red-500/15 text-red-600 dark:text-red-300",
  },
} satisfies Record<
  "CREATE" | "UPDATE" | "DELETE",
  { icon: typeof Pencil; className: string }
>;

export default function DashboardPage() {
  const { can, loading: authLoading } = useAuth();
  const dashboardQuery = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    enabled: !authLoading && can("dashboard.read"),
  });

  if (authLoading) return null;
  if (!can("dashboard.read")) {
    return <AccessDenied />;
  }

  const error =
    dashboardQuery.error instanceof ApiError
      ? dashboardQuery.error.message
      : dashboardQuery.error
        ? "Unable to load dashboard data."
        : "";

  if (error) {
    return (
      <main className="mx-auto w-full max-w-[1600px] p-5 md:p-8">
        <Card>
          <CardContent className="p-6">
            <p className="font-medium">Unable to load dashboard</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }
  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome Back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your organization today.
          </p>
        </div>
      </section>
    </main>
  );
}