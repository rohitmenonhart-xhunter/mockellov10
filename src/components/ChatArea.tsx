import { useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { Chat } from "@/pages/Index";
import { Bot, RefreshCw, UserCircle, Lock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThreeDHeadAvatar } from "@/components/ThreeDHeadAvatar";
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/clerk-react";
import { Badge } from "@/components/ui/badge";

interface ChatAreaProps {
  currentChat?: Chat;
  onSendMessage: (content: string, role: "user" | "assistant") => void;
  isLoading?: boolean;
  onConfigClick?: () => void;
}

// Custom M Logo component
const MLogo = ({ className }: { className?: string }) => (
  <div className={`font-bold text-[#FFFAF5] ${className || ""}`} style={{ fontFamily: "Arial, sans-serif" }}>
    M
  </div>
);

export function ChatArea({ 
  currentChat, 
  onSendMessage, 
  isLoading = false,
  onConfigClick
}: ChatAreaProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { isSignedIn } = useAuth();

  // Handler for speech status changes
  const handleSpeechStatusChange = (isPlaying: boolean) => {
    setIsSpeaking(isPlaying);
  };

  const handleSendMessage = async (content: string) => {
    // Add user message
    onSendMessage(content, "user");
  };

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#111] flex items-center justify-center">
            <Bot className="w-8 h-8 text-[#FFFAF5]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#111]">Welcome to AI Interview Coach</h2>
          <p className="text-[#666]">Your personal interview preparation assistant</p>
        </div>
      </div>
    );
  }

  // Show centered welcome screen when chat is empty
  if (currentChat.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#FFFAF5] w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8DFD5] bg-[#FFFAF5]/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#111] flex items-center justify-center">
              <MLogo className="text-2xl" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-semibold text-[#111] text-xl tracking-tight">Mockello</h1>
              <span className="text-xs text-[#666]">AI-powered mock interviewer and trainer</span>
            </div>
          </div>
          
          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            <SignedOut>
              <SignInButton>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <span>Sign In</span>
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>

        {/* Centered Welcome Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 w-full relative">
          {/* Subtle light effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#F6E2C4]/20 blur-3xl"></div>
          
          <div className="text-center space-y-10 mb-16 relative z-10 max-w-4xl mx-auto">
            <div className="w-32 h-32 mx-auto rounded-2xl bg-[#111] flex items-center justify-center shadow-xl">
              <MLogo className="text-6xl" />
            </div>
            
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold text-[#111] tracking-tight">
                Practice makes perfect
              </h1>
              <p className="text-xl text-[#666] max-w-2xl mx-auto leading-relaxed">
                Get ready for your next interview with AI Coach, your personal interview preparation assistant
              </p>
            </div>
            
            {/* Chat Input moved here - much higher */}
            <div className="w-full max-w-2xl mx-auto relative z-10 mt-12">
              <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#E8DFD5] bg-[#FFFAF5]/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#111] flex items-center justify-center">
            <MLogo className="text-2xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-[#111] text-xl tracking-tight">Mockello</h1>
              {currentChat.config && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {currentChat.config.difficulty}
                </Badge>
              )}
            </div>
            <div className="flex items-center">
              <p className="text-sm text-[#666]">
                {currentChat.config ? `${currentChat.config.role} Interview` : currentChat.title}
              </p>
              {currentChat.config && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-2 text-[#666] hover:text-[#111] hover:bg-[#F6E2C4]/20"
                  onClick={onConfigClick}
                  title="Reconfigure interview"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#666] hover:text-[#111] hover:bg-[#F6E2C4]/20 rounded-xl h-10 w-10 p-0 transition-all duration-200"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
          
          {/* Auth Buttons */}
          <SignedOut>
            <SignInButton>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <span>Sign In</span>
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>

      {/* Fixed 3D Avatar at top */}
      {currentChat.messages.some(msg => msg.role === "assistant") && (
        <div className="w-full flex justify-center bg-[#FFFAF5] pt-6">
          <div className="w-64 h-64 mb-2">
            <ThreeDHeadAvatar
              text=""
              isActive={isSpeaking}
              className="w-full h-full rounded-xl shadow-lg"
              modelUrl="/models/head.glb"
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 bg-[#FFFAF5]">
        <div className="max-w-4xl mx-auto py-5 space-y-0">
          {currentChat.messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              avatarHidden={message.role === "assistant"} 
              onSpeechStatusChange={handleSpeechStatusChange}
            />
          ))}
          
          {isLoading && (
            <ChatMessage 
              message={{
                id: "loading",
                content: "Thinking...",
                role: "assistant",
                timestamp: new Date(),
              }}
              isLoading={true}
              avatarHidden={true}
            />
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-5 border-t border-[#E8DFD5] bg-[#FFFAF5]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
