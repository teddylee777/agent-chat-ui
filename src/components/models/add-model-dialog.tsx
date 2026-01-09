"use client";

import { useState } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validateModel } from "@/lib/api/agent-builder";
import type { ModelDefinitionCreateRequest, ModelProvider } from "@/lib/types/agent-builder";
import { toast } from "sonner";

const providers: ModelProvider[] = [
  "anthropic",
  "openai",
  "google",
  "azure",
  "bedrock",
  "custom",
];

interface AddModelDialogProps {
  onAdd: (data: ModelDefinitionCreateRequest) => Promise<void>;
}

export function AddModelDialog({ onAdd }: AddModelDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "custom">("general");

  // Form state
  const [modelName, setModelName] = useState("");
  const [provider, setProvider] = useState<ModelProvider>("anthropic");
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

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const resetForm = () => {
    setModelName("");
    setProvider("anthropic");
    setDescription("");
    setTemperature("");
    setMaxTokens("");
    setTopP("");
    setTopK("");
    setBaseUrl("");
    setApiKeyEnv("");
    setRequiredEnv("");
    setCapabilities("");
    setTags("");
    setValidationError(null);
    setValidationWarnings([]);
    setActiveTab("general");
  };

  // Parse provider from model_name
  const handleModelNameChange = (value: string) => {
    setModelName(value);
    setValidationError(null);

    // Try to extract provider from model_name
    if (value.includes(":")) {
      const [providerPart] = value.split(":");
      if (providers.includes(providerPart as ModelProvider)) {
        setProvider(providerPart as ModelProvider);
      }
    }
  };

  const buildCreateRequest = (): ModelDefinitionCreateRequest => {
    const request: ModelDefinitionCreateRequest = {
      model_name: modelName,
      model_description: description,
      provider,
    };

    // Default config
    const defaultConfig: Record<string, number> = {};
    if (temperature) defaultConfig.temperature = parseFloat(temperature);
    if (maxTokens) defaultConfig.max_tokens = parseInt(maxTokens, 10);
    if (topP) defaultConfig.top_p = parseFloat(topP);
    if (topK) defaultConfig.top_k = parseInt(topK, 10);
    if (Object.keys(defaultConfig).length > 0) {
      request.default_config = defaultConfig;
    }

    // Custom config (only for custom provider)
    if (provider === "custom" && baseUrl) {
      request.custom_config = {
        base_url: baseUrl,
        api_key_env: apiKeyEnv || undefined,
      };
    }

    // Required env
    if (requiredEnv.trim()) {
      request.required_env = requiredEnv
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Capabilities
    if (capabilities.trim()) {
      request.capabilities = capabilities
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Tags
    if (tags.trim()) {
      request.tags = tags
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    return request;
  };

  const handleValidate = async (): Promise<boolean> => {
    // Client-side validation
    if (!modelName.trim()) {
      setValidationError("Model name is required");
      return false;
    }

    if (!modelName.includes(":")) {
      setValidationError("Model name must be in format 'provider:model' (e.g., anthropic:claude-sonnet-4-5)");
      return false;
    }

    if (!description.trim()) {
      setValidationError("Description is required");
      return false;
    }

    if (provider === "custom" && !baseUrl) {
      setValidationError("Base URL is required for custom provider");
      return false;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidationWarnings([]);

    try {
      const request = buildCreateRequest();
      const result = await validateModel(request);

      if (!result.valid) {
        setValidationError(result.errors.join(", "));
        return false;
      }

      if (result.warnings.length > 0) {
        setValidationWarnings(result.warnings);
      }

      return true;
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Validation failed");
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    const isValid = await handleValidate();
    if (!isValid) return;

    setIsSaving(true);
    try {
      const request = buildCreateRequest();
      await onAdd(request);
      toast.success(`Model "${modelName}" created successfully`);
      resetForm();
      setIsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create model");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 size-4" />
          Add Model
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Model</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "general" | "custom")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model-name">Model Name *</Label>
              <Input
                id="model-name"
                value={modelName}
                onChange={(e) => handleModelNameChange(e.target.value)}
                placeholder="anthropic:claude-sonnet-4-5"
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Format: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">provider:model</code>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as ModelProvider)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this model..."
                rows={2}
              />
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

            <div className="grid grid-cols-2 gap-4">
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
            {provider === "custom" && (
              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Custom Provider Settings
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="base-url">Base URL *</Label>
                    <Input
                      id="base-url"
                      type="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://api.example.com/v1"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-key-env">API Key Environment Variable</Label>
                    <Input
                      id="api-key-env"
                      value={apiKeyEnv}
                      onChange={(e) => setApiKeyEnv(e.target.value)}
                      placeholder="MY_API_KEY"
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="required-env">Required Environment Variables (one per line)</Label>
              <Textarea
                id="required-env"
                value={requiredEnv}
                onChange={(e) => setRequiredEnv(e.target.value)}
                placeholder={`ANTHROPIC_API_KEY`}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capabilities">Capabilities (one per line)</Label>
              <Textarea
                id="capabilities"
                value={capabilities}
                onChange={(e) => setCapabilities(e.target.value)}
                placeholder={`chat\nfunction_calling\nvision`}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (one per line)</Label>
              <Textarea
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={`production\ncoding`}
                rows={2}
              />
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

        {/* Validation Warnings */}
        {validationWarnings.length > 0 && (
          <div className="rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <div className="flex flex-col gap-1 text-yellow-600 dark:text-yellow-400">
              {validationWarnings.map((warning, i) => (
                <span key={i} className="text-sm">{warning}</span>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isValidating || isSaving}
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Validating...
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
