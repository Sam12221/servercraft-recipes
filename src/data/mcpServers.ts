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
  {
    title: "Email Sender MCP Server",
    description: "Send emails using SMTP with support for attachments and HTML templates.",
    difficulty: "Easy" as const,
    code: `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const server = new Server(
  {
    name: "email-server",
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
        name: "send_email",
        description: "Send an email",
        inputSchema: {
          type: "object",
          properties: {
            to: { type: "string" },
            subject: { type: "string" },
            body: { type: "string" },
            html: { type: "boolean" },
          },
          required: ["to", "subject", "body"],
        },
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "send_email") {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: args.to,
        subject: args.subject,
        text: args.html ? undefined : args.body,
        html: args.html ? args.body : undefined,
      });

      return {
        content: [
          {
            type: "text",
            text: "Email sent successfully!",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: \`Failed to send email: \${error.message}\`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(\`Unknown tool: \${name}\`);
});

const transport = new StdioServerTransport();
await server.connect(transport);`,
    steps: [
      "Install nodemailer: npm install @modelcontextprotocol/sdk nodemailer",
      "Set up environment variables for SMTP credentials",
      "Create the email transporter with your SMTP settings",
      "Define the send_email tool with required fields",
      "Implement error handling for failed emails",
      "Test with a real email address",
    ],
  },
  {
    title: "Slack Bot MCP Server",
    description: "Post messages and interact with Slack channels using the Slack API.",
    difficulty: "Medium" as const,
    code: `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WebClient } from "@slack/web-api";

const slack = new WebClient(process.env.SLACK_TOKEN);

const server = new Server(
  {
    name: "slack-server",
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
        name: "post_message",
        description: "Post a message to a Slack channel",
        inputSchema: {
          type: "object",
          properties: {
            channel: { type: "string" },
            text: { type: "string" },
          },
          required: ["channel", "text"],
        },
      },
      {
        name: "list_channels",
        description: "List all available channels",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "post_message") {
      const result = await slack.chat.postMessage({
        channel: args.channel,
        text: args.text,
      });

      return {
        content: [
          {
            type: "text",
            text: \`Message posted to \${args.channel}\`,
          },
        ],
      };
    }

    if (name === "list_channels") {
      const result = await slack.conversations.list();
      const channels = result.channels.map((c) => c.name).join("\\n");

      return {
        content: [
          {
            type: "text",
            text: channels,
          },
        ],
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: \`Slack error: \${error.message}\`,
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
      "Install Slack SDK: npm install @modelcontextprotocol/sdk @slack/web-api",
      "Create a Slack app and get your bot token",
      "Add the token to your environment variables",
      "Initialize the Slack WebClient",
      "Implement message posting and channel listing",
      "Test by posting to a test channel",
    ],
  },
  {
    title: "Weather API MCP Server",
    description: "Fetch weather data from OpenWeatherMap API with location search.",
    difficulty: "Easy" as const,
    code: `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  {
    name: "weather-server",
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
        name: "get_weather",
        description: "Get current weather for a city",
        inputSchema: {
          type: "object",
          properties: {
            city: { type: "string" },
            units: { type: "string", enum: ["metric", "imperial"] },
          },
          required: ["city"],
        },
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "get_weather") {
    const units = args.units || "metric";
    const url = \`https://api.openweathermap.org/data/2.5/weather?q=\${args.city}&units=\${units}&appid=\${process.env.OPENWEATHER_API_KEY}\`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.cod !== 200) {
        throw new Error(data.message);
      }

      const weather = {
        city: data.name,
        temperature: data.main.temp,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(weather, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: \`Weather API error: \${error.message}\`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(\`Unknown tool: \${name}\`);
});

const transport = new StdioServerTransport();
await server.connect(transport);`,
    steps: [
      "Sign up for a free OpenWeatherMap API key",
      "Install the MCP SDK: npm install @modelcontextprotocol/sdk",
      "Add your API key to environment variables",
      "Create the server and define the get_weather tool",
      "Fetch and parse weather data from the API",
      "Test with different cities and units",
    ],
  },
  {
    title: "Image Processor MCP Server",
    description: "Resize, compress, and convert images using Sharp library.",
    difficulty: "Medium" as const,
    code: `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import sharp from "sharp";
import fs from "fs/promises";

const server = new Server(
  {
    name: "image-processor-server",
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
        name: "resize_image",
        description: "Resize an image",
        inputSchema: {
          type: "object",
          properties: {
            input: { type: "string" },
            output: { type: "string" },
            width: { type: "number" },
            height: { type: "number" },
          },
          required: ["input", "output", "width", "height"],
        },
      },
      {
        name: "convert_format",
        description: "Convert image to different format",
        inputSchema: {
          type: "object",
          properties: {
            input: { type: "string" },
            output: { type: "string" },
            format: { type: "string", enum: ["jpeg", "png", "webp"] },
          },
          required: ["input", "output", "format"],
        },
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "resize_image") {
      await sharp(args.input)
        .resize(args.width, args.height)
        .toFile(args.output);

      return {
        content: [
          {
            type: "text",
            text: \`Image resized to \${args.width}x\${args.height}\`,
          },
        ],
      };
    }

    if (name === "convert_format") {
      await sharp(args.input)
        .toFormat(args.format)
        .toFile(args.output);

      return {
        content: [
          {
            type: "text",
            text: \`Image converted to \${args.format}\`,
          },
        ],
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: \`Image processing error: \${error.message}\`,
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
      "Install Sharp: npm install @modelcontextprotocol/sdk sharp",
      "Create server with image processing tools",
      "Implement resize functionality with width/height",
      "Add format conversion (JPEG, PNG, WebP)",
      "Handle file I/O errors gracefully",
      "Test with various image sizes and formats",
    ],
  },
  {
    title: "Git Operations MCP Server",
    description: "Perform Git operations like clone, commit, push, and branch management.",
    difficulty: "Advanced" as const,
    code: `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import simpleGit from "simple-git";

const server = new Server(
  {
    name: "git-server",
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
        name: "git_status",
        description: "Get git repository status",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string" },
          },
          required: ["path"],
        },
      },
      {
        name: "git_commit",
        description: "Commit changes",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string" },
            message: { type: "string" },
          },
          required: ["path", "message"],
        },
      },
      {
        name: "git_push",
        description: "Push to remote repository",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string" },
          },
          required: ["path"],
        },
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;
  const git = simpleGit(args.path);

  try {
    if (name === "git_status") {
      const status = await git.status();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }

    if (name === "git_commit") {
      await git.add(".");
      const result = await git.commit(args.message);
      return {
        content: [
          {
            type: "text",
            text: \`Committed: \${result.commit}\`,
          },
        ],
      };
    }

    if (name === "git_push") {
      await git.push();
      return {
        content: [
          {
            type: "text",
            text: "Pushed to remote successfully",
          },
        ],
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: \`Git error: \${error.message}\`,
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
      "Install simple-git: npm install @modelcontextprotocol/sdk simple-git",
      "Create server with Git operation tools",
      "Implement status, commit, and push functionality",
      "Add proper error handling for Git failures",
      "Handle authentication for remote operations",
      "Test with a real Git repository",
      "Consider adding branch management tools",
    ],
  },
  {
    title: "PDF Generator MCP Server",
    description: "Generate PDF documents from HTML content with custom styling.",
    difficulty: "Medium" as const,
    code: `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import puppeteer from "puppeteer";

const server = new Server(
  {
    name: "pdf-server",
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
        name: "generate_pdf",
        description: "Generate PDF from HTML",
        inputSchema: {
          type: "object",
          properties: {
            html: { type: "string" },
            output: { type: "string" },
            format: { type: "string", enum: ["A4", "Letter"] },
          },
          required: ["html", "output"],
        },
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "generate_pdf") {
    try {
      if (!browser) {
        browser = await puppeteer.launch({ headless: true });
      }

      const page = await browser.newPage();
      await page.setContent(args.html);
      
      await page.pdf({
        path: args.output,
        format: args.format || "A4",
        printBackground: true,
      });

      await page.close();

      return {
        content: [
          {
            type: "text",
            text: \`PDF generated: \${args.output}\`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: \`PDF generation error: \${error.message}\`,
          },
        ],
        isError: true,
      };
    }
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
      "Install Puppeteer: npm install @modelcontextprotocol/sdk puppeteer",
      "Create server with PDF generation tool",
      "Launch headless browser instance",
      "Convert HTML content to PDF format",
      "Add support for different page formats",
      "Clean up browser resources on exit",
      "Test with various HTML templates",
    ],
  },
  {
    title: "Translation MCP Server",
    description: "Translate text between multiple languages using translation APIs.",
    difficulty: "Easy" as const,
    code: `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  {
    name: "translation-server",
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
        name: "translate",
        description: "Translate text to another language",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string" },
            from: { type: "string" },
            to: { type: "string" },
          },
          required: ["text", "to"],
        },
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "translate") {
    const url = \`https://api.mymemory.translated.net/get?q=\${encodeURIComponent(
      args.text
    )}&langpair=\${args.from || "en"}|\${args.to}\`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: data.responseData.translatedText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: \`Translation error: \${error.message}\`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(\`Unknown tool: \${name}\`);
});

const transport = new StdioServerTransport();
await server.connect(transport);`,
    steps: [
      "Install MCP SDK: npm install @modelcontextprotocol/sdk",
      "Choose a translation API (MyMemory API is free)",
      "Create the translate tool with language parameters",
      "Format the API request with proper encoding",
      "Parse and return translated text",
      "Test with multiple language pairs",
    ],
  },
  {
    title: "Calendar MCP Server",
    description: "Manage calendar events with Google Calendar API integration.",
    difficulty: "Advanced" as const,
    code: `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { google } from "googleapis";

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

auth.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: "v3", auth });

const server = new Server(
  {
    name: "calendar-server",
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
        name: "create_event",
        description: "Create a calendar event",
        inputSchema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            start: { type: "string" },
            end: { type: "string" },
            description: { type: "string" },
          },
          required: ["summary", "start", "end"],
        },
      },
      {
        name: "list_events",
        description: "List upcoming events",
        inputSchema: {
          type: "object",
          properties: {
            maxResults: { type: "number" },
          },
        },
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "create_event") {
      const event = {
        summary: args.summary,
        description: args.description,
        start: { dateTime: args.start },
        end: { dateTime: args.end },
      };

      const result = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });

      return {
        content: [
          {
            type: "text",
            text: \`Event created: \${result.data.htmlLink}\`,
          },
        ],
      };
    }

    if (name === "list_events") {
      const result = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: args.maxResults || 10,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = result.data.items.map(
        (e) => \`\${e.summary} - \${e.start.dateTime}\`
      );

      return {
        content: [
          {
            type: "text",
            text: events.join("\\n"),
          },
        ],
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: \`Calendar error: \${error.message}\`,
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
      "Install Google APIs: npm install @modelcontextprotocol/sdk googleapis",
      "Set up Google Cloud project and enable Calendar API",
      "Create OAuth2 credentials and get refresh token",
      "Configure authentication with environment variables",
      "Implement create and list event tools",
      "Handle date/time formatting correctly",
      "Test creating and listing events",
    ],
  },
];
