import { useWebSocket } from '@/contexts/WebSocketContext';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff } from 'lucide-react';

export function RealtimeIndicator() {
  const { isConnected } = useWebSocket();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex">
          <Badge 
            variant="outline" 
            className={`gap-1 cursor-default ${isConnected ? 'text-green-600 border-green-500/20' : 'text-muted-foreground border-muted'}`}
            data-testid="realtime-indicator"
          >
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                <span className="text-xs">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                <span className="text-xs">Offline</span>
              </>
            )}
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {isConnected 
          ? 'Connected - Receiving real-time updates'
          : 'Disconnected - Reconnecting...'
        }
      </TooltipContent>
    </Tooltip>
  );
}
