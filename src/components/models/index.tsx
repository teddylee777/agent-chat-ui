"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModelList } from "./model-list";
import { ModelDetail } from "./model-detail";
import { AddModelDialog } from "./add-model-dialog";
import {
  getModels,
  getModel,
  createModel,
  updateModel,
  deleteModel,
} from "@/lib/api/agent-builder";
import type {
  ModelDefinitionSummary,
  ModelDefinitionInfo,
  ModelDefinitionCreateRequest,
  ModelDefinitionUpdateRequest,
} from "@/lib/types/agent-builder";

export function ModelsScreen() {
  const router = useRouter();
  const [models, setModels] = useState<ModelDefinitionSummary[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelDefinitionInfo | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load models list
  const loadModels = useCallback(async () => {
    try {
      const response = await getModels();
      setModels(response.models);
    } catch (error) {
      console.error("Failed to load models:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setIsLoadingList(true);
    loadModels().finally(() => setIsLoadingList(false));
  }, [loadModels]);

  // Load selected model detail
  useEffect(() => {
    if (!selectedModelId) {
      setSelectedModel(null);
      return;
    }

    const loadModelDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const model = await getModel(selectedModelId);
        setSelectedModel(model);
      } catch (error) {
        console.error("Failed to load model:", error);
        setSelectedModel(null);
      } finally {
        setIsLoadingDetail(false);
      }
    };

    loadModelDetail();
  }, [selectedModelId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadModels();
    if (selectedModelId) {
      try {
        const model = await getModel(selectedModelId);
        setSelectedModel(model);
      } catch {
        setSelectedModelId(null);
        setSelectedModel(null);
      }
    }
    setIsRefreshing(false);
  };

  const handleAddModel = async (data: ModelDefinitionCreateRequest) => {
    const response = await createModel(data);
    await loadModels();
    setSelectedModelId(response.model_id);
  };

  const handleSaveModel = async (modelId: string, data: ModelDefinitionUpdateRequest) => {
    const response = await updateModel(modelId, data);
    const updatedModel = await getModel(response.model_id);
    setSelectedModel(updatedModel);
    setSelectedModelId(response.model_id);
    await loadModels();
  };

  const handleDeleteModel = async (modelId: string) => {
    await deleteModel(modelId);
    setSelectedModelId(null);
    setSelectedModel(null);
    await loadModels();
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="size-9"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Models
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage model definitions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 size-4" />
            )}
            Refresh
          </Button>
          <AddModelDialog onAdd={handleAddModel} />
        </div>
      </div>

      {/* Split Panel Content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[385px] flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
          <ModelList
            models={models}
            selectedModel={selectedModelId}
            onSelectModel={setSelectedModelId}
            isLoading={isLoadingList}
          />
        </div>
        <div className="flex-1">
          <ModelDetail
            model={selectedModel}
            isLoading={isLoadingDetail}
            onSave={handleSaveModel}
            onDelete={handleDeleteModel}
          />
        </div>
      </div>
    </div>
  );
}

// Re-export components
export { ModelList } from "./model-list";
export { ModelDetail } from "./model-detail";
export { AddModelDialog } from "./add-model-dialog";
export { ModelProviderBadge } from "./model-provider-badge";
