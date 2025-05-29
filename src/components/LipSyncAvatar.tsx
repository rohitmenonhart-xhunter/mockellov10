import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface LipSyncAvatarProps {
  text: string;
  className?: string;
  isActive: boolean;
}

export function LipSyncAvatar({ text, className, isActive }: LipSyncAvatarProps) {
  const [mouthState, setMouthState] = useState<"closed" | "half-open" | "open">("closed");
  const [blinking, setBlinking] = useState(false);
  const [eyeDirection, setEyeDirection] = useState<"center" | "left" | "right">("center");
  const textRef = useRef(text);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const eyeMovementTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update text ref when text changes
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Blinking animation
  useEffect(() => {
    const startBlinking = () => {
      const scheduleBlink = () => {
        const blinkInterval = 2000 + Math.random() * 3000;
        
        blinkTimerRef.current = setTimeout(() => {
          setBlinking(true);
          setTimeout(() => {
            setBlinking(false);
            scheduleBlink();
          }, 150);
        }, blinkInterval);
      };
      
      scheduleBlink();
    };

    startBlinking();

    return () => {
      if (blinkTimerRef.current) {
        clearTimeout(blinkTimerRef.current);
      }
    };
  }, []);

  // Eye movement effect
  useEffect(() => {
    const startEyeMovements = () => {
      const scheduleEyeMovement = () => {
        const movementInterval = 2000 + Math.random() * 3000;
        
        eyeMovementTimerRef.current = setTimeout(() => {
          const directions: Array<"center" | "left" | "right"> = ["center", "left", "right"];
          const newDirection = directions[Math.floor(Math.random() * directions.length)];
          setEyeDirection(newDirection);
          
          // Return to center after a while
          const lookDuration = 500 + Math.random() * 1000;
          setTimeout(() => {
            setEyeDirection("center");
            scheduleEyeMovement();
          }, lookDuration);
        }, movementInterval);
      };

      scheduleEyeMovement();
    };

    startEyeMovements();

    return () => {
      if (eyeMovementTimerRef.current) {
        clearTimeout(eyeMovementTimerRef.current);
      }
    };
  }, []);

  // Lip sync animation
  useEffect(() => {
    if (!isActive) {
      setMouthState("closed");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Simulate lip sync by changing mouth state at intervals
    const startLipSync = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        // Random mouth position with weighted probability
        const rand = Math.random();
        if (rand < 0.4) {
          setMouthState("closed");
        } else if (rand < 0.7) {
          setMouthState("half-open");
        } else {
          setMouthState("open");
        }
      }, 150); // Adjust speed as needed
    };

    startLipSync();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive]);

  // Get eye position based on direction
  const getEyePosition = (direction: typeof eyeDirection) => {
    switch (direction) {
      case "left": return "translateX(-2px)";
      case "right": return "translateX(2px)";
      default: return "translateX(0)"; // center
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Avatar className="w-full h-full rounded-xl bg-[#111] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Face structure */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Eyes */}
            <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex space-x-2">
              {/* Left eye */}
              <div className="relative w-2 h-2 rounded-full">
                <div className={cn(
                  "absolute inset-0 rounded-full bg-[#FFFAF5]",
                  blinking ? "h-[10%] top-[45%]" : ""
                )}></div>
                {!blinking && (
                  <div 
                    className="absolute inset-[20%] rounded-full bg-[#333]"
                    style={{ transform: getEyePosition(eyeDirection) }}
                  ></div>
                )}
              </div>
              
              {/* Right eye */}
              <div className="relative w-2 h-2 rounded-full">
                <div className={cn(
                  "absolute inset-0 rounded-full bg-[#FFFAF5]",
                  blinking ? "h-[10%] top-[45%]" : ""
                )}></div>
                {!blinking && (
                  <div 
                    className="absolute inset-[20%] rounded-full bg-[#333]"
                    style={{ transform: getEyePosition(eyeDirection) }}
                  ></div>
                )}
              </div>
            </div>
            
            {/* Mouth */}
            <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2">
              {mouthState === "closed" && (
                <div className="w-4 h-0.5 bg-[#FFFAF5] rounded-full"></div>
              )}
              {mouthState === "half-open" && (
                <div className="w-4 h-1.5 bg-[#FFFAF5] rounded-full"></div>
              )}
              {mouthState === "open" && (
                <div className="w-4 h-2.5 bg-[#FFFAF5] rounded-full"></div>
              )}
            </div>
          </div>
        </div>
      </Avatar>
    </div>
  );
} 