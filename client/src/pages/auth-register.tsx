import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { register as registerUser, type RegisterData } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await registerUser(data);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Account created!",
        description: "Welcome to AlgoPilot. Let's get started.",
      });

      setLocation("/dashboard");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold tracking-tight text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-center">
            Get started with AlgoPilot today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  data-testid="input-first-name"
                  {...form.register("firstName")}
                  disabled={isLoading}
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  data-testid="input-last-name"
                  {...form.register("lastName")}
                  disabled={isLoading}
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                data-testid="input-email"
                {...form.register("email")}
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                data-testid="input-password"
                {...form.register("password")}
                disabled={isLoading}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-register"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => setLocation("/auth/login")}
              className="text-primary hover:underline font-medium"
              data-testid="link-login"
            >
              Sign in
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
