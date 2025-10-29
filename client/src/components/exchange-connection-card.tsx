import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { SiBinance, SiCoinbase } from "react-icons/si";

interface ExchangeConnectionCardProps {
  exchange: "Binance" | "Coinbase" | "KuCoin";
  connected: boolean;
}

export function ExchangeConnectionCard({ exchange, connected: initialConnected }: ExchangeConnectionCardProps) {
  const [connected, setConnected] = useState(initialConnected);
  const [showForm, setShowForm] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  
  const icons = {
    Binance: SiBinance,
    Coinbase: SiCoinbase,
    KuCoin: () => <div className="text-xl font-bold">K</div>,
  };
  
  const Icon = icons[exchange];
  
  const handleConnect = () => {
    console.log("Connecting to", exchange, { apiKey, apiSecret });
    setConnected(true);
    setShowForm(false);
    setApiKey("");
    setApiSecret("");
  };
  
  const handleDisconnect = () => {
    console.log("Disconnecting from", exchange);
    setConnected(false);
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
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
      </div>
      
      {!connected && !showForm && (
        <Button 
          className="w-full" 
          onClick={() => setShowForm(true)}
          data-testid={`button-connect-${exchange.toLowerCase()}`}
        >
          Connect {exchange}
        </Button>
      )}
      
      {!connected && showForm && (
        <div className="space-y-4">
          <div>
            <Label htmlFor={`${exchange}-api-key`}>API Key</Label>
            <Input
              id={`${exchange}-api-key`}
              type="text"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              data-testid={`input-${exchange.toLowerCase()}-api-key`}
            />
          </div>
          <div>
            <Label htmlFor={`${exchange}-api-secret`}>API Secret</Label>
            <Input
              id={`${exchange}-api-secret`}
              type="password"
              placeholder="Enter your API secret"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              data-testid={`input-${exchange.toLowerCase()}-api-secret`}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={handleConnect}
              data-testid={`button-save-${exchange.toLowerCase()}`}
            >
              Save Connection
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowForm(false)}
              data-testid={`button-cancel-${exchange.toLowerCase()}`}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {connected && (
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleDisconnect}
          data-testid={`button-disconnect-${exchange.toLowerCase()}`}
        >
          Disconnect
        </Button>
      )}
    </Card>
  );
}
