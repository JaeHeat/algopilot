import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentForm } from "./payment-form";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscriptionPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientSecret: string;
  amount: string;
  botName: string;
  onSuccess: () => void;
}

export function SubscriptionPaymentDialog({
  open,
  onOpenChange,
  clientSecret,
  amount,
  botName,
  onSuccess,
}: SubscriptionPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clientSecret && open) {
      setIsLoading(false);
    }
  }, [clientSecret, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-payment">
        <DialogHeader>
          <DialogTitle>Complete Your Subscription</DialogTitle>
          <DialogDescription>
            Subscribe to {botName} for ${amount}/month
          </DialogDescription>
        </DialogHeader>

        {isLoading || !clientSecret ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: 'hsl(217, 91%, 60%)',
                },
              },
            }}
          >
            <PaymentForm
              onSuccess={onSuccess}
              onCancel={() => onOpenChange(false)}
              amount={amount}
              botName={botName}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
