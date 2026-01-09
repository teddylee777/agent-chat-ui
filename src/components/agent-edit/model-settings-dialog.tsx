"use client";

import { useState, useEffect } from "react";
import { Settings, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAgentModelConfig,
  updateAgentModelConfig,
  getModels,
} from "@/lib/api/agent-builder";
import type { ModelConfigResponse, ModelConfigUpdate, ModelDefinitionSummary } from "@/lib/types/agent-builder";
import { toast } from "sonner";

interface ModelSettingsDialogProps {
  agentId: string;
  onSave?: () => void;
}

export function ModelSettingsDialog({ agentId, onSave }: ModelSettingsDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [configData, setConfigData] = useState<ModelConfigResponse | null>(null);

  // Available models from API
  const [availableModels, setAvailableModels] = useState<ModelDefinitionSummary[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Form state
  const [modelName, setModelName] = useState("");

  // Validation error
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load config and available models when dialog opens
  useEffect(() => {
    async function loadData() {
      if (!isOpen) return;

      setIsLoading(true);
      setIsLoadingModels(true);
      setValidationError(null);

      try {
        // Load available models and current config in parallel
        const [modelsResponse, configResponse] = await Promise.all([
          getModels(),
          getAgentModelConfig(agentId),
        ]);

        setAvailableModels(modelsResponse.models);
        setConfigData(configResponse);

        // Initialize form values
        setModelName(configResponse.model_name || "");
      } catch (err) {
        toast.error("Failed to load model settings");
        setIsOpen(false);
      } finally {
        setIsLoading(false);
        setIsLoadingModels(false);
      }
    }

    loadData();
  }, [isOpen, agentId]);

  // Handle model selection from dropdown
  const handleModelSelect = (value: string) => {
    setModelName(value);
    setValidationError(null);
  };

  // Handle save
  const handleSave = async () => {
    // Validate model name
    if (!modelName || !modelName.trim()) {
      setValidationError("Please select a model");
      return;
    }

    setIsSaving(true);

    try {
      const update: ModelConfigUpdate = {
        model_name: modelName,
      };

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

  // Navigate to Models page
  const handleManageModels = () => {
    setIsOpen(false);
    router.push("/models");
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
            {/* Model Selector */}
            <div className="space-y-2">
              <Label htmlFor="model-select">Select Model</Label>
              {isLoadingModels ? (
                <div className="flex h-10 items-center justify-center rounded-md border">
                  <Loader2 className="size-4 animate-spin text-gray-400" />
                </div>
              ) : (
                <Select value={modelName} onValueChange={handleModelSelect}>
                  <SelectTrigger className="font-mono">
                    <SelectValue placeholder="Select a model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem
                        key={model.model_id}
                        value={model.model_name}
                        className="font-mono"
                      >
                        {model.model_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {availableModels.length === 0 && !isLoadingModels && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  No models available. Add models in the Models settings page.
                </p>
              )}
            </div>

            {/* Manage Models Link */}
            <div className="pt-2">
              <Button
                variant="link"
                className="h-auto p-0 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                onClick={handleManageModels}
              >
                <ExternalLink className="mr-1 size-3" />
                Manage Models
              </Button>
              <p className="mt-1 text-xs text-gray-500">
                Add or edit model definitions in the Models settings page
              </p>
            </div>

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
