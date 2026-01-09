"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const DUMMY_USER = {
  name: "John Doe",
  email: "john.doe@example.com",
  initials: "JD",
};

interface UserProfileProps {
  collapsed?: boolean;
}

export function UserProfile({ collapsed }: UserProfileProps) {
  if (collapsed) {
    return (
      <div className="flex justify-center border-t border-gray-200 p-4 dark:border-gray-700">
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarFallback className="bg-gray-200 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                {DUMMY_USER.initials}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{DUMMY_USER.name}</p>
            <p className="text-xs text-gray-500">{DUMMY_USER.email}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-t border-gray-200 p-4 dark:border-gray-700">
      <Avatar className="h-9 w-9">
        <AvatarFallback className="bg-gray-200 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          {DUMMY_USER.initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
          {DUMMY_USER.name}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {DUMMY_USER.email}
        </p>
      </div>
    </div>
  );
}
