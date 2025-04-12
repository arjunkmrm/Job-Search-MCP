import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import scrapeLinkedInJobs from "./scrapeLinkedInJobs.js";

// Create an MCP server
const server = new McpServer({
  name: "Jb Circular MCP",
  version: "1.0.0",
});

const jobCircularTool = async (jobTitle, location, datePosted) => {
  const jobCirculars = await scrapeLinkedInJobs({
    jobTitle,
    location,
    datePosted,
    pages: 1,
  });
  return JSON.stringify(jobCirculars);
};

// Add an addition tool
server.tool("jobCircularTool", { jobTitle: z.string(), location: z.string(), datePosted: z.string() }, async ({ jobTitle, location, datePosted }) => ({
  content: [{ type: "text", text:  jobCircularTool(jobTitle, location, datePosted) }],
}));

// Add a dynamic greeting resource
server.resource(
  "getJobsCirculars",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [
      {
        uri: uri.href,
        text: `Hello, ${name}!`,
      },
    ],
  })
);

// Start receiving messages on stdin and sending messages on stdout

async function init() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

init();
