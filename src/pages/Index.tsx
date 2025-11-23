import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/FileUpload";
import { DateRangeSelector } from "@/components/DateRangeSelector";
import { AnalysisResults } from "@/components/AnalysisResults";
import { LoadingState } from "@/components/LoadingState";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import {
  parseWhatsAppChat,
  filterMessagesByDateRange,
  formatChatForAnalysis,
} from "@/lib/chatParser";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setAnalysisResults(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a WhatsApp chat file first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResults(null);

    try {
      // Read file content
      const fileContent = await selectedFile.text();

      // Parse WhatsApp chat
      const messages = parseWhatsAppChat(fileContent);

      if (messages.length === 0) {
        toast({
          title: "No messages found",
          description: "The file doesn't contain valid WhatsApp messages.",
          variant: "destructive",
        });
        setIsAnalyzing(false);
        return;
      }

      // Filter by date range if specified
      const filteredMessages = filterMessagesByDateRange(
        messages,
        dateRange?.from,
        dateRange?.to
      );

      if (filteredMessages.length === 0) {
        toast({
          title: "No messages in date range",
          description: "No messages found within the selected date range.",
          variant: "destructive",
        });
        setIsAnalyzing(false);
        return;
      }

      // Format for analysis
      const chatContent = formatChatForAnalysis(filteredMessages);

      // Call edge function for AI analysis
      const { data, error } = await supabase.functions.invoke('analyze-chat', {
        body: { chatContent },
      });

      if (error) {
        console.error('Analysis error:', error);
        toast({
          title: "Analysis failed",
          description: error.message || "Failed to analyze chat. Please try again.",
          variant: "destructive",
        });
        setIsAnalyzing(false);
        return;
      }

      setAnalysisResults(data);
      toast({
        title: "Analysis complete!",
        description: `Extracted insights from ${filteredMessages.length} messages.`,
      });
    } catch (error) {
      console.error('Error analyzing chat:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <img 
              src="/logo.png"
              alt="App Logo"
              className="h-auto w-10"

            />
          </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">WhatsApp Chat Analyzer</h1>
              <p className="text-sm text-muted-foreground">
                Transform messy chats into organized insights
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {!analysisResults ? (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4 py-8">
              <h2 className="text-4xl font-bold text-foreground">
                Extract Project Insights from Your Chats
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload your WhatsApp group chat export and let AI identify tasks, deadlines,
                decisions, and responsibilities automatically.
              </p>
            </div>

            {/* Upload Section */}
            <div className="space-y-6">
              <FileUpload onFileSelect={handleFileSelect} />

              {selectedFile && (
                <div className="space-y-6 animate-slide-up">
                  <DateRangeSelector
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                  />

                  <div className="flex justify-center">
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      size="lg"
                      className="bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8 py-6"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze Chat"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {isAnalyzing && <LoadingState />}

            {/* Features */}
            {!isAnalyzing && (
              <div className="grid md:grid-cols-4 gap-6 pt-8">
                {[
                  {
                    title: "Tasks",
                    description: "Identify action items and assignments",
                    icon: "✓",
                  },
                  {
                    title: "Deadlines",
                    description: "Extract time-sensitive information",
                    icon: "⏰",
                  },
                  {
                    title: "Decisions",
                    description: "Capture key agreements made",
                    icon: "💡",
                  },
                  {
                    title: "Responsibilities",
                    description: "Map who's doing what",
                    icon: "👥",
                  },
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-lg border border-border bg-card shadow-card hover:shadow-lg transition-shadow"
                  >
                    <div className="text-3xl mb-3">{feature.icon}</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <Button
              variant="outline"
              onClick={() => {
                setAnalysisResults(null);
                setSelectedFile(null);
                setDateRange(undefined);
              }}
            >
              ← Analyze Another Chat
            </Button>
            <AnalysisResults
              results={analysisResults}
              chatFileName={selectedFile?.name || "chat"}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} WhatsApp Chat Analyzer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
