import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface HumanLipSyncAvatarProps {
  text: string;
  className?: string;
  isActive: boolean;
}

export function HumanLipSyncAvatar({ text, className, isActive }: HumanLipSyncAvatarProps) {
  const [mouthState, setMouthState] = useState<"closed" | "half-open" | "open">("closed");
  const [blinking, setBlinking] = useState(false);
  const [eyeDirection, setEyeDirection] = useState<"center" | "left" | "right" | "up" | "down">("center");
  const [facialExpression, setFacialExpression] = useState<"neutral" | "smile" | "thinking">("neutral");
  const textRef = useRef(text);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const expressionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const eyeMovementTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update text ref when text changes
  useEffect(() => {
    textRef.current = text;
    
    // Change expression occasionally
    if (expressionTimerRef.current) {
      clearTimeout(expressionTimerRef.current);
    }
    
    // Small chance to smile at the beginning of speech
    if (Math.random() > 0.7) {
      setFacialExpression("smile");
      expressionTimerRef.current = setTimeout(() => {
        setFacialExpression("neutral");
      }, 1500);
    }
  }, [text]);

  // Blinking animation with more natural pattern
  useEffect(() => {
    const startBlinking = () => {
      const scheduleBlink = () => {
        const blinkInterval = 2000 + Math.random() * 4000; // Random blink interval between 2-6 seconds
        
        blinkTimerRef.current = setTimeout(() => {
          // Sometimes do a double blink
          if (Math.random() > 0.8) {
            setBlinking(true);
            setTimeout(() => {
              setBlinking(false);
              setTimeout(() => {
                setBlinking(true);
                setTimeout(() => {
                  setBlinking(false);
                  scheduleBlink();
                }, 150);
              }, 100);
            }, 150);
          } else {
            // Single blink
            setBlinking(true);
            setTimeout(() => {
              setBlinking(false);
              scheduleBlink();
            }, 150);
          }
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
        const movementInterval = 3000 + Math.random() * 5000; // Random interval
        
        eyeMovementTimerRef.current = setTimeout(() => {
          // Randomly look in different directions
          const directions: Array<"center" | "left" | "right" | "up" | "down"> = ["center", "left", "right", "up", "down"];
          const newDirection = directions[Math.floor(Math.random() * directions.length)];
          setEyeDirection(newDirection);
          
          // Look for a random duration then return to center
          const lookDuration = 800 + Math.random() * 1500;
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

  // More advanced lip sync animation with varied patterns
  useEffect(() => {
    if (!isActive) {
      setMouthState("closed");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Simulate natural speech patterns
    const startLipSync = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Initial positions
      let syllableCount = 0;
      let inPause = false;
      let pauseLength = 0;
      
      timerRef.current = setInterval(() => {
        // Simulate speech rhythm with pauses
        if (inPause) {
          pauseLength--;
          if (pauseLength <= 0) {
            inPause = false;
          } else {
            setMouthState("closed");
            return;
          }
        }
        
        // Random chance to pause (simulating natural speech breaks)
        if (Math.random() < 0.05 && syllableCount > 3) {
          inPause = true;
          pauseLength = 2 + Math.floor(Math.random() * 4); // Pause for 2-5 frames
          syllableCount = 0;
          setMouthState("closed");
          return;
        }
        
        // More natural mouth movement pattern
        const pattern = Math.random();
        
        if (pattern < 0.25) {
          // Quick closed-open-closed sequence
          setMouthState("half-open");
          setTimeout(() => {
            if (isActive) setMouthState("closed");
          }, 60);
        } else if (pattern < 0.5) {
          // Emphasized syllable
          setMouthState("open");
          setTimeout(() => {
            if (isActive) setMouthState("half-open");
            setTimeout(() => {
              if (isActive) setMouthState("closed");
            }, 60);
          }, 80);
        } else if (pattern < 0.8) {
          // Standard syllable
          setMouthState("half-open");
          setTimeout(() => {
            if (isActive) setMouthState("closed");
          }, 100);
        } else {
          // Brief closed position
          setMouthState("closed");
        }
        
        syllableCount++;
      }, 120); // Base interval for speech rhythm
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
      case "left": return "translate(-30%, -50%)";
      case "right": return "translate(10%, -50%)";
      case "up": return "translate(-10%, -80%)";
      case "down": return "translate(-10%, -20%)";
      default: return "translate(-10%, -50%)"; // center
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="w-full h-full rounded-xl bg-[#111] overflow-hidden flex items-center justify-center">
        {/* Cartoon face structure */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Hair */}
          <div className="absolute top-0 w-full h-[40%] bg-[#4A4A4A]"></div>
          
          {/* Face */}
          <div className="absolute inset-[15%] rounded-full bg-[#F0D6B9]">
            {/* Eyes Container */}
            <div className="absolute top-[40%] w-full flex justify-center space-x-[25%]">
              {/* Left eye */}
              <div className="relative w-[18%] h-[18%]">
                {/* Eye white */}
                <div className={cn(
                  "absolute inset-0 rounded-full bg-white border border-[#333] shadow-inner",
                  blinking ? "h-[10%] top-[45%]" : ""
                )}>
                  {/* Iris and pupil */}
                  {!blinking && (
                    <div 
                      className="absolute w-[70%] h-[70%] rounded-full bg-[#5B87C5] flex items-center justify-center"
                      style={{
                        top: "50%",
                        left: "50%",
                        transform: getEyePosition(eyeDirection)
                      }}
                    >
                      {/* Pupil */}
                      <div className="w-[60%] h-[60%] rounded-full bg-[#222]"></div>
                      {/* Light reflection */}
                      <div className="absolute top-[15%] right-[15%] w-[25%] h-[25%] rounded-full bg-white opacity-80"></div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right eye */}
              <div className="relative w-[18%] h-[18%]">
                {/* Eye white */}
                <div className={cn(
                  "absolute inset-0 rounded-full bg-white border border-[#333] shadow-inner",
                  blinking ? "h-[10%] top-[45%]" : ""
                )}>
                  {/* Iris and pupil */}
                  {!blinking && (
                    <div 
                      className="absolute w-[70%] h-[70%] rounded-full bg-[#5B87C5] flex items-center justify-center"
                      style={{
                        top: "50%",
                        left: "50%",
                        transform: getEyePosition(eyeDirection)
                      }}
                    >
                      {/* Pupil */}
                      <div className="w-[60%] h-[60%] rounded-full bg-[#222]"></div>
                      {/* Light reflection */}
                      <div className="absolute top-[15%] right-[15%] w-[25%] h-[25%] rounded-full bg-white opacity-80"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Eyebrows */}
            <div className="absolute top-[32%] w-full flex justify-center space-x-[30%]">
              <div className="w-[20%] h-[5%] bg-[#4A4A4A] rounded-full"></div>
              <div className="w-[20%] h-[5%] bg-[#4A4A4A] rounded-full"></div>
            </div>
            
            {/* Mouth - dynamic based on lip sync state and expression */}
            <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-[40%]">
              {facialExpression === "smile" ? (
                <div className="w-full h-[8px] rounded-full overflow-hidden">
                  <div className="w-full h-full bg-[#CC6D5D] rounded-b-full"></div>
                </div>
              ) : (
                <>
                  {mouthState === "closed" && (
                    <div className="w-full h-[2px] bg-[#CC6D5D] rounded-full"></div>
                  )}
                  {mouthState === "half-open" && (
                    <div className="w-full h-[6px] rounded-full overflow-hidden">
                      <div className="w-full h-full bg-[#CC6D5D] rounded-t-full"></div>
                      <div className="w-full h-[50%] bg-[#9E372A] rounded-b-full"></div>
                    </div>
                  )}
                  {mouthState === "open" && (
                    <div className="w-full h-[12px] rounded-full overflow-hidden">
                      <div className="w-full h-full bg-[#CC6D5D] rounded-t-full"></div>
                      <div className="w-full h-[60%] bg-[#9E372A] rounded-b-full"></div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 