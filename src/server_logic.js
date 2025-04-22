import {
  McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import scrapeLinkedInJobs from "./utils/scrapeLinkedInJobs.js";

// Create an MCP server
export const server = new McpServer({
  name: "Job Search MCP",
  version: "1.0.0",
});

const jobCircular = async (jobTitle, location, datePosted) => {
  const jobCirculars = await scrapeLinkedInJobs({
    jobTitle,
    location,
    datePosted,
    pages: 1,
  });
  return JSON.stringify(jobCirculars);
};

// Add an addition tool
const jobCircularSchema = {
  jobTitle: z.string().describe("The title of the job, such as 'Frontend Developer' or 'Software Engineer'."),
  location: z.string().describe("The city, region, or country where the job is located, e.g., 'New York, NY' or 'Remote'."),
  datePosted: z.string().describe(
    "The timeframe in which the job was posted. Use shortcuts like:\n" +
    "for last 24 hours → r86400\n" +
    "for last 3 days → r259200\n" +
    "for last 7 days → r604800\n" +
    "for last 14 days → r1209600\n" +
    "for last 30 days → r2592000"
  ),
};

// Use the schema in the tool definition
server.tool(
  "jobCircularTool",
  "Get Job Circulars",
  jobCircularSchema,
  async ({ jobTitle, location, datePosted }) => {
    const result = await jobCircular(jobTitle, location, datePosted);
    return {
      content: [{ type: "text", text: result }],
    };
  }
);

// Define a prompt template for job circulars
server.prompt(
  "jobCircularPrompt",
  { jobTitle: z.string(), location: z.string(), datePosted: z.string() },
  ({ jobTitle, location, datePosted }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `
          Return ONLY a JSON array of 10 jobs for "${jobTitle}" in "${location}" posted "${datePosted}". 
          Each job MUST include:
          - title (string)
          - company (string)
          - location (string)
          - applyUrl (string, REQUIRED)
          
          Example:
          [
            {
              "title": "Frontend Developer",
              "company": "Tech Corp",
              "location": "Remote",
              "applyUrl": "https://example.com/apply"
            }
          ]
        `
      }
    }]
  })
);