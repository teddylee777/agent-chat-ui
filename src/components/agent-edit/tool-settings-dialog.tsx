"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  getAgentToolConfig,
  updateAgentToolConfig,
  validateAgentToolConfig,
} from "@/lib/api/agent-builder";
import type { AgentToolConfigResponse } from "@/lib/types/agent-builder";
import { toast } from "sonner";

interface ToolSettingsDialogProps {
  agentId: string;
  toolName: string;
}

export function ToolSettingsDialog({ agentId, toolName }: ToolSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [configData, setConfigData] = useState<AgentToolConfigResponse | null>(null);
  const [editedOverride, setEditedOverride] = useState<Record<string, unknown>>({});
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"form" | "json">("form");

  // Load config when dialog opens
  useEffect(() => {
    async function loadConfig() {
      if (!isOpen) return;

      setIsLoading(true);
      setValidationErrors([]);
      setValidationWarnings([]);
      setJsonError(null);

      try {
        const data = await getAgentToolConfig(agentId, toolName);
        setConfigData(data);
        setEditedOverride(data.config_override || {});
        setJsonText(JSON.stringify(data.config_override || {}, null, 2));
      } catch (err) {
        toast.error("Failed to load tool config");
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
  }, [isOpen, agentId, toolName]);

  // Sync form data to JSON text when viewMode changes to JSON
  const handleViewModeChange = useCallback((mode: string) => {
    if (mode === "json") {
      setJsonText(JSON.stringify(editedOverride, null, 2));
    } else if (mode === "form") {
      try {
        const parsed = JSON.parse(jsonText);
        setEditedOverride(parsed);
        setJsonError(null);
      } catch {
        // Keep the form data as-is if JSON is invalid
      }
    }
    setViewMode(mode as "form" | "json");
  }, [editedOverride, jsonText]);

  // Handle JSON text change
  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      JSON.parse(text);
      setJsonError(null);
    } catch (e) {
      setJsonError("Invalid JSON format");
    }
  };

  // Handle form field change
  const handleFieldChange = (key: string, value: unknown) => {
    setEditedOverride((prev) => {
      if (value === "" || value === undefined) {
        // Remove key if empty
        const newOverride = { ...prev };
        delete newOverride[key];
        return newOverride;
      }
      return { ...prev, [key]: value };
    });
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    setValidationErrors([]);
    setValidationWarnings([]);

    try {
      // Parse JSON if in JSON mode
      let finalOverride = editedOverride;
      if (viewMode === "json") {
        try {
          finalOverride = JSON.parse(jsonText);
        } catch {
          setJsonError("Invalid JSON format");
          setIsSaving(false);
          return;
        }
      }

      // Validate first
      const validationResult = await validateAgentToolConfig(
        agentId,
        toolName,
        finalOverride
      );

      if (!validationResult.valid) {
        setValidationErrors(validationResult.errors);
        setValidationWarnings(validationResult.warnings);
        setIsSaving(false);
        return;
      }

      // Show warnings if any
      if (validationResult.warnings.length > 0) {
        setValidationWarnings(validationResult.warnings);
      }

      // Save
      await updateAgentToolConfig(agentId, toolName, finalOverride);
      toast.success("Tool settings saved successfully");
      setIsOpen(false);
    } catch (err) {
      toast.error("Failed to save tool settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Render form field based on value type
  const renderFormField = (key: string, baseValue: unknown, overrideValue: unknown) => {
    const value = overrideValue !== undefined ? overrideValue : "";
    const placeholder = baseValue !== undefined ? String(baseValue) : "";

    // For complex types (array, object), render as JSON input
    if (
      typeof baseValue === "object" &&
      baseValue !== null &&
      !Array.isArray(baseValue)
    ) {
      return (
        <Textarea
          value={
            typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)
          }
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              handleFieldChange(key, parsed);
            } catch {
              // Allow invalid JSON while typing
              handleFieldChange(key, e.target.value);
            }
          }}
          placeholder={JSON.stringify(baseValue, null, 2)}
          className="font-mono text-xs"
          rows={3}
        />
      );
    }

    // Boolean type
    if (typeof baseValue === "boolean") {
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={value === true || value === "true"}
            onCheckedChange={(checked) => handleFieldChange(key, checked)}
          />
          <span className="text-xs text-gray-500">
            (default: {String(baseValue)})
          </span>
        </div>
      );
    }

    // Number type
    if (typeof baseValue === "number") {
      return (
        <Input
          type="number"
          value={value === "" ? "" : Number(value)}
          onChange={(e) =>
            handleFieldChange(
              key,
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
          placeholder={placeholder}
          className="font-mono"
        />
      );
    }

    // Default: string type
    return (
      <Input
        value={String(value)}
        onChange={(e) => handleFieldChange(key, e.target.value)}
        placeholder={placeholder}
        className="font-mono"
      />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-gray-400 hover:text-blue-500"
          title="Tool Settings"
        >
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tool Settings: {toolName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-gray-400" />
          </div>
        ) : configData ? (
          <div className="space-y-4">
            {/* Base Config (Read-only) */}
            <div>
              <Label className="text-xs text-gray-500">
                Base Config (Global Default)
              </Label>
              <pre className="mt-1 max-h-24 overflow-auto rounded-md bg-gray-100 p-2 text-xs dark:bg-gray-800">
                {Object.keys(configData.base_config).length > 0
                  ? JSON.stringify(configData.base_config, null, 2)
                  : "(no base config)"}
              </pre>
            </div>

            {/* View Mode Toggle */}
            <Tabs value={viewMode} onValueChange={handleViewModeChange}>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-500">Agent Override</Label>
                <TabsList className="h-7">
                  <TabsTrigger value="form" className="px-2 text-xs">
                    Form
                  </TabsTrigger>
                  <TabsTrigger value="json" className="px-2 text-xs">
                    JSON
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Form View */}
              <TabsContent value="form" className="mt-2 space-y-3">
                {Object.keys(configData.base_config).length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No configurable parameters available. Use JSON mode to add
                    custom overrides.
                  </p>
                ) : (
                  Object.entries(configData.base_config).map(([key, baseValue]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-sm font-medium">{key}</Label>
                      {renderFormField(key, baseValue, editedOverride[key])}
                    </div>
                  ))
                )}
              </TabsContent>

              {/* JSON View */}
              <TabsContent value="json" className="mt-2">
                <Textarea
                  value={jsonText}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className="font-mono text-xs"
                  rows={8}
                  placeholder='{"key": "value"}'
                />
                {jsonError && (
                  <p className="mt-1 text-xs text-red-500">{jsonError}</p>
                )}
              </TabsContent>
            </Tabs>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="size-4" />
                  <span className="text-sm font-medium">Validation Errors</span>
                </div>
                <ul className="mt-1 list-inside list-disc text-xs text-red-600 dark:text-red-400">
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Validation Warnings */}
            {validationWarnings.length > 0 && (
              <div className="rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="size-4" />
                  <span className="text-sm font-medium">Warnings</span>
                </div>
                <ul className="mt-1 list-inside list-disc text-xs text-yellow-600 dark:text-yellow-400">
                  {validationWarnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Help Text */}
            <p className="text-xs text-gray-500">
              Override values are merged with base config. Leave empty to use
              default values.
            </p>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || jsonError !== null}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
