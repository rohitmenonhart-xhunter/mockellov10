import { useEffect, useRef, useState } from "react";
import { User, Volume2, VolumeX, Headphones } from "lucide-react";
import { Message } from "@/pages/Index";
import { cn } from "@/lib/utils";
import { ThreeDHeadAvatar } from "./ThreeDHeadAvatar";
import { ReadyPlayerMeAvatar } from "./ReadyPlayerMeAvatar";
import { Button } from "./ui/button";

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
  avatarHidden?: boolean;
  onSpeechStatusChange?: (isPlaying: boolean) => void;
}

export function ChatMessage({ 
  message, 
  isLoading, 
  avatarHidden = false, 
  onSpeechStatusChange 
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVoiceLoaded, setIsVoiceLoaded] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceLoadAttemptedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Update parent component when speech status changes
  useEffect(() => {
    if (onSpeechStatusChange) {
      onSpeechStatusChange(isPlaying);
    }
  }, [isPlaying, onSpeechStatusChange]);

  // Safely create and manage the audio element
  useEffect(() => {
    // Create audio element but don't attach it to DOM
    const audio = new Audio();
    audioRef.current = audio;
    
    return () => {
      // Just cleanup reference
      audioRef.current = null;
    };
  }, []);

  // Load voices and monitor availability
  useEffect(() => {
    // Check if voices are already available
    const checkVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setIsVoiceLoaded(true);
        return true;
      }
      return false;
    };

    // Try to load voices initially
    if (!voiceLoadAttemptedRef.current) {
      voiceLoadAttemptedRef.current = true;
      if (!checkVoices()) {
        // If not available immediately, listen for the voiceschanged event
        const handleVoicesChanged = () => {
          checkVoices();
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        };
        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        
        // Backup timeout in case event never fires
        setTimeout(() => {
          if (!isVoiceLoaded) {
            checkVoices();
          }
        }, 1000);
        
        return () => {
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        };
      }
    }
  }, [isVoiceLoaded]);

  // Function to handle text-to-speech
  const speakText = () => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported");
      return;
    }
    
    // If already speaking, stop it
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(message.content);
    speechSynthRef.current = utterance;
    
    // Configure voice
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    let preferredVoice = null;
    
    // Look for high-quality voices first
    for (const voice of voices) {
      const name = voice.name.toLowerCase();
      // Premium voices first
      if (name.includes('premium') || name.includes('enhanced')) {
        if (name.includes('male') || name.includes('guy')) {
          preferredVoice = voice;
          break;
        }
      }
    }
    
    // Fall back to standard voices
    if (!preferredVoice) {
      preferredVoice = voices.find(voice => {
        const name = voice.name.toLowerCase();
        return (
          (name.includes('daniel') || name.includes('david') || 
           name.includes('james') || name.includes('tom') ||
           name.includes('guy') || name.includes('male')) &&
          (name.includes('us') || name.includes('uk') || name.includes('en'))
        );
      }) || null;
    }
    
    // Last resort - any English voice
    if (!preferredVoice) {
      preferredVoice = voices.find(voice => voice.lang.includes('en'));
    }
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    // Set event handlers
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (e) => {
      console.error("Speech synthesis error:", e);
      setIsPlaying(false);
    };
    
    // Break text into chunks for more natural pauses
    const chunks = breakTextIntoChunks(message.content);
    if (chunks.length > 1) {
      // For multi-chunk text, speak first chunk and queue the rest
      const firstChunk = new SpeechSynthesisUtterance(chunks[0]);
      if (preferredVoice) firstChunk.voice = preferredVoice;
      firstChunk.rate = utterance.rate;
      firstChunk.pitch = utterance.pitch;
      
      firstChunk.onstart = () => setIsPlaying(true);
      firstChunk.onend = () => {
        // Add slight pauses between chunks
        setTimeout(() => {
          const remainingText = chunks.slice(1).join(" ");
          const remainingUtterance = new SpeechSynthesisUtterance(remainingText);
          if (preferredVoice) remainingUtterance.voice = preferredVoice;
          remainingUtterance.rate = utterance.rate;
          remainingUtterance.pitch = utterance.pitch;
          remainingUtterance.onend = () => setIsPlaying(false);
          remainingUtterance.onerror = () => setIsPlaying(false);
          window.speechSynthesis.speak(remainingUtterance);
        }, 150);
      };
      
      firstChunk.onerror = () => setIsPlaying(false);
      
      // Start speaking first chunk
      setIsPlaying(true);
      window.speechSynthesis.speak(firstChunk);
    } else {
      // For single chunk, just speak it all
      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Helper function to break text into natural chunks
  const breakTextIntoChunks = (text: string): string[] => {
    // Split on sentence boundaries
    const sentenceBoundaries = /[.!?]\s+/;
    let sentences = text.split(sentenceBoundaries);
    
    // Re-add the punctuation that was removed by the split
    sentences = sentences.map((sentence, i) => {
      if (i < sentences.length - 1) {
        const nextCharIndex = text.indexOf(sentence) + sentence.length;
        const punctuation = text.charAt(nextCharIndex);
        return sentence + punctuation;
      }
      return sentence;
    });
    
    // Filter out empty sentences
    return sentences.filter(s => s.trim().length > 0);
  };

  // Auto-start speech for new messages
  useEffect(() => {
    // Only auto-play for new assistant messages and not during loading
    if (!isUser && !isLoading && isVoiceLoaded && !speechSynthRef.current) {
      // Small delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        speakText();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isUser, isLoading, message.content, isVoiceLoaded]);
  
  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (isPlaying && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying]);

  // New layout with 3D avatar at the top center
  if (!isUser) {
    return (
      <div className="flex flex-col items-center mb-4" ref={messageRef}>
        {/* Only show avatar if not hidden by prop */}
        {!avatarHidden && (
          <div className="w-96 h-96 mb-6">
            <ThreeDHeadAvatar
              text={message.content}
              isActive={isPlaying && !isLoading}
              className="w-full h-full rounded-xl shadow-lg"
              modelUrl="/models/head.glb"
            />
          </div>
        )}
        
        {/* Controls and info below the avatar */}
        <div className="flex items-center gap-2 mb-3 text-center">
          <span className="text-xs font-medium uppercase tracking-wide text-[#666]">Interviewer</span>
          
          <div className="flex items-center">
            {!isVoiceLoaded && (
              <span className="text-[#999] text-[10px] mr-2">loading voice...</span>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              className="h-6 w-6 p-0 rounded-full"
              onClick={speakText}
              disabled={!isVoiceLoaded}
              title={isPlaying ? "Stop speaking" : "Speak text"}
            >
              {isPlaying ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </Button>
          </div>
          
          {isPlaying && (
            <span className="flex items-center text-[#666] text-xs">
              <Headphones className="h-3 w-3 mr-1" />
              <span className="text-[10px]">speaking</span>
            </span>
          )}
        </div>
        
        {/* Message content in a chat bubble */}
        <div className="w-full max-w-3xl">
          <div className="bg-white border border-[#E8DFD5] text-[#111] px-5 py-3 rounded-2xl shadow-sm">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-[#111] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-[#333] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-[#666] rounded-full animate-bounce"></div>
                </div>
                <span className="text-[#666]">Evaluating your response...</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
          
          <div className="text-xs text-[#999] px-1 text-right mt-2">
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    );
  }
  
  // User message layout - right-aligned
  return (
    <div className="flex justify-end mb-4 w-full" ref={messageRef}>
      <div className="max-w-3xl">
        <div className="flex flex-row-reverse items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#111] flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-[#FFFAF5]" />
          </div>
          
          <div className="mr-1">
            <div className="bg-[#111] text-[#FFFAF5] px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
            
            <div className="text-xs text-[#999] px-1 text-right mt-2">
              You • {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
