import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Send, Sparkles, Command, Mic, BrainCircuit, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth, SignInButton } from "@clerk/clerk-react";

// Add type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  error: any;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
}

// Add global declarations
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [interimResult, setInterimResult] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { isSignedIn } = useAuth();
  const signInButtonRef = useRef<HTMLButtonElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef<boolean>(false);

  // Keep isListeningRef in sync with isListening state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Initialize speech recognition
  useEffect(() => {
    // Setup speech recognition
    const setupRecognition = () => {
      if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
        console.error('Speech recognition not supported in this browser');
        return;
      }

      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      
      if (!recognitionRef.current) return;
      
      // Configure recognition
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      // Handle results
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        // Process results
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // Only update message with final transcripts
        if (finalTranscript) {
          setMessage((prev) => {
            const newText = prev.trim() ? `${prev.trim()} ${finalTranscript}` : finalTranscript;
            return newText;
          });
          setInterimResult("");
        } else if (interimTranscript) {
          // Show interim results separately
          setInterimResult(interimTranscript);
        }
      };
      
      // Handle end of speech recognition
      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended");
        
        // If still in listening mode, restart recognition after a short delay
        if (isListeningRef.current) {
          setInterimResult("");
          
          // Clear any existing restart timeout
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }
          
          // Set a small delay before restarting to avoid rapid cycling
          restartTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && isListeningRef.current) {
              try {
                recognitionRef.current.start();
                console.log("Speech recognition restarted");
              } catch (error) {
                console.error("Error restarting speech recognition:", error);
                setIsListening(false);
              }
            }
          }, 300);
        } else {
          setIsListening(false);
          setInterimResult("");
        }
      };
      
      // Handle errors
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        
        // Only stop listening on fatal errors
        if (event.error === 'not-allowed' || event.error === 'audio-capture' || event.error === 'service-not-allowed') {
          setIsListening(false);
          setInterimResult("");
        }
      };
    };
    
    setupRecognition();
    
    // Start recognition if isListening is true
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.start();
        console.log("Speech recognition started");
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsListening(false);
      }
    }
    
    // Clean up
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.error("Error aborting speech recognition:", error);
        }
      }
      
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }
    
    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping speech recognition:", error);
        }
      }
      
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      
      setIsListening(false);
      setInterimResult("");
    } else {
      // Start listening
      setInterimResult("");
      setIsListening(true);
    }
  };

  const handleSend = () => {
    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimResult("");
      
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
    }
    
    if (message.trim() && !disabled) {
      if (isSignedIn) {
        onSendMessage(message.trim());
        setMessage("");
      } else {
        // Save the message to localStorage so we can retrieve it after sign in
        if (message.trim()) {
          localStorage.setItem("pendingMessage", message.trim());
        }
        
        // Trigger the sign-in button click
        if (signInButtonRef.current) {
          signInButtonRef.current.click();
        }
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Combine message and interim result for display
  const displayText = interimResult ? `${message} ${interimResult}` : message;

  return (
    <div className={cn(
      "relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 backdrop-blur-md",
      isFocused 
        ? "border-[#111] bg-white shadow-md" 
        : "border-[#E8DFD5] bg-[#FFFAF5] hover:border-[#111]/30",
      isListening && "border-red-400"
    )}>
      {/* Interview AI Button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-[#666] hover:text-[#111] hover:bg-[#F6E2C4]/30 rounded-xl px-4 h-10 text-sm font-medium transition-all duration-200 hidden md:flex"
        disabled={disabled}
      >
        <BrainCircuit className="w-4 h-4 mr-2" />
        Interview AI
      </Button>

      {/* Text Input */}
      <div className="flex-1 relative">
        <Textarea
          value={displayText}
          onChange={(e) => {
            setMessage(e.target.value);
            setInterimResult("");
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isSignedIn 
            ? isListening 
              ? "Listening..." 
              : "Type your interview response..." 
            : "Sign in to start chatting..."
          }
          disabled={disabled}
          className={cn(
            "min-h-[42px] max-h-36 resize-none border-0 bg-transparent p-2 text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#999] text-[#111] leading-relaxed",
            isListening && "placeholder:text-red-400"
          )}
          rows={1}
        />
        
        {/* Listening indicator */}
        {isListening && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-400 animate-pulse"></div>
        )}
        
        {/* Keyboard shortcut hint */}
        <div className="absolute right-2 bottom-1 hidden md:flex items-center gap-1 text-xs text-[#999]">
          <Command className="w-3 h-3" />
          <span>+ Enter</span>
        </div>
      </div>

      {/* Voice Button */}
      <Button
        variant={isListening ? "destructive" : "ghost"}
        size="sm"
        className={cn(
          "rounded-xl h-10 w-10 p-0 transition-all duration-200",
          isListening 
            ? "bg-red-500 text-white hover:bg-red-600" 
            : "text-[#666] hover:text-[#111] hover:bg-[#F6E2C4]/30"
        )}
        disabled={disabled}
        onClick={toggleListening}
      >
        {isListening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </Button>

      {/* Send Button */}
      <Button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className={cn(
          "rounded-xl h-10 w-10 p-0 transition-all duration-300",
          message.trim() && !disabled
            ? "bg-[#111] hover:bg-[#333] text-white hover:shadow-md hover:scale-105"
            : "bg-[#E8DFD5] text-[#999] cursor-not-allowed"
        )}
        size="sm"
      >
        <Send className="w-4 h-4" />
      </Button>
      
      {/* Hidden Sign In Button */}
      <div className="hidden">
        <SignInButton>
          <button ref={signInButtonRef} />
        </SignInButton>
      </div>
    </div>
  );
}
