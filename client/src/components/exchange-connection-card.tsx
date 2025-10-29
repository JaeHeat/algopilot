import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { SiBinance, SiCoinbase } from "react-icons/si";

interface ExchangeConnectionCardProps {
  exchange: string;
  connected: boolean;
  onDisconnect?: () => void;
}

export function ExchangeConnectionCard({ exchange, connected, onDisconnect }: ExchangeConnectionCardProps) {
  const icons: Record<string, any> = {
    Binance: SiBinance,
    Coinbase: SiCoinbase,
    Bybit: () => <div className="text-xl font-bold">B</div>,
    KuCoin: () => <div className="text-xl font-bold">K</div>,
  };
  
  const Icon = icons[exchange] || (() => <div className="text-xl font-bold">{exchange[0]}</div>);
  
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{exchange}</h3>
            <p className="text-sm text-muted-foreground">
              {connected ? "Active connection" : "Not connected"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Disconnected
              </>
            )}
          </Badge>
          {connected && onDisconnect && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onDisconnect}
              data-testid={`button-disconnect-${exchange.toLowerCase()}`}
            >
              Disconnect
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
