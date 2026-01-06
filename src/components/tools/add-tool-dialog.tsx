"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ToolCreateRequest, ToolType } from "@/lib/types/agent-builder";

interface AddToolDialogProps {
  onAdd: (data: ToolCreateRequest) => Promise<void>;
}

export function AddToolDialog({ onAdd }: AddToolDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolType, setToolType] = useState<ToolType>("built-in");

  // Built-in / Custom fields
  const [importPath, setImportPath] = useState("");
  const [initParams, setInitParams] = useState("{}");

  // MCP fields
  const [serverCommand, setServerCommand] = useState("npx");
  const [serverArgs, setServerArgs] = useState("");
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpHeaders, setMcpHeaders] = useState("{}");
  const [mcpEnv, setMcpEnv] = useState("{}");

  // Required env
  const [requiredEnv, setRequiredEnv] = useState("");

  const resetForm = () => {
    setToolName("");
    setToolDescription("");
    setToolType("built-in");
    setImportPath("");
    setInitParams("{}");
    setServerCommand("npx");
    setServerArgs("");
    setMcpUrl("");
    setMcpHeaders("{}");
    setMcpEnv("{}");
    setRequiredEnv("");
  };

  const handleSubmit = async () => {
    // Validation
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
    if (!toolDescription.trim()) {
      alert("Tool description is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const data: ToolCreateRequest = {
        tool_name: toolName,
        tool_description: toolDescription,
        tool_type: toolType,
      };

      // Type-specific fields
      if (toolType === "built-in" || toolType === "custom") {
        if (!importPath.trim()) {
          alert("Import path is required for built-in/custom tools");
          setIsSubmitting(false);
          return;
        }
        data.import_path = importPath;
        try {
          data.init_params = JSON.parse(initParams);
        } catch {
          alert("Invalid JSON for init_params");
          setIsSubmitting(false);
          return;
        }
      }

      if (toolType === "mcp-stdio") {
        if (!serverCommand.trim()) {
          alert("Server command is required for MCP STDIO tools");
          setIsSubmitting(false);
          return;
        }
        try {
          data.mcp_config = {
            server_command: serverCommand,
            server_args: serverArgs
              ? serverArgs.split("\n").filter(Boolean)
              : [],
            transport: "stdio",
            env: JSON.parse(mcpEnv || "{}"),
          };
        } catch {
          alert("Invalid JSON for MCP environment variables");
          setIsSubmitting(false);
          return;
        }
      }

      if (toolType === "mcp-http") {
        if (!mcpUrl.trim()) {
          alert("URL is required for MCP HTTP tools");
          setIsSubmitting(false);
          return;
        }
        try {
          data.mcp_config = {
            url: mcpUrl,
            headers: JSON.parse(mcpHeaders || "{}"),
            transport: "http",
          };
        } catch {
          alert("Invalid JSON for MCP headers");
          setIsSubmitting(false);
          return;
        }
      }

      if (requiredEnv.trim()) {
        data.required_env = requiredEnv
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      await onAdd(data);
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Failed to create tool:", error);
      alert(error instanceof Error ? error.message : "Failed to create tool");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 size-4" />
          Add Tool
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Tool</DialogTitle>
          <DialogDescription>
            Create a new tool configuration. Fill in the required fields based
            on the tool type.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tool Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tool Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              placeholder="my_tool_name"
            />
            <p className="text-xs text-gray-500">
              Lowercase letters, numbers, and underscores only
            </p>
          </div>

          {/* Tool Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tool Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={toolType}
              onValueChange={(v: string) => setToolType(v as ToolType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="built-in">Built-in</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="mcp-stdio">MCP STDIO</SelectItem>
                <SelectItem value="mcp-http">MCP HTTP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tool Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={toolDescription}
              onChange={(e) => setToolDescription(e.target.value)}
              placeholder="Describe what this tool does..."
              rows={2}
            />
          </div>

          {/* Built-in / Custom fields */}
          {(toolType === "built-in" || toolType === "custom") && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Import Path <span className="text-red-500">*</span>
                </label>
                <Input
                  value={importPath}
                  onChange={(e) => setImportPath(e.target.value)}
                  placeholder="langchain_tavily.TavilySearch"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Init Params (JSON)</label>
                <Textarea
                  value={initParams}
                  onChange={(e) => setInitParams(e.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                  placeholder='{"max_results": 5}'
                />
              </div>
            </>
          )}

          {/* MCP STDIO fields */}
          {toolType === "mcp-stdio" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Server Command <span className="text-red-500">*</span>
                </label>
                <Input
                  value={serverCommand}
                  onChange={(e) => setServerCommand(e.target.value)}
                  placeholder="npx"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Server Args (one per line)
                </label>
                <Textarea
                  value={serverArgs}
                  onChange={(e) => setServerArgs(e.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                  placeholder="-y&#10;@anthropic/mcp-server-github"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Environment Variables (JSON)
                </label>
                <Textarea
                  value={mcpEnv}
                  onChange={(e) => setMcpEnv(e.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                  placeholder='{"GITHUB_TOKEN": "${GITHUB_TOKEN}"}'
                />
              </div>
            </>
          )}

          {/* MCP HTTP fields */}
          {toolType === "mcp-http" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  URL <span className="text-red-500">*</span>
                </label>
                <Input
                  value={mcpUrl}
                  onChange={(e) => setMcpUrl(e.target.value)}
                  placeholder="https://example.com/mcp"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Headers (JSON)</label>
                <Textarea
                  value={mcpHeaders}
                  onChange={(e) => setMcpHeaders(e.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                  placeholder='{"Authorization": "Bearer token"}'
                />
              </div>
            </>
          )}

          {/* Required Env */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Required Environment Variables (one per line)
            </label>
            <Textarea
              value={requiredEnv}
              onChange={(e) => setRequiredEnv(e.target.value)}
              rows={2}
              placeholder="TAVILY_API_KEY&#10;GITHUB_TOKEN"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-1 size-4 animate-spin" />}
            Create Tool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
