import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = "Analyzing chat..." }: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-20 animate-pulse" />
        <Loader2 className="h-12 w-12 text-primary animate-spin relative" />
      </div>
      <p className="text-lg font-medium text-foreground">{message}</p>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        Our AI is processing your chat messages and extracting key insights...
      </p>
    </div>
  );
};
