"use client";

import { useState } from "react";
import { Plus, Loader2, X, FileJson, CheckCircle2, AlertCircle } from "lucide-react";
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

interface KeyValuePair {
  key: string;
  value: string;
}

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
  const [initParams, setInitParams] = useState<KeyValuePair[]>([]);

  // MCP fields
  const [serverCommand, setServerCommand] = useState("npx");
  const [serverArgs, setServerArgs] = useState("");
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpHeaders, setMcpHeaders] = useState("{}");
  const [mcpEnv, setMcpEnv] = useState("{}");

  // Required env
  const [requiredEnv, setRequiredEnv] = useState("");

  // JSON import
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonImportValue, setJsonImportValue] = useState("");
  const [jsonImportError, setJsonImportError] = useState<string | null>(null);

  // Validation
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  const resetForm = () => {
    setToolName("");
    setToolDescription("");
    setToolType("built-in");
    setImportPath("");
    setInitParams([]);
    setServerCommand("npx");
    setServerArgs("");
    setMcpUrl("");
    setMcpHeaders("{}");
    setMcpEnv("{}");
    setRequiredEnv("");
    setValidationResult(null);
  };

  // Key-value pair helpers
  const addInitParam = () => {
    setInitParams([...initParams, { key: "", value: "" }]);
  };

  const removeInitParam = (index: number) => {
    setInitParams(initParams.filter((_, i) => i !== index));
  };

  const updateInitParam = (index: number, field: "key" | "value", value: string) => {
    const updated = [...initParams];
    updated[index][field] = value;
    setInitParams(updated);
  };

  const handleImportJson = () => {
    setJsonImportError(null);
    try {
      const parsed = JSON.parse(jsonImportValue);

      // Support multiple formats:
      // 1. Full mcp.json: { "mcpServers": { "name": {...} } }
      // 2. Single server: { "server-name": {...} }
      // 3. Server config only: { "command": "npx", "args": [...] } or { "url": "https://..." }

      let serverName: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let config: any;

      if (parsed.mcpServers) {
        const servers = Object.entries(parsed.mcpServers);
        if (servers.length === 0) {
          throw new Error("No servers found in mcpServers");
        }
        if (servers.length > 1) {
          throw new Error("Multiple servers found. Please import only one server at a time.");
        }
        [serverName, config] = servers[0] as [string, unknown];
      } else if (parsed.command || parsed.url) {
        // Direct config format: { "command": "npx", ... } or { "url": "https://..." }
        serverName = toolName || "imported_server";
        config = parsed;
      } else {
        // Single server format: { "server-name": {...} }
        const entries = Object.entries(parsed);
        if (entries.length === 0) {
          throw new Error("Invalid format: empty object");
        }
        if (entries.length > 1) {
          throw new Error("Multiple servers found. Please import only one server at a time.");
        }
        [serverName, config] = entries[0] as [string, unknown];
      }

      // Convert server name to valid tool name (lowercase, alphanumeric, underscore)
      const validToolName = serverName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/^[0-9]/, "_");
      if (!toolName) setToolName(validToolName);

      if (config.command) {
        // STDIO type
        setToolType("mcp-stdio");
        setServerCommand(config.command);
        setServerArgs((config.args || []).join("\n"));
        if (config.env) setMcpEnv(JSON.stringify(config.env, null, 2));
      } else if (config.url) {
        // HTTP type
        setToolType("mcp-http");
        setMcpUrl(config.url);
        if (config.headers) setMcpHeaders(JSON.stringify(config.headers, null, 2));
      } else {
        throw new Error("Invalid server config: must have either 'command' (stdio) or 'url' (http)");
      }

      setShowJsonImport(false);
      setJsonImportValue("");
    } catch (error) {
      setJsonImportError(error instanceof Error ? error.message : "Invalid JSON");
    }
  };

  const handleValidate = () => {
    setIsValidating(true);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!toolName.trim()) {
      errors.push("Tool name is required");
    } else if (!/^[a-z][a-z0-9_]*$/.test(toolName)) {
      errors.push(
        "Tool name must start with lowercase letter and contain only lowercase letters, numbers, and underscores"
      );
    }

    if (!toolDescription.trim()) {
      errors.push("Tool description is required");
    }

    // Type-specific validation
    if (toolType === "built-in" || toolType === "custom") {
      if (!importPath.trim()) {
        errors.push("Import path is required for built-in/custom tools");
      }
    }

    if (toolType === "mcp-stdio") {
      if (!serverCommand.trim()) {
        errors.push("Server command is required for MCP STDIO tools");
      }
      try {
        JSON.parse(mcpEnv);
      } catch {
        errors.push("Invalid JSON for MCP environment variables");
      }
    }

    if (toolType === "mcp-http") {
      if (!mcpUrl.trim()) {
        errors.push("URL is required for MCP HTTP tools");
      }
      try {
        JSON.parse(mcpHeaders);
      } catch {
        errors.push("Invalid JSON for MCP headers");
      }
    }

    // Warnings
    if (initParams.length === 0 && (toolType === "built-in" || toolType === "custom")) {
      warnings.push("No init params specified - tool will use default configuration");
    }

    if (!requiredEnv.trim()) {
      warnings.push("No required environment variables specified");
    }

    setValidationResult({
      valid: errors.length === 0,
      errors,
      warnings,
    });
    setIsValidating(false);
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
        // Convert key-value pairs to object
        const initParamsObj: Record<string, unknown> = {};
        for (const pair of initParams) {
          if (pair.key.trim()) {
            // Try to parse value as JSON for numbers, booleans, arrays, objects
            try {
              initParamsObj[pair.key] = JSON.parse(pair.value);
            } catch {
              // If not valid JSON, use as string
              initParamsObj[pair.key] = pair.value;
            }
          }
        }
        data.init_params = initParamsObj;
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
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 size-4" />
          Add Tool
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[1024px]">
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
            <div className="flex gap-2">
              <Select
                value={toolType}
                onValueChange={(v: string) => setToolType(v as ToolType)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="built-in">Built-in</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="mcp-stdio">MCP STDIO</SelectItem>
                  <SelectItem value="mcp-http">MCP HTTP</SelectItem>
                </SelectContent>
              </Select>
              {(toolType === "mcp-stdio" || toolType === "mcp-http") && (
                <Button
                  type="button"
                  onClick={() => setShowJsonImport(true)}
                  className="h-10 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  <FileJson className="mr-1 size-4" />
                  Import JSON
                </Button>
              )}
            </div>
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
                <label className="text-sm font-medium">Init Params</label>
                {initParams.map((pair, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Key"
                      value={pair.key}
                      onChange={(e) => updateInitParam(index, "key", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={pair.value}
                      onChange={(e) => updateInitParam(index, "value", e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeInitParam(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Values are parsed as JSON (numbers, booleans, arrays) or kept as strings
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addInitParam}
                  >
                    <Plus className="mr-1 size-4" /> Add Parameter
                  </Button>
                </div>
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
                  placeholder={`-y\n@anthropic/mcp-server-github`}
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
              placeholder={`TAVILY_API_KEY\nGITHUB_TOKEN`}
            />
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div
              className={`rounded-md border p-3 ${
                validationResult.valid
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                  : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
              }`}
            >
              {validationResult.valid ? (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="size-4" />
                  Validation passed!
                </div>
              ) : (
                <div className="space-y-1">
                  {validationResult.errors.map((err, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
                    >
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      {err}
                    </div>
                  ))}
                </div>
              )}
              {validationResult.warnings.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-yellow-200 pt-2 dark:border-yellow-800">
                  {validationResult.warnings.map((warn, i) => (
                    <p
                      key={i}
                      className="text-xs text-yellow-700 dark:text-yellow-400"
                    >
                      ⚠ {warn}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleValidate}
            disabled={isSubmitting || isValidating}
          >
            {isValidating ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-1 size-4" />
            )}
            Validate
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-1 size-4 animate-spin" />}
            Create Tool
          </Button>
        </DialogFooter>
      </DialogContent>

    </Dialog>

      {/* JSON Import Dialog */}
      <Dialog open={showJsonImport} onOpenChange={setShowJsonImport}>
        <DialogContent className="sm:max-w-[845px] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Import MCP Configuration</DialogTitle>
            <DialogDescription>
              Paste MCP JSON configuration to auto-fill the form. Supports
              mcp.json format or single server config.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-md border">
              <Textarea
                value={jsonImportValue}
                onChange={(e) => {
                  setJsonImportValue(e.target.value);
                  setJsonImportError(null);
                }}
                rows={20}
                className="font-mono text-sm border-0 focus-visible:ring-0 shadow-none resize-none [field-sizing:fixed] break-all"
                placeholder={`{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@package/name"]
    }
  }
}`}
              />
            </div>
            {jsonImportError && (
              <p className="text-sm text-red-500">{jsonImportError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowJsonImport(false);
                setJsonImportValue("");
                setJsonImportError(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleImportJson}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
