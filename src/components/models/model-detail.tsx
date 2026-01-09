"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ModelProviderBadge } from "./model-provider-badge";
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
import type { ModelDefinitionInfo, ModelDefinitionUpdateRequest } from "@/lib/types/agent-builder";

interface ModelDetailProps {
  model: ModelDefinitionInfo | null;
  isLoading?: boolean;
  onSave: (modelId: string, data: ModelDefinitionUpdateRequest) => Promise<void>;
  onDelete: (modelId: string) => Promise<void>;
}

export function ModelDetail({
  model,
  isLoading,
  onSave,
  onDelete,
}: ModelDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [description, setDescription] = useState("");
  const [temperature, setTemperature] = useState("");
  const [maxTokens, setMaxTokens] = useState("");
  const [topP, setTopP] = useState("");
  const [topK, setTopK] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKeyEnv, setApiKeyEnv] = useState("");
  const [requiredEnv, setRequiredEnv] = useState("");
  const [capabilities, setCapabilities] = useState("");
  const [tags, setTags] = useState("");

  // Reset form when model changes
  useEffect(() => {
    if (model) {
      setDescription(model.model_description);
      setTemperature(model.default_config?.temperature?.toString() || "");
      setMaxTokens(model.default_config?.max_tokens?.toString() || "");
      setTopP(model.default_config?.top_p?.toString() || "");
      setTopK(model.default_config?.top_k?.toString() || "");
      setBaseUrl(model.custom_config?.base_url || "");
      setApiKeyEnv(model.custom_config?.api_key_env || "");
      setRequiredEnv(model.required_env?.join("\n") || "");
      setCapabilities(model.capabilities?.join("\n") || "");
      setTags(model.tags?.join("\n") || "");
      setIsEditing(false);
    }
  }, [model]);

  const handleSave = async () => {
    if (!model) return;

    setIsSaving(true);
    try {
      const updateData: ModelDefinitionUpdateRequest = {
        model_description: description,
      };

      // Default config
      const defaultConfig: Record<string, number | undefined> = {};
      if (temperature) defaultConfig.temperature = parseFloat(temperature);
      if (maxTokens) defaultConfig.max_tokens = parseInt(maxTokens, 10);
      if (topP) defaultConfig.top_p = parseFloat(topP);
      if (topK) defaultConfig.top_k = parseInt(topK, 10);
      if (Object.keys(defaultConfig).length > 0) {
        updateData.default_config = defaultConfig;
      }

      // Custom config (only for custom provider)
      if (model.provider === "custom" && baseUrl) {
        updateData.custom_config = {
          base_url: baseUrl,
          api_key_env: apiKeyEnv || undefined,
        };
      }

      // Required env
      if (requiredEnv.trim()) {
        updateData.required_env = requiredEnv
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      // Capabilities
      if (capabilities.trim()) {
        updateData.capabilities = capabilities
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      // Tags
      if (tags.trim()) {
        updateData.tags = tags
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      await onSave(model.model_id, updateData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save model:", error);
      alert(error instanceof Error ? error.message : "Failed to save model");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!model) return;

    setIsDeleting(true);
    try {
      await onDelete(model.model_id);
    } catch (error) {
      console.error("Failed to delete model:", error);
      alert(error instanceof Error ? error.message : "Failed to delete model");
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

  if (!model) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-500">
        <p className="text-lg font-medium">No model selected</p>
        <p className="text-sm">Select a model from the list to view details</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="min-w-0 flex-1 pr-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 font-mono">
              {model.model_name}
            </h2>
            <ModelProviderBadge provider={model.provider} />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {model.model_path}
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                title="Cancel"
              >
                <X className="size-4" />
              </Button>
              <Button size="icon" onClick={handleSave} disabled={isSaving} title="Save">
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsEditing(true)}
                title="Edit"
              >
                <Pencil className="size-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" disabled={isDeleting} title="Delete">
                    {isDeleting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Model</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{model.model_name}
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
          {/* Model ID */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Model ID
            </label>
            <p className="rounded-md bg-gray-50 p-3 font-mono text-sm dark:bg-gray-800">
              {model.model_id}
            </p>
          </div>

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
                {model.model_description}
              </p>
            )}
          </div>

          {/* Default Config */}
          <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Default Configuration
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Temperature
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="0.1"
                    className="font-mono"
                  />
                ) : (
                  <p className="rounded-md bg-gray-50 p-2 font-mono text-sm dark:bg-gray-800">
                    {model.default_config?.temperature ?? "-"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Max Tokens
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    min="1"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                    placeholder="(optional)"
                    className="font-mono"
                  />
                ) : (
                  <p className="rounded-md bg-gray-50 p-2 font-mono text-sm dark:bg-gray-800">
                    {model.default_config?.max_tokens ?? "-"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Top P
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={topP}
                    onChange={(e) => setTopP(e.target.value)}
                    placeholder="(optional)"
                    className="font-mono"
                  />
                ) : (
                  <p className="rounded-md bg-gray-50 p-2 font-mono text-sm dark:bg-gray-800">
                    {model.default_config?.top_p ?? "-"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Top K
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    min="1"
                    value={topK}
                    onChange={(e) => setTopK(e.target.value)}
                    placeholder="(optional)"
                    className="font-mono"
                  />
                ) : (
                  <p className="rounded-md bg-gray-50 p-2 font-mono text-sm dark:bg-gray-800">
                    {model.default_config?.top_k ?? "-"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Custom Config (only for custom provider) */}
          {model.provider === "custom" && (
            <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Custom Provider Settings
              </h3>

              <div className="space-y-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Base URL
                </label>
                {isEditing ? (
                  <Input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.example.com/v1"
                    className="font-mono"
                  />
                ) : (
                  <p className="rounded-md bg-gray-50 p-2 font-mono text-sm dark:bg-gray-800 overflow-x-auto">
                    {model.custom_config?.base_url || "-"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  API Key Environment Variable
                </label>
                {isEditing ? (
                  <Input
                    value={apiKeyEnv}
                    onChange={(e) => setApiKeyEnv(e.target.value)}
                    placeholder="MY_API_KEY"
                    className="font-mono"
                  />
                ) : (
                  <p className="rounded-md bg-gray-50 p-2 font-mono text-sm dark:bg-gray-800">
                    {model.custom_config?.api_key_env || "-"}
                  </p>
                )}
              </div>
            </div>
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
                placeholder={`ANTHROPIC_API_KEY`}
              />
            ) : (
              <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
                {model.required_env && model.required_env.length > 0 ? (
                  <ul className="list-inside list-disc text-sm">
                    {model.required_env.map((env) => (
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

          {/* Capabilities */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Capabilities (one per line)
            </label>
            {isEditing ? (
              <Textarea
                value={capabilities}
                onChange={(e) => setCapabilities(e.target.value)}
                rows={3}
                placeholder={`chat\nfunction_calling\nvision`}
              />
            ) : (
              <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
                {model.capabilities && model.capabilities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {model.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">None</p>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags (one per line)
            </label>
            {isEditing ? (
              <Textarea
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                rows={2}
                placeholder={`production\ncoding`}
              />
            ) : (
              <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
                {model.tags && model.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {model.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
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
