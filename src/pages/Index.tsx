import { useState, useEffect } from "react";
import { ChatArea } from "@/components/ChatArea";
import { ModelLoadingUI } from "@/components/ModelLoadingUI";
import { llmService } from "@/lib/llm";
import { ToastProvider } from "@/lib/toast";
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/clerk-react";
import { InterviewConfigModal, InterviewConfig } from "@/components/InterviewConfigModal";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  lastMessageDate: Date;
  messages: Message[];
  config?: InterviewConfig;
}

export default function Index() {
  const [currentChat, setCurrentChat] = useState<Chat | undefined>();
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModelLoading, setShowModelLoading] = useState(false);
  const [isCheckingCache, setIsCheckingCache] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const { isSignedIn } = useAuth();

  // Set SEO metadata when component mounts
  useEffect(() => {
    // Set document title
    document.title = "AI Interview Assistant | Practice Job Interviews with AI";
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Practice job interviews with our AI-powered interview simulator. Get realistic questions and feedback tailored to your role and experience level.");
    }
    
    // Set meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute("name", "keywords");
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute("content", "job interview practice, AI interview simulator, interview preparation, career development, interview questions");
    
    // Set canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", "https://mockello.com/");
    
    // Cleanup function not needed since we're just updating existing tags
  }, []);

  // Initialize with an empty chat and check for cached model when the component mounts
  useEffect(() => {
    const newChat = createNewChat();
    setCurrentChat(newChat);
    
    // Try to load model from cache automatically
    const tryLoadFromCache = async () => {
      setIsCheckingCache(true);
      try {
        // Check if model exists in cache first (this doesn't download, just checks)
        const status = llmService.getStatus();
        const isCached = localStorage.getItem('llm_status') === 'ready';
        
        if (isCached) {
          // If model is in cache, initialize it silently
          console.log("Model cache found, loading silently...");
          await llmService.initialize();
          setIsModelLoaded(true);
        }
      } catch (error) {
        console.error("Error checking model cache:", error);
      } finally {
        setIsCheckingCache(false);
      }
    };
    
    tryLoadFromCache();
    
    // Cleanup LLM service when component unmounts
    return () => {
      llmService.dispose();
    };
  }, []);

  // Check for pending messages when user signs in
  useEffect(() => {
    if (isSignedIn) {
      const pendingMessage = localStorage.getItem("pendingMessage");
      if (pendingMessage) {
        // Clear the pending message from localStorage
        localStorage.removeItem("pendingMessage");
        
        // Show config modal first if no config exists
        if (!currentChat?.config) {
          setShowConfigModal(true);
          // Store the pending message to send after configuration
          localStorage.setItem("pendingMessage", pendingMessage);
        } else {
          // Send the pending message if config already exists
          handleSendMessage(pendingMessage, "user");
        }
      }
    }
  }, [isSignedIn, currentChat?.config]);

  // Function to create a new chat
  const createNewChat = (): Chat => {
    return {
      id: generateId(),
      title: `Interview Session`,
      lastMessageDate: new Date(),
      messages: [],
    };
  };

  // Function to handle saving interview configuration
  const handleSaveConfig = (config: InterviewConfig) => {
    if (!currentChat) return;
    
    // Update the chat with the new configuration
    const updatedChat = {
      ...currentChat,
      title: `${config.role} Interview (${config.difficulty})`,
      config: config
    };
    
    setCurrentChat(updatedChat);
    
    // Check if there's a pending message to send
    const pendingMessage = localStorage.getItem("pendingMessage");
    if (pendingMessage) {
      localStorage.removeItem("pendingMessage");
      handleSendMessage(pendingMessage, "user");
    } else {
      // Add a welcome message based on the configuration
      const welcomeMessage = generateWelcomeMessage(config);
      handleSendMessage(welcomeMessage, "assistant");
    }
  };

  // Generate a welcome message based on the interview configuration
  const generateWelcomeMessage = (config: InterviewConfig): string => {
    const { role, difficulty } = config;
    
    return `Hello! I'm your interviewer for the ${role} position. Tell me about your background and experience relevant to this role.`;
  };

  // Function to handle sending a message
  const handleSendMessage = async (content: string, role: "user" | "assistant") => {
    if (!currentChat) return;

    // If this is the first user message and no config exists, show config modal
    if (role === "user" && currentChat.messages.length === 0 && !currentChat.config) {
      // Save the message to send after configuration
      localStorage.setItem("pendingMessage", content);
      setShowConfigModal(true);
      return;
    }

    // Add user message immediately
    if (role === "user") {
      const newMessage: Message = {
        id: generateId(),
        content,
        role,
        timestamp: new Date(),
      };

      const updatedChat = {
        ...currentChat,
        lastMessageDate: new Date(),
        messages: [...currentChat.messages, newMessage],
      };

      setCurrentChat(updatedChat);

      // If model isn't loaded yet and we're not already showing the loading UI,
      // show it now that the user has interacted
      if (!isModelLoaded && !showModelLoading && !isCheckingCache) {
        setShowModelLoading(true);
      }

      // If model is loaded, generate AI response
      if (isModelLoaded) {
        try {
          setIsGenerating(true);
          
          // Get role and difficulty from config
          const role = currentChat.config?.role || "Software Engineer";
          const difficulty = currentChat.config?.difficulty || "intermediate";
          
          // Prepare conversation history for the LLM with role-specific system prompt
          const messages = [
            { 
              role: 'system' as const, 
              content: `You are the interviewer for a ${difficulty} level ${role} position. Always start with 'Introduce yourself?' Keep all responses extremely brief, never exceeding 2 lines. Ask follow-up questions frequently to dig deeper into the candidate's answers. Be direct and professional.` 
            },
            ...currentChat.messages.map(m => ({
              role: m.role as 'user' | 'assistant',
              content: m.content
            })),
            { role: 'user' as const, content }
          ];
          
          // Generate AI response
          const assistantContent = await llmService.generateCompletion(messages);
          
          // Add assistant message
          const assistantMessage: Message = {
            id: generateId(),
            content: assistantContent,
            role: "assistant",
            timestamp: new Date(),
          };

          const finalChat = {
            ...updatedChat,
            lastMessageDate: new Date(),
            messages: [...updatedChat.messages, assistantMessage],
          };

          setCurrentChat(finalChat);
          setIsGenerating(false);
        } catch (error) {
          console.error("Error generating AI response:", error);
          setIsGenerating(false);
        }
      } else {
        // If model isn't loaded, use a fallback response
        setIsGenerating(true);
        setTimeout(() => {
          const fallbackResponses = [
            "I'm loading my brain. Please wait a moment before I can respond properly. Can you repeat your question?",
            "Just a moment, I'm preparing my neural networks to give you a thoughtful response. Can you repeat your question?",
            "My model is warming up. I'll be ready to help you shortly! Can you repeat your question?",
          ];
          
          const assistantMessage: Message = {
            id: generateId(),
            content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
            role: "assistant",
            timestamp: new Date(),
          };

          const finalChat = {
            ...updatedChat,
            lastMessageDate: new Date(),
            messages: [...updatedChat.messages, assistantMessage],
          };

          setCurrentChat(finalChat);
          setIsGenerating(false);
        }, 1000);
      }
    } else {
      // For manually added assistant messages (rarely used)
      const newMessage: Message = {
        id: generateId(),
        content,
        role,
        timestamp: new Date(),
      };

      const updatedChat = {
        ...currentChat,
        lastMessageDate: new Date(),
        messages: [...currentChat.messages, newMessage],
      };

      setCurrentChat(updatedChat);
    }
  };

  // Helper function to generate a unique ID
  const generateId = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  // Model loading callback
  const handleModelLoaded = () => {
    setIsModelLoaded(true);
    setShowModelLoading(false);
  };

  // Function to handle reconfiguring the interview
  const handleConfigClick = () => {
    setShowConfigModal(true);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <InterviewConfigModal
        isOpen={showConfigModal}
        onSave={handleSaveConfig}
        onClose={() => setShowConfigModal(false)}
      />
      
      {showModelLoading && !isModelLoaded && (
        <ModelLoadingUI onModelLoaded={handleModelLoaded} />
      )}
      
      <div className="flex-1 overflow-hidden">
        <ChatArea
          currentChat={currentChat}
          onSendMessage={handleSendMessage}
          isLoading={isGenerating}
          onConfigClick={handleConfigClick}
        />
      </div>
    </div>
  );
}
