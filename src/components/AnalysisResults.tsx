import { CheckCircle2, Clock, Lightbulb, Users, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AnalysisData {
  tasks: Array<{ task: string; assignee?: string; priority?: string }>;
  deadlines: Array<{ deadline: string; description: string; date?: string }>;
  decisions: Array<{ decision: string; context?: string }>;
  responsibilities: Array<{ person: string; responsibility: string }>;
  summary?: string;
}

interface AnalysisResultsProps {
  results: AnalysisData;
  chatFileName: string;
}

export const AnalysisResults = ({ results, chatFileName }: AnalysisResultsProps) => {
  const handleExport = () => {
    const exportContent = `
WhatsApp Chat Analysis - ${chatFileName}
Generated on: ${new Date().toLocaleString()}

${results.summary ? `SUMMARY:\n${results.summary}\n\n` : ''}

TASKS IDENTIFIED (${results.tasks.length}):
${results.tasks.map((t, i) => `${i + 1}. ${t.task}${t.assignee ? ` - Assigned to: ${t.assignee}` : ''}${t.priority ? ` [${t.priority}]` : ''}`).join('\n')}

DEADLINES (${results.deadlines.length}):
${results.deadlines.map((d, i) => `${i + 1}. ${d.deadline}${d.date ? ` - Date: ${d.date}` : ''}${d.description ? `\n   ${d.description}` : ''}`).join('\n')}

DECISIONS MADE (${results.decisions.length}):
${results.decisions.map((d, i) => `${i + 1}. ${d.decision}${d.context ? `\n   Context: ${d.context}` : ''}`).join('\n')}

RESPONSIBILITIES (${results.responsibilities.length}):
${results.responsibilities.map((r, i) => `${i + 1}. ${r.person}: ${r.responsibility}`).join('\n')}
    `.trim();

    const blob = new Blob([exportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis-${chatFileName.replace('.txt', '')}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analysis Results</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Extracted from {chatFileName}
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Summary
        </Button>
      </div>

      {results.summary && (
        <Card className="shadow-card border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-primary" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{results.summary}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              Tasks ({results.tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.tasks.length > 0 ? (
              <ul className="space-y-3">
                {results.tasks.map((task, idx) => (
                  <li key={idx} className="border-l-2 border-accent pl-3 py-1">
                    <p className="text-foreground">{task.task}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {task.assignee && (
                        <Badge variant="secondary" className="text-xs">
                          {task.assignee}
                        </Badge>
                      )}
                      {task.priority && (
                        <Badge variant="outline" className="text-xs">
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No tasks identified</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-destructive" />
              Deadlines ({results.deadlines.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.deadlines.length > 0 ? (
              <ul className="space-y-3">
                {results.deadlines.map((deadline, idx) => (
                  <li key={idx} className="border-l-2 border-destructive pl-3 py-1">
                    <p className="text-foreground font-medium">{deadline.deadline}</p>
                    {deadline.date && (
                      <p className="text-sm text-muted-foreground mt-1">{deadline.date}</p>
                    )}
                    {deadline.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {deadline.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No deadlines identified</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-primary" />
              Decisions ({results.decisions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.decisions.length > 0 ? (
              <ul className="space-y-3">
                {results.decisions.map((decision, idx) => (
                  <li key={idx} className="border-l-2 border-primary pl-3 py-1">
                    <p className="text-foreground">{decision.decision}</p>
                    {decision.context && (
                      <p className="text-sm text-muted-foreground mt-1">{decision.context}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No decisions identified</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-accent" />
              Responsibilities ({results.responsibilities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.responsibilities.length > 0 ? (
              <ul className="space-y-3">
                {results.responsibilities.map((resp, idx) => (
                  <li key={idx} className="border-l-2 border-accent pl-3 py-1">
                    <p className="text-foreground">
                      <span className="font-medium">{resp.person}:</span> {resp.responsibility}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No responsibilities identified</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
