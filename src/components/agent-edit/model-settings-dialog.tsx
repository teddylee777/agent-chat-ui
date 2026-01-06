"use client";

import { useState, useEffect } from "react";
import { Settings, Loader2, AlertCircle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAgentModelConfig,
  updateAgentModelConfig,
} from "@/lib/api/agent-builder";
import type { ModelConfigResponse, ModelConfigUpdate } from "@/lib/types/agent-builder";
import { toast } from "sonner";

interface ModelSettingsDialogProps {
  agentId: string;
  onSave?: () => void;
}

// Validation: model_name must contain ":"
function validateModelName(modelName: string): string | null {
  if (!modelName || !modelName.trim()) {
    return "Model name is required";
  }
  if (!modelName.includes(":")) {
    return "Invalid format. Expected 'provider:model' (e.g., anthropic:claude-sonnet-4-5)";
  }
  return null;
}

export function ModelSettingsDialog({ agentId, onSave }: ModelSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [configData, setConfigData] = useState<ModelConfigResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "custom">("general");

  // Form state
  const [modelName, setModelName] = useState("");
  const [temperature, setTemperature] = useState<string>("");
  const [maxTokens, setMaxTokens] = useState<string>("");
  const [topP, setTopP] = useState<string>("");
  const [topK, setTopK] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");

  // Validation error
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load config when dialog opens
  useEffect(() => {
    async function loadConfig() {
      if (!isOpen) return;

      setIsLoading(true);
      setValidationError(null);

      try {
        const data = await getAgentModelConfig(agentId);
        setConfigData(data);

        // Initialize form values
        setModelName(data.model_name || "");
        setTemperature(data.temperature?.toString() || "0.1");
        setMaxTokens(data.max_tokens?.toString() || "");
        setTopP(data.top_p?.toString() || "");
        setTopK(data.top_k?.toString() || "");
        setApiKey(data.api_key || "");
        setBaseUrl(data.base_url || "");
      } catch (err) {
        toast.error("Failed to load model config");
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
  }, [isOpen, agentId]);

  // Handle model name change with validation
  const handleModelNameChange = (value: string) => {
    setModelName(value);
    setValidationError(null);
  };

  // Handle save
  const handleSave = async () => {
    // Validate model name
    const error = validateModelName(modelName);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsSaving(true);

    try {
      const update: ModelConfigUpdate = {
        model_name: modelName,
      };

      // Only include custom tab fields if in custom mode or if values are set
      if (activeTab === "custom") {
        if (temperature) {
          update.temperature = parseFloat(temperature);
        }
        if (maxTokens) {
          update.max_tokens = parseInt(maxTokens, 10);
        }
        if (topP) {
          update.top_p = parseFloat(topP);
        }
        if (topK) {
          update.top_k = parseInt(topK, 10);
        }
        if (apiKey) {
          update.api_key = apiKey;
        }
        if (baseUrl) {
          update.base_url = baseUrl;
        }
      }

      await updateAgentModelConfig(agentId, update);
      toast.success("Model settings saved successfully");
      setIsOpen(false);
      onSave?.();
    } catch (err) {
      toast.error("Failed to save model settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-gray-400 hover:text-blue-500"
          title="Model Settings"
        >
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Model Settings</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-gray-400" />
          </div>
        ) : configData ? (
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "general" | "custom")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-name-general">Model Name</Label>
                  <Input
                    id="model-name-general"
                    value={modelName}
                    onChange={(e) => handleModelNameChange(e.target.value)}
                    placeholder="anthropic:claude-sonnet-4-5"
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">
                    Format: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">provider:model</code>
                  </p>
                  <p className="text-xs text-gray-500">
                    Example: anthropic:claude-sonnet-4-5
                  </p>
                </div>
              </TabsContent>

              {/* Custom Tab */}
              <TabsContent value="custom" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-name-custom">Model Name *</Label>
                  <Input
                    id="model-name-custom"
                    value={modelName}
                    onChange={(e) => handleModelNameChange(e.target.value)}
                    placeholder="anthropic:claude-sonnet-4-5"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="0.1"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-tokens">Max Tokens</Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    min="1"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                    placeholder="(optional)"
                    className="font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="top-p">Top P</Label>
                    <Input
                      id="top-p"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={topP}
                      onChange={(e) => setTopP(e.target.value)}
                      placeholder="(optional)"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="top-k">Top K</Label>
                    <Input
                      id="top-k"
                      type="number"
                      min="1"
                      value={topK}
                      onChange={(e) => setTopK(e.target.value)}
                      placeholder="(optional)"
                      className="font-mono"
                    />
                  </div>
                </div>

                {/* Custom Provider Settings */}
                <div className="border-t pt-4">
                  <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Custom Provider Settings
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key</Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="(for custom provider)"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="base-url">Base URL</Label>
                      <Input
                        id="base-url"
                        type="url"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="https://api.example.com/v1"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Validation Error */}
            {validationError && (
              <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="size-4" />
                  <span className="text-sm">{validationError}</span>
                </div>
              </div>
            )}

            {/* Source Info */}
            <p className="text-xs text-gray-500">
              Current config source: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">{configData.source}</code>
            </p>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
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
