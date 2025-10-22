export const mcpServers = [
  {
    title: "File System MCP Server",
    description: "A simple MCP server that provides file system operations like read, write, and list files.",
    difficulty: "Easy" as const,
    code: `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs/promises";
import path from "path";

const server = new Server(
  {
    name: "filesystem-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "read_file",
        description: "Read contents of a file",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string" },
          },
          required: ["path"],
        },
      },
      {
        name: "write_file",
        description: "Write content to a file",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string" },
            content: { type: "string" },
          },
          required: ["path", "content"],
        },
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "read_file") {
    const content = await fs.readFile(args.path, "utf-8");
    return { content: [{ type: "text", text: content }] };
  }

  if (name === "write_file") {
    await fs.writeFile(args.path, args.content);
    return { content: [{ type: "text", text: "File written successfully" }] };
  }

  throw new Error(\`Unknown tool: \${name}\`);
});

const transport = new StdioServerTransport();
await server.connect(transport);`,
    steps: [
      "Install MCP SDK: npm install @modelcontextprotocol/sdk",
      "Create a new TypeScript file for your server",
      "Initialize the Server instance with name and capabilities",
      "Implement the tools/list handler to define available tools",
      "Implement the tools/call handler to execute tool operations",
      "Set up the transport layer (stdio, SSE, or custom)",
      "Connect the server to the transport and start listening",
    ],
  },
  {
    title: "Database Query MCP Server",
    description: "Build an MCP server that executes SQL queries against a PostgreSQL database with proper error handling.",
    difficulty: "Medium" as const,
    code: `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const server = new Server(
  {
    name: "database-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "execute_query",
        description: "Execute a SQL query",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            params: { type: "array", items: { type: "string" } },
          },
          required: ["query"],
        },
      },
      {
        name: "list_tables",
        description: "List all tables in the database",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "execute_query") {
      const result = await pool.query(args.query, args.params || []);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.rows, null, 2),
          },
        ],
      };
    }

    if (name === "list_tables") {
      const result = await pool.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
      );
      return {
        content: [
          {
            type: "text",
            text: result.rows.map((r) => r.tablename).join("\\n"),
          },
        ],
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: \`Error: \${error.message}\`,
        },
      ],
      isError: true,
    };
  }

  throw new Error(\`Unknown tool: \${name}\`);
});

const transport = new StdioServerTransport();
await server.connect(transport);`,
    steps: [
      "Install dependencies: npm install @modelcontextprotocol/sdk pg",
      "Set up database connection with proper credentials",
      "Create the Server instance with tools and resources capabilities",
      "Define database operation tools (query, list tables, etc.)",
      "Implement proper error handling and parameter sanitization",
      "Add query result formatting for better readability",
      "Test with various SQL queries and edge cases",
      "Consider implementing connection pooling for performance",
    ],
  },
  {
    title: "API Gateway MCP Server",
    description: "An advanced MCP server that acts as a gateway to external REST APIs with authentication, caching, and rate limiting.",
    difficulty: "Advanced" as const,
    code: `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";
import { LRUCache } from "lru-cache";
import { RateLimiter } from "limiter";

const cache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes
});

const limiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: "minute",
});

const server = new Server(
  {
    name: "api-gateway-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "api_request",
        description: "Make an authenticated API request",
        inputSchema: {
          type: "object",
          properties: {
            endpoint: { type: "string" },
            method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE"] },
            body: { type: "object" },
            headers: { type: "object" },
          },
          required: ["endpoint", "method"],
        },
      },
    ],
  };
});

server.setRequestHandler("resources/list", async () => {
  return {
    resources: [
      {
        uri: "cache://stats",
        name: "Cache Statistics",
        mimeType: "application/json",
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "api_request") {
    // Rate limiting
    await limiter.removeTokens(1);

    // Check cache
    const cacheKey = \`\${args.method}:\${args.endpoint}\`;
    const cached = cache.get(cacheKey);
    if (cached && args.method === "GET") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(cached, null, 2),
          },
        ],
      };
    }

    try {
      // Make API request with authentication
      const response = await axios({
        method: args.method,
        url: args.endpoint,
        data: args.body,
        headers: {
          Authorization: \`Bearer \${process.env.API_TOKEN}\`,
          ...args.headers,
        },
      });

      // Cache GET requests
      if (args.method === "GET") {
        cache.set(cacheKey, response.data);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: \`API Error: \${error.response?.data || error.message}\`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(\`Unknown tool: \${name}\`);
});

server.setRequestHandler("resources/read", async (request) => {
  if (request.params.uri === "cache://stats") {
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify({
            size: cache.size,
            max: cache.max,
            calculatedSize: cache.calculatedSize,
          }),
        },
      ],
    };
  }

  throw new Error("Resource not found");
});

const transport = new StdioServerTransport();
await server.connect(transport);`,
    steps: [
      "Install all dependencies: npm install @modelcontextprotocol/sdk axios lru-cache limiter",
      "Set up rate limiting to prevent API abuse",
      "Implement LRU cache for frequently accessed endpoints",
      "Create the Server with all three capabilities (tools, resources, prompts)",
      "Implement the api_request tool with proper authentication",
      "Add comprehensive error handling for network failures",
      "Implement the resources endpoint for cache statistics",
      "Add request/response logging for debugging",
      "Test with various API endpoints and error scenarios",
      "Consider implementing retry logic with exponential backoff",
      "Add request validation and sanitization",
      "Document API endpoint requirements and authentication setup",
    ],
  },
  {
    title: "Web Scraper MCP Server",
    description: "Create an MCP server that scrapes web content with support for dynamic JavaScript rendering and data extraction.",
    difficulty: "Medium" as const,
    code: `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

const server = new Server(
  {
    name: "webscraper-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let browser;

server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "scrape_static",
        description: "Scrape static HTML content",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
            selector: { type: "string" },
          },
          required: ["url"],
        },
      },
      {
        name: "scrape_dynamic",
        description: "Scrape dynamic JavaScript-rendered content",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
            selector: { type: "string" },
            waitFor: { type: "number" },
          },
          required: ["url"],
        },
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "scrape_static") {
    const response = await fetch(args.url);
    const html = await response.text();
    const $ = cheerio.load(html);

    let result;
    if (args.selector) {
      result = $(args.selector)
        .map((_, el) => $(el).text().trim())
        .get();
    } else {
      result = $("body").text().trim();
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  if (name === "scrape_dynamic") {
    if (!browser) {
      browser = await puppeteer.launch({ headless: true });
    }

    const page = await browser.newPage();
    await page.goto(args.url, { waitUntil: "networkidle0" });

    if (args.waitFor) {
      await page.waitForTimeout(args.waitFor);
    }

    let result;
    if (args.selector) {
      result = await page.$$eval(args.selector, (elements) =>
        elements.map((el) => el.textContent?.trim())
      );
    } else {
      result = await page.evaluate(() => document.body.innerText);
    }

    await page.close();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  throw new Error(\`Unknown tool: \${name}\`);
});

const transport = new StdioServerTransport();
await server.connect(transport);

process.on("SIGINT", async () => {
  if (browser) await browser.close();
  process.exit(0);
});`,
    steps: [
      "Install dependencies: npm install @modelcontextprotocol/sdk puppeteer cheerio",
      "Create Server instance with scraping tools",
      "Implement static scraping using Cheerio for simple HTML",
      "Add dynamic scraping with Puppeteer for JavaScript-heavy sites",
      "Handle different CSS selectors for targeted data extraction",
      "Add proper resource cleanup (close browser on exit)",
      "Implement rate limiting to be respectful to target websites",
      "Test with both static and dynamic websites",
    ],
  },
];
