"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentCreate } from "@/providers/AgentCreate";
import { useAgents } from "@/providers/Agent";

export function CreateHeader() {
  const router = useRouter();
  const { config, isCreating, updateField, create, reset } = useAgentCreate();
  const { refetchAgents } = useAgents();

  const handleCreate = async () => {
    const agentId = await create();
    if (agentId) {
      await refetchAgents();
      router.push(`/agent/${agentId}`);
    }
  };

  const canCreate = config.agent_name.trim().length > 0;

  return (
    <div className="flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
      {/* Left side: Back button + Agent info (w-1/2 to match Instructions panel) */}
      <div className="flex w-1/2 items-center gap-4">
        <Link href="/" className="shrink-0">
          <Button variant="outline" size="icon" className="size-9">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <input
            name="agent_name"
            value={config.agent_name}
            onChange={(e) => updateField("agent_name", e.target.value)}
            placeholder="Agent name..."
            className="w-full truncate border border-transparent bg-transparent px-1 text-base font-medium leading-snug tracking-tight text-gray-900 outline-none transition-all hover:border-gray-300 focus:border-blue-500 dark:text-gray-50 dark:hover:border-gray-600 dark:focus:border-blue-400"
          />
          <input
            name="description"
            value={config.agent_description}
            onChange={(e) => updateField("agent_description", e.target.value)}
            placeholder="Agent description..."
            className="w-full truncate border border-transparent bg-transparent px-1 text-sm leading-snug tracking-tight text-gray-500 outline-none transition-all placeholder:text-gray-300 hover:border-gray-300 focus:border-blue-500 dark:text-gray-400 dark:placeholder:text-gray-600 dark:hover:border-gray-600 dark:focus:border-blue-400"
          />
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex flex-1 items-center justify-end gap-2">
        <span className="inline-flex items-center rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-white dark:text-gray-900">
          Creating
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={reset}
          disabled={isCreating}
          title="Reset all fields"
        >
          <RotateCcw className="size-4" />
        </Button>

        <Button
          onClick={handleCreate}
          disabled={!canCreate || isCreating}
          className="gap-2 bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 dark:disabled:bg-gray-700"
        >
          {isCreating && <Loader2 className="size-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
