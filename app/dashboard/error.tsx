"use client";

import { Button, EmptyState } from "@/components/dashboard/ui";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <EmptyState message="This page hit an error.">
      <Button variant="secondary" onClick={reset}>
        Try again
      </Button>
    </EmptyState>
  );
}
