import { ServerCard } from "@/components/ServerCard";
import { mcpServers } from "@/data/mcpServers";
import { Code2, Sparkles, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Code2 className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                MCP Server Builder
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Ready-to-use code snippets and step-by-step guides for building Model Context Protocol servers
            </p>
            <div className="flex items-center justify-center gap-8 pt-8">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Fast Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-secondary" />
                <span className="text-sm text-muted-foreground">Production Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <span className="text-sm text-muted-foreground">Best Practices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servers Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Server Examples</h2>
            <p className="text-muted-foreground text-lg">
              Choose a template and start building your MCP server in minutes
            </p>
          </div>

          <div className="grid gap-8">
            {mcpServers.map((server, index) => (
              <div
                key={index}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ServerCard {...server} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>Built for developers building with Model Context Protocol</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
