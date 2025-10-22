import { Card } from "@/components/ui/card";
import { CodeBlock } from "./CodeBlock";
import { Badge } from "@/components/ui/badge";

interface ServerCardProps {
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Advanced";
  code: string;
  steps: string[];
}

export const ServerCard = ({ title, description, difficulty, code, steps }: ServerCardProps) => {
  const difficultyColors = {
    Easy: "bg-green-500/10 text-green-400 hover:bg-green-500/20",
    Medium: "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20",
    Advanced: "bg-red-500/10 text-red-400 hover:bg-red-500/20",
  };

  return (
    <Card className="p-6 hover:border-primary/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {title}
          </h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Badge className={difficultyColors[difficulty]}>{difficulty}</Badge>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-semibold mb-3">Code Example</h4>
          <CodeBlock code={code} />
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-3">Implementation Steps</h4>
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold">
                  {index + 1}
                </span>
                <span className="text-muted-foreground pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  );
};
