"use client";

import { useState, useEffect } from "react";
import { Settings, AlertCircle, Info } from "lucide-react";
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
import { useAgentCreate } from "@/providers/AgentCreate";

// Validation: model_name must contain ":"
function validateModelName(modelName: string): string | null {
  if (!modelName || !modelName.trim()) {
    return "Model name is required";
  }
  if (!modelName.includes(":")) {
    return "Invalid format. Expected 'provider:model' (e.g., anthropic:claude-haiku-4-5)";
  }
  return null;
}

export function CreateModelSettingsDialog() {
  const { config, updateField } = useAgentCreate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "custom">("general");

  // Form state
  const [modelName, setModelName] = useState("");

  // Validation error
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setModelName(config.model_name || "");
      setValidationError(null);
    }
  }, [isOpen, config.model_name]);

  // Handle model name change with validation
  const handleModelNameChange = (value: string) => {
    setModelName(value);
    setValidationError(null);
  };

  // Handle save
  const handleSave = () => {
    // Validate model name
    const error = validateModelName(modelName);
    if (error) {
      setValidationError(error);
      return;
    }

    updateField("model_name", modelName);
    setIsOpen(false);
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
                  placeholder="anthropic:claude-haiku-4-5"
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">
                  Format: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">provider:model</code>
                </p>
                <p className="text-xs text-gray-500">
                  Example: anthropic:claude-haiku-4-5
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
                  placeholder="anthropic:claude-haiku-4-5"
                  className="font-mono"
                />
              </div>

              {/* Info message for advanced settings */}
              <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 size-5 text-blue-500" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium">Advanced Settings</p>
                    <p className="mt-1 text-blue-600 dark:text-blue-400">
                      Temperature, Max Tokens, Top P, Top K, API Key, Base URL 등의 고급 설정은 에이전트 생성 후 Edit 페이지에서 구성할 수 있습니다.
                    </p>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
