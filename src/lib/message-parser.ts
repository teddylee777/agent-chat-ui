/**
 * Message Parser Utility
 *
 * Reconstructs content_blocks from messages loaded from thread history.
 * This ensures consistent rendering between streamed and loaded messages.
 */

import type { ContentBlock, MessageItem } from "@/lib/types/agent-builder";

/**
 * Gets string content from message content which can be string or array format.
 */
function getContentString(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .filter((item) => item.type === "text" && item.text)
      .map((item) => item.text)
      .join("");
  }
  return "";
}

/**
 * Parses tool calls from content string (XML patterns) and returns clean content.
 * This handles legacy XML-based tool call patterns in message content.
 */
function parseAndCleanContent(content: string | Array<{ type: string; text?: string }>): string {
  const contentString = getContentString(content);
  let cleanContent = contentString;

  // Remove <function_calls>...<invoke>...</function_calls> blocks
  const functionCallsRegex = /<function_calls>[\s\S]*?<\/function_calls>/g;
  cleanContent = cleanContent.replace(functionCallsRegex, "");

  // Remove standalone <search>...</search> blocks
  const searchRegex = /<search>[\s\S]*?<\/search>/g;
  cleanContent = cleanContent.replace(searchRegex, "");

  // Remove standalone <invoke>...</invoke> blocks
  const invokeRegex = /<invoke name="[^"]+">[\s\S]*?<\/invoke>/g;
  cleanContent = cleanContent.replace(invokeRegex, "");

  return cleanContent.trim();
}

/**
 * Reconstructs content_blocks from a loaded message.
 *
 * When messages are loaded from thread history, they don't have content_blocks
 * populated. This function creates the content_blocks array from:
 * - tool_calls (for AI messages)
 * - tool_results (for tool messages)
 * - text content (cleaned of XML patterns)
 *
 * This ensures consistent rendering via renderContentBlocks() path.
 */
export function reconstructContentBlocks(
  message: MessageItem
): MessageItem & { content_blocks: ContentBlock[] } {
  const contentBlocks: ContentBlock[] = [];

  // For AI messages: reconstruct from tool_calls + content
  if (message.type === "ai") {
    // Add tool_calls to content_blocks
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const tc of message.tool_calls) {
        contentBlocks.push({
          type: "tool_call",
          id: tc.id,
          name: tc.name,
          args: tc.args,
        });
      }
    }

    // Add text content (excluding any tool XML patterns)
    const cleanContent = parseAndCleanContent(message.content);
    if (cleanContent) {
      contentBlocks.push({
        type: "text",
        content: cleanContent,
      });
    }
  }

  // For tool messages: reconstruct from tool_results
  if (message.type === "tool") {
    if (message.tool_results && message.tool_results.length > 0) {
      for (const result of message.tool_results) {
        contentBlocks.push({
          type: "tool_result",
          result: result.result,
        });
      }
    }
  }

  // For human messages: just use content
  if (message.type === "human") {
    const contentString = getContentString(message.content);
    if (contentString) {
      contentBlocks.push({
        type: "text",
        content: contentString,
      });
    }
  }

  return {
    ...message,
    content_blocks: contentBlocks,
  };
}
