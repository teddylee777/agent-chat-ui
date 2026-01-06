"use client";

import { AgentCreateProvider } from "@/providers/AgentCreate";
import { CreateHeader } from "@/components/agent-edit";
import {
  CreateInstructionsEditor,
  CreateToolbox,
  CreateMiddlewares,
  CreateModelSettings,
} from "@/components/agent-create";
import { MessageSquare } from "lucide-react";

function CreatePageContent() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-gray-900">
      <CreateHeader />

      <div className="flex flex-1 min-h-0">
        {/* Left Panel: 50% */}
        <div className="flex w-1/2 flex-col border-r border-gray-200 dark:border-gray-700">
          {/* Instructions: flex-grow */}
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-white dark:bg-gray-900">
            <CreateInstructionsEditor />
          </div>

          {/* Model Settings: 고정 높이 */}
          <div className="shrink-0 bg-white dark:bg-gray-900">
            <CreateModelSettings />
          </div>

          {/* Toolbox + Middlewares: 고정 높이, 좌우 배치 */}
          <div className="flex h-[320px] shrink-0 border-t border-gray-200 dark:border-gray-700">
            <div className="w-1/2 overflow-auto border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <CreateToolbox />
            </div>
            <div className="w-1/2 overflow-auto bg-white dark:bg-gray-900">
              <CreateMiddlewares />
            </div>
          </div>
        </div>

        {/* Right Panel: 50% - TestChat placeholder */}
        <div className="flex w-1/2 flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
          <div className="max-w-md px-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
              <MessageSquare className="size-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Test Chat
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              에이전트를 생성하면 이곳에서 테스트할 수 있습니다.
              <br />
              먼저 왼쪽에서 에이전트 설정을 완료한 후 &quot;Create Agent&quot; 버튼을 클릭하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentCreatePage() {
  return (
    <AgentCreateProvider>
      <CreatePageContent />
    </AgentCreateProvider>
  );
}
