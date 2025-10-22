import { Card } from "@/components/ui/card";
import { BookOpen, Code, Play, Wrench } from "lucide-react";

export const GettingStarted = () => {
  return (
    <div className="mb-16">
      <h2 className="text-3xl font-bold mb-8 text-center">
        <span className="gradient-text">How to Build MCP Servers</span>
      </h2>
      <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
        Think of MCP servers like LEGO blocks for AI. They help AI assistants (like Claude) do cool things like read files, 
        send emails, or check the weather. Here's how to build your own!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Card className="p-6 card-gradient border-primary/20 hover:scale-105 transition-transform duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">1. What is MCP?</h3>
              <p className="text-muted-foreground">
                MCP stands for "Model Context Protocol". It's like a translator that lets AI talk to different programs. 
                Imagine your AI wants to save a file - MCP is the bridge that makes it happen!
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 card-gradient border-primary/20 hover:scale-105 transition-transform duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Code className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">2. Writing the Code</h3>
              <p className="text-muted-foreground">
                You write code in TypeScript (a type of JavaScript). Copy one of our examples below, change what you need, 
                and save it as a .ts file. It's like following a recipe - just swap ingredients!
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 card-gradient border-primary/20 hover:scale-105 transition-transform duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">3. Installing Tools</h3>
              <p className="text-muted-foreground">
                Before running your server, install the needed tools using npm (Node Package Manager). 
                It's like downloading apps on your phone - type "npm install [package-name]" in your terminal!
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 card-gradient border-primary/20 hover:scale-105 transition-transform duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Play className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">4. Running Your Server</h3>
              <p className="text-muted-foreground">
                Run your server by typing "node your-file.js" in the terminal. Your MCP server is now running and ready 
                to help AI do amazing things. Connect it to Claude Desktop to see the magic!
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-muted/30 border border-primary/20 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Quick Start Checklist ✓</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="text-primary">→</span> Install Node.js from nodejs.org (if you don't have it)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">→</span> Create a new folder for your project
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">→</span> Open terminal and run: npm init -y
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">→</span> Copy a code example from below and save it as server.ts
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">→</span> Install dependencies: npm install @modelcontextprotocol/sdk
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">→</span> Compile TypeScript: npx tsc server.ts
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">→</span> Run your server: node server.js
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">→</span> Connect to Claude Desktop in settings
          </li>
        </ul>
      </div>
    </div>
  );
};
