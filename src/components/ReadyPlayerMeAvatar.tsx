import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ReadyPlayerMeAvatarProps {
  className?: string;
  onAvatarCreated?: (url: string) => void;
  text?: string;
  isActive?: boolean;
}

export function ReadyPlayerMeAvatar({ 
  className, 
  onAvatarCreated, 
  text, 
  isActive = false 
}: ReadyPlayerMeAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string>('https://models.readyplayer.me/649164bc421a4c755a0f5941.glb');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set up RPM iframe
  useEffect(() => {
    if (!containerRef.current) return;

    const iframe = document.createElement('iframe');
    iframe.id = 'rpm-avatar-creator';
    iframe.src = 'https://demo.readyplayer.me/avatar?frameApi&bodyType=fullbody';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    containerRef.current.appendChild(iframe);
    iframeRef.current = iframe;

    // Set up the message listener
    const handleMessage = (event: MessageEvent) => {
      if (event.data.source !== 'readyplayerme') return;
      
      // Handle avatar export
      if (event.data.eventName === 'v1.avatar.exported') {
        const url = event.data.data.url;
        setAvatarUrl(url);
        if (onAvatarCreated) {
          onAvatarCreated(url);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (containerRef.current && iframeRef.current) {
        containerRef.current.removeChild(iframeRef.current);
      }
    };
  }, [onAvatarCreated]);

  return (
    <div className={cn("w-full h-full relative", className)}>
      {/* Avatar Creator Container */}
      <div ref={containerRef} className="w-full h-full relative">
        {/* Embed Ready Player Me viewer for the created avatar */}
        {avatarUrl && (
          <iframe 
            src={`https://models.readyplayer.me/viewer.html?m=${avatarUrl}`}
            className="w-full h-full absolute inset-0 border-0 rounded-xl shadow-lg"
            title="Ready Player Me Avatar"
          />
        )}
      </div>
    </div>
  );
} 