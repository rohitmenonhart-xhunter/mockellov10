import React from "react";
import { Button } from "@/components/ui/button";
import { Chat } from "@/pages/Index";
import { MessageSquarePlus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  chats: Chat[];
  currentChatId?: string;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}

export function Sidebar({ 
  chats, 
  currentChatId, 
  onNewChat, 
  onSelectChat, 
  onDeleteChat 
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <>
      {/* Collapsed Sidebar Button */}
      {isCollapsed && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-20">
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-8 rounded-l-none rounded-r-md shadow-md"
            onClick={() => setIsCollapsed(false)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "w-64 bg-[#FFFAF5] border-r border-[#E8DFD5] transition-all duration-300 ease-in-out flex flex-col relative z-10",
          isCollapsed && "-ml-64"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#E8DFD5] flex items-center justify-between">
          <h1 className="font-semibold text-[#111] text-lg">Interviews</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={onNewChat}
              title="New Chat"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 lg:hidden"
              onClick={() => setIsCollapsed(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat List */}
        <div className="overflow-y-auto flex-1 p-2">
          {chats.length === 0 ? (
            <div className="text-center py-8 text-[#999] text-sm">
              No interviews yet
            </div>
          ) : (
            <ul className="space-y-1">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <div
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg cursor-pointer group",
                      currentChatId === chat.id
                        ? "bg-[#F6E2C4]/30 text-[#111]"
                        : "hover:bg-[#F6E2C4]/10 text-[#666]"
                    )}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <div className="truncate flex-1">
                      <p className="truncate text-sm">{chat.title}</p>
                      <p className="text-xs opacity-60">
                        {chat.lastMessageDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E8DFD5] text-center">
          <p className="text-xs text-[#999]">
            Browser-based AI Interview Coach
          </p>
        </div>
      </div>
    </>
  );
} 