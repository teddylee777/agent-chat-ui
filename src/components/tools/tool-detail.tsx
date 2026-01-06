"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Loader2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToolTypeBadge } from "./tool-type-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ToolInfo, ToolUpdateRequest } from "@/lib/types/agent-builder";

interface ToolDetailProps {
  tool: ToolInfo | null;
  isLoading?: boolean;
  onSave: (toolName: string, data: ToolUpdateRequest) => Promise<void>;
  onDelete: (toolName: string) => Promise<void>;
}

export function ToolDetail({
  tool,
  isLoading,
  onSave,
  onDelete,
}: ToolDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [toolName, setToolName] = useState("");
  const [description, setDescription] = useState("");
  const [importPath, setImportPath] = useState("");
  const [initParams, setInitParams] = useState("");
  const [requiredEnv, setRequiredEnv] = useState("");
  // MCP config
  const [serverCommand, setServerCommand] = useState("");
  const [serverArgs, setServerArgs] = useState("");
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpHeaders, setMcpHeaders] = useState("");
  const [mcpEnv, setMcpEnv] = useState("");

  // Reset form when tool changes
  useEffect(() => {
    if (tool) {
      setToolName(tool.tool_name);
      setDescription(tool.tool_description);
      setImportPath(tool.import_path || "");
      setInitParams(
        tool.init_params ? JSON.stringify(tool.init_params, null, 2) : "{}"
      );
      setRequiredEnv(tool.required_env?.join("\n") || "");
      // MCP config
      if (tool.mcp_config) {
        setServerCommand(tool.mcp_config.server_command || "");
        setServerArgs(tool.mcp_config.server_args?.join("\n") || "");
        setMcpUrl(tool.mcp_config.url || "");
        setMcpHeaders(
          tool.mcp_config.headers
            ? JSON.stringify(tool.mcp_config.headers, null, 2)
            : "{}"
        );
        setMcpEnv(
          tool.mcp_config.env
            ? JSON.stringify(tool.mcp_config.env, null, 2)
            : "{}"
        );
      }
      setIsEditing(false);
    }
  }, [tool]);

  const handleSave = async () => {
    if (!tool) return;

    // Validate tool name if changed
    if (toolName !== tool.tool_name) {
      if (!toolName.trim()) {
        alert("Tool name is required");
        return;
      }
      if (!/^[a-z][a-z0-9_]*$/.test(toolName)) {
        alert(
          "Tool name must start with lowercase letter and contain only lowercase letters, numbers, and underscores"
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      const updateData: ToolUpdateRequest = {
        tool_description: description,
      };

      // Include new_tool_name if changed
      if (toolName !== tool.tool_name) {
        updateData.new_tool_name = toolName;
      }

      if (tool.tool_type === "built-in" || tool.tool_type === "custom") {
        updateData.import_path = importPath;
        try {
          updateData.init_params = JSON.parse(initParams);
        } catch {
          alert("Invalid JSON for init_params");
          setIsSaving(false);
          return;
        }
      }

      if (
        tool.tool_type === "mcp-stdio" ||
        tool.tool_type === "mcp-http"
      ) {
        try {
          updateData.mcp_config = {
            server_command: serverCommand || undefined,
            server_args: serverArgs
              ? serverArgs.split("\n").filter(Boolean)
              : [],
            url: mcpUrl || undefined,
            headers: JSON.parse(mcpHeaders || "{}"),
            transport: tool.tool_type === "mcp-stdio" ? "stdio" : "http",
            env: JSON.parse(mcpEnv || "{}"),
          };
        } catch {
          alert("Invalid JSON for MCP config");
          setIsSaving(false);
          return;
        }
      }

      if (requiredEnv.trim()) {
        updateData.required_env = requiredEnv
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      await onSave(tool.tool_name, updateData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save tool:", error);
      alert(error instanceof Error ? error.message : "Failed to save tool");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tool) return;

    setIsDeleting(true);
    try {
      await onDelete(tool.tool_name);
    } catch (error) {
      console.error("Failed to delete tool:", error);
      alert(error instanceof Error ? error.message : "Failed to delete tool");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-500">
        <p className="text-lg font-medium">No tool selected</p>
        <p className="text-sm">Select a tool from the list to view details</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="min-w-0 flex-1 pr-4">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <Input
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                className="h-8 max-w-[250px] font-mono text-lg font-semibold"
                placeholder="tool_name"
              />
            ) : (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {tool.tool_name}
              </h2>
            )}
            <ToolTypeBadge type={tool.tool_type} />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {tool.tool_path}
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <X className="mr-1 size-4" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : (
                  <Save className="mr-1 size-4" />
                )}
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="mr-1 size-4" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    {isDeleting ? (
                      <Loader2 className="mr-1 size-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-1 size-4" />
                    )}
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Tool</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{tool.tool_name}
                      &quot;? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            {isEditing ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            ) : (
              <p className="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800">
                {tool.tool_description}
              </p>
            )}
          </div>

          {/* Built-in / Custom fields */}
          {(tool.tool_type === "built-in" || tool.tool_type === "custom") && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Import Path
                </label>
                {isEditing ? (
                  <Input
                    value={importPath}
                    onChange={(e) => setImportPath(e.target.value)}
                    placeholder="e.g., langchain_tavily.TavilySearch"
                  />
                ) : (
                  <p className="rounded-md bg-gray-50 p-3 font-mono text-sm dark:bg-gray-800">
                    {tool.import_path || "-"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Init Params (JSON)
                </label>
                {isEditing ? (
                  <Textarea
                    value={initParams}
                    onChange={(e) => setInitParams(e.target.value)}
                    rows={5}
                    className="font-mono text-sm"
                  />
                ) : (
                  <pre className="overflow-auto rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800">
                    {JSON.stringify(tool.init_params, null, 2)}
                  </pre>
                )}
              </div>
            </>
          )}

          {/* MCP STDIO fields */}
          {tool.tool_type === "mcp-stdio" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Server Command
                </label>
                {isEditing ? (
                  <Input
                    value={serverCommand}
                    onChange={(e) => setServerCommand(e.target.value)}
                    placeholder="e.g., npx"
                  />
                ) : (
                  <p className="rounded-md bg-gray-50 p-3 font-mono text-sm dark:bg-gray-800">
                    {tool.mcp_config?.server_command || "-"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Server Args (one per line)
                </label>
                {isEditing ? (
                  <Textarea
                    value={serverArgs}
                    onChange={(e) => setServerArgs(e.target.value)}
                    rows={4}
                    className="font-mono text-sm"
                    placeholder="-y&#10;@anthropic/mcp-server-github"
                  />
                ) : (
                  <pre className="overflow-auto rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800">
                    {tool.mcp_config?.server_args?.join("\n") || "-"}
                  </pre>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Environment Variables (JSON)
                </label>
                {isEditing ? (
                  <Textarea
                    value={mcpEnv}
                    onChange={(e) => setMcpEnv(e.target.value)}
                    rows={4}
                    className="font-mono text-sm"
                  />
                ) : (
                  <pre className="overflow-auto rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800">
                    {JSON.stringify(tool.mcp_config?.env || {}, null, 2)}
                  </pre>
                )}
              </div>
            </>
          )}

          {/* MCP HTTP fields */}
          {tool.tool_type === "mcp-http" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  URL
                </label>
                {isEditing ? (
                  <Input
                    value={mcpUrl}
                    onChange={(e) => setMcpUrl(e.target.value)}
                    placeholder="https://example.com/mcp"
                  />
                ) : (
                  <div className="overflow-x-auto rounded-md bg-gray-50 p-3 font-mono text-sm dark:bg-gray-800">
                    <span className="whitespace-nowrap">{tool.mcp_config?.url || "-"}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Headers (JSON)
                </label>
                {isEditing ? (
                  <Textarea
                    value={mcpHeaders}
                    onChange={(e) => setMcpHeaders(e.target.value)}
                    rows={4}
                    className="font-mono text-sm"
                  />
                ) : (
                  <pre className="overflow-auto rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800">
                    {JSON.stringify(tool.mcp_config?.headers || {}, null, 2)}
                  </pre>
                )}
              </div>
            </>
          )}

          {/* Required Environment Variables */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Required Environment Variables (one per line)
            </label>
            {isEditing ? (
              <Textarea
                value={requiredEnv}
                onChange={(e) => setRequiredEnv(e.target.value)}
                rows={3}
                placeholder="TAVILY_API_KEY&#10;GITHUB_TOKEN"
              />
            ) : (
              <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
                {tool.required_env && tool.required_env.length > 0 ? (
                  <ul className="list-inside list-disc text-sm">
                    {tool.required_env.map((env) => (
                      <li key={env} className="font-mono">
                        {env}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">None</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
