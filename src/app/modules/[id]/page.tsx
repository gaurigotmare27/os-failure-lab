import React from "react";
import { ModuleView } from "./ModuleView";

export function generateStaticParams() {
  return [
    { id: "race-condition" },
    { id: "deadlock-detection" },
    { id: "process-synchronization" },
    { id: "thread-monitoring" },
  ];
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ModulePage({ params }: PageProps) {
  const { id } = await params;
  return <ModuleView moduleId={id} />;
}
