#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import os from 'os';
import { ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Command line argument parsing
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: pinata-mcp-server <allowed-directory> [additional-directories...]");
  process.exit(1);
}

// Normalize all paths consistently
function normalizePath(p: string): string {
  return path.normalize(p);
}

function expandHome(filepath: string): string {
  if (filepath.startsWith('~/') || filepath === '~') {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

// Store allowed directories in normalized form
const allowedDirectories = args.map(dir =>
  normalizePath(path.resolve(expandHome(dir)))
);

// Validate that all directories exist and are accessible
(async () => {
  await Promise.all(args.map(async (dir) => {
    try {
      const expandedDir = expandHome(dir);
      const stats = await fs.stat(expandedDir);
      if (!stats.isDirectory()) {
        console.error(`Error: ${dir} is not a directory`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error accessing directory ${dir}:`, error);
      process.exit(1);
    }
  }));
})();

// Security utilities
async function validatePath(requestedPath: string): Promise<string> {
  const expandedPath = expandHome(requestedPath);
  const absolute = path.isAbsolute(expandedPath)
    ? path.resolve(expandedPath)
    : path.resolve(process.cwd(), expandedPath);

  const normalizedRequested = normalizePath(absolute);

  // Check if path is within allowed directories
  const isAllowed = allowedDirectories.some(dir => normalizedRequested.startsWith(dir));
  if (!isAllowed) {
    throw new Error(`Access denied - path outside allowed directories: ${absolute} not in ${allowedDirectories.join(', ')}`);
  }

  // Handle symlinks by checking their real path
  try {
    const realPath = await fs.realpath(absolute);
    const normalizedReal = normalizePath(realPath);
    const isRealPathAllowed = allowedDirectories.some(dir => normalizedReal.startsWith(dir));
    if (!isRealPathAllowed) {
      throw new Error("Access denied - symlink target outside allowed directories");
    }
    return realPath;
  } catch (error) {
    // For new files that don't exist yet, verify parent directory
    const parentDir = path.dirname(absolute);
    try {
      const realParentPath = await fs.realpath(parentDir);
      const normalizedParent = normalizePath(realParentPath);
      const isParentAllowed = allowedDirectories.some(dir => normalizedParent.startsWith(dir));
      if (!isParentAllowed) {
        throw new Error("Access denied - parent directory outside allowed directories");
      }
      return absolute;
    } catch {
      throw new Error(`Parent directory does not exist: ${parentDir}`);
    }
  }
}

const server = new McpServer({
  name: "Pinata",
  version: "1.0.0",
  capabilities: {
    tools: {},
    resources: {}
  }
});

server.server.registerCapabilities({
  resources: {}
})

const PINATA_JWT = process.env.PINATA_JWT;
const GATEWAY_URL = process.env.GATEWAY_URL;

// Base headers for all requests
const getHeaders = () => {
  if (!PINATA_JWT) {
    throw new Error("PINATA_JWT environment variable is not set");
  }
  return {
    Authorization: `Bearer ${PINATA_JWT}`,
    "Content-Type": "application/json",
  };
};

server.tool(
  "searchFiles",
  {
    network: z.enum(["public", "private"]).default("public"),
    name: z.string().optional(),
    cid: z.string().optional(),
    mimeType: z.string().optional(),
    limit: z.number().optional(),
  },
  async ({ network, name, cid, mimeType, limit }) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (name) params.append("name", name);
      if (cid) params.append("cid", cid);
      if (mimeType) params.append("mimeType", mimeType);
      if (limit) params.append("limit", limit.toString());

      const url = `https://api.pinata.cloud/v3/files/${network}?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to search files: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
      };
    }
  }
);

server.tool(
  "getFileById",
  {
    network: z.enum(["public", "private"]).default("public"),
    id: z.string(),
  },
  async ({ network, id }) => {
    try {
      const url = `https://api.pinata.cloud/v3/files/${network}/${id}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get file: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
      };
    }
  }
);

server.tool(
  "updateFile",
  {
    network: z.enum(["public", "private"]).default("public"),
    id: z.string(),
    name: z.string().optional(),
    keyvalues: z.record(z.any()).optional(),
  },
  async ({ network, id, name, keyvalues }) => {
    try {
      const url = `https://api.pinata.cloud/v3/files/${network}/${id}`;

      const payload: { name?: string; keyvalues?: Record<string, any> } = {};
      if (name) payload.name = name;
      if (keyvalues) payload.keyvalues = keyvalues;

      const response = await fetch(url, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to update file: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
      };
    }
  }
);

server.tool(
  "deleteFile",
  {
    network: z.enum(["public", "private"]).default("public"),
    id: z.string(),
  },
  async ({ network, id }) => {
    try {
      const url = `https://api.pinata.cloud/v3/files/${network}/${id}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
      };
    }
  }
);

server.tool(
  "createPrivateDownloadLink",
  {
    cid: z.string(),
    expires: z.number(),
  },
  async ({ cid, expires }) => {
    try {
      const apiUrl = `https://api.pinata.cloud/v3/files/private/download_link`;

      const url = `https://${GATEWAY_URL}/files/${cid}`

      const date = Math.floor(new Date().getTime() / 1000)

      const payload = {
        url,
        expires,
        date,
        method: "GET",
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to create download link: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
      };
    }
  }
);

server.tool(
  "listGroups",
  {
    network: z.enum(["public", "private"]).default("public"),
    name: z.string().optional(),
    limit: z.number().optional(),
    pageToken: z.string().optional(),
  },
  async ({ network, name, limit, pageToken }) => {
    try {
      const params = new URLSearchParams();
      if (name) params.append("name", name);
      if (limit) params.append("limit", limit.toString());
      if (pageToken) params.append("pageToken", pageToken);

      const url = `https://api.pinata.cloud/v3/groups/${network}?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to list groups: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
      };
    }
  }
);

server.tool(
  "createGroup",
  {
    network: z.enum(["public", "private"]).default("public"),
    name: z.string(),
  },
  async ({ network, name }) => {
    try {
      const url = `https://api.pinata.cloud/v3/groups/${network}`;

      const payload: { name: string; is_public?: boolean } = {
        name,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to create group: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
      };
    }
  }
);

server.tool(
  "getGroup",
  {
    network: z.enum(["public", "private"]).default("public"),
    id: z.string(),
  },
  async ({ network, id }) => {
    try {
      const url = `https://api.pinata.cloud/v3/groups/${network}/${id}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get group: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
      };
    }
  }
);

server.tool(
  "updateGroup",
  {
    network: z.enum(["public", "private"]).default("public"),
    id: z.string(),
    name: z.string().optional(),
  },
  async ({ network, id, name }) => {
    try {
      const url = `https://api.pinata.cloud/v3/groups/${network}/${id}`;

      const payload: { name?: string; is_public?: boolean } = {};
      if (name) payload.name = name;

      const response = await fetch(url, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to update group: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
      };
    }
  }
);

server.tool(
  "deleteGroup",
  {
    network: z.enum(["public", "private"]).default("public"),
    id: z.string(),
  },
  async ({ network, id }) => {
    try {
      const url = `https://api.pinata.cloud/v3/groups/${network}/${id}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete group: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
      };
    }
  }
);

server.tool(
  "addFileToGroup",
  {
    network: z.enum(["public", "private"]).default("public"),
    groupId: z.string(),
    fileId: z.string(),
  },
  async ({ network, groupId, fileId }) => {
    try {
      const url = `https://api.pinata.cloud/v3/groups/${network}/${groupId}/ids/${fileId}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to add file to group: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
      };
    }
  }
);

server.tool(
  "removeFileFromGroup",
  {
    network: z.enum(["public", "private"]).default("public"),
    groupId: z.string(),
    fileId: z.string(),
  },
  async ({ network, groupId, fileId }) => {
    try {
      const url = `https://api.pinata.cloud/v3/groups/${network}/${groupId}/ids/${fileId}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to remove file from group: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
      };
    }
  }
);



// Upload file to Pinata
server.tool(
  "uploadFile",
  {
    resourceUri: z.string().optional().describe("The file:// URI of the file to upload"),
    fileContent: z.string().optional().describe("Base64-encoded file content (required in Claude Desktop)"),
    mimeType: z.string().optional().describe("MIME type of the file"),
    network: z.enum(["public", "private"]).default("public"),
    name: z.string().optional(),
    group_id: z.string().optional(),
    keyvalues: z.record(z.string()).optional(),
  },
  async ({ resourceUri, fileContent, mimeType, network, name, group_id, keyvalues }) => {
    try {
      let fileBuffer: Buffer;
      let fileName: string;

      // Handle two different modes of operation:
      if (fileContent && !resourceUri) {
        // Direct content mode (for Claude Desktop)
        fileBuffer = Buffer.from(fileContent, 'base64');
        fileName = name || 'uploaded-file';
      } else if (resourceUri) {
        // File path mode (for project environments)
        if (!resourceUri.startsWith("file://")) {
          throw new Error("Resource URI must be a file:// URI when not providing direct file content");
        }

        // Extract file path from URI
        let filePath;
        if (process.platform === 'win32') {
          filePath = decodeURIComponent(resourceUri.replace(/^file:\/\/\//, '').replace(/\//g, '\\'));
        } else {
          filePath = decodeURIComponent(resourceUri.replace(/^file:\/\//, ''));
        }

        try {
          // Validate path is allowed
          filePath = await validatePath(filePath);
          fileBuffer = await fs.readFile(filePath);
          fileName = name || path.basename(filePath);
        } catch (err) {
          return {
            content: [{
              type: "text",
              text: `Error: Cannot read file at ${filePath}.
Current working directory: ${process.cwd()}
Error details: ${err}
Note: When using Claude Desktop, you must provide fileContent parameter with base64-encoded file data.`
            }],
            isError: true
          };
        }
      } else {
        // Neither resourceUri nor fileContent provided
        throw new Error("Either resourceUri or fileContent must be provided");
      }

      // Determine MIME type if not provided
      const detectedMimeType = mimeType || getMimeType(fileName);

      // Create form data for the upload
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: detectedMimeType });
      formData.append("file", blob, fileName);
      formData.append("network", network);

      if (name) {
        formData.append("name", name);
      }

      if (group_id) {
        formData.append("group_id", group_id);
      }

      if (keyvalues) {
        formData.append("keyvalues", JSON.stringify(keyvalues));
      }

      // Send request to Pinata
      const response = await fetch("https://uploads.pinata.cloud/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload file: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      return {
        content: [{
          type: "text",
          text: `File uploaded successfully!\n\n${JSON.stringify(data, null, 2)}`
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error uploading file: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "createLink",
  {
    cid: z.string().describe("The CID of the file to create a link for"),
    network: z.enum(["public", "private"]).default("public").describe("Whether the file is on public or private IPFS"),
    expires: z.number().optional().default(600).describe("Expiration time in seconds for private download links")
  },
  async ({ cid, network, expires = 600 }) => {
    try {
      if (!GATEWAY_URL) {
        throw new Error("GATEWAY_URL environment variable is not set");
      }

      let fileUrl;

      if (network === "public") {
        // For public IPFS, we can access directly through the gateway
        fileUrl = `https://${GATEWAY_URL}/ipfs/${cid}`;
        return {
          content: [{
            type: "text",
            text: `✅ Public IPFS link created:\n${fileUrl}`
          }],
        };
      } else {
        // For private IPFS, we need to create a download link
        if (!PINATA_JWT) {
          throw new Error("PINATA_JWT environment variable is not set");
        }

        // The URL for the download link API
        const filePath = `https://${GATEWAY_URL}/files/${cid}`;
        const apiUrl = `https://api.pinata.cloud/v3/files/private/download_link`;

        // Current timestamp and provided expiration
        const date = Math.floor(new Date().getTime() / 1000);

        const payload = {
          url: filePath,
          expires,
          date,
          method: "GET"
        };

        // Create the download link
        const linkResponse = await fetch(apiUrl, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });

        if (!linkResponse.ok) {
          const errorText = await linkResponse.text();
          throw new Error(`Failed to create download link: ${linkResponse.status} ${linkResponse.statusText}. Response: ${errorText}`);
        }

        const linkData = await linkResponse.json();

        if (!linkData.data) {
          throw new Error("Failed to get download URL from response");
        }

        fileUrl = linkData.data;
        const expirationTime = new Date((date + expires) * 1000).toLocaleString();

        return {
          content: [{
            type: "text",
            text: `✅ Private IPFS temporary link created:\n${fileUrl}\n\nThis link will expire at: ${expirationTime} (${expires} seconds from creation)`
          }],
        };
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating link: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "fetchFromGateway",
  {
    cid: z.string().describe("The CID of the file to fetch"),
    network: z.enum(["public", "private"]).default("public").describe("Whether the file is on public or private IPFS"),
    saveToPath: z.string().optional().describe("Optional local file path to save the fetched content"),
    returnContent: z.boolean().default(false).describe("Whether to return the content directly (not recommended for large files)")
  },
  async ({ cid, network, saveToPath, returnContent }) => {
    try {
      if (!GATEWAY_URL) {
        throw new Error("GATEWAY_URL environment variable is not set");
      }

      let fileUrl;
      let response;

      if (network === "public") {
        // For public IPFS, we can access directly through the gateway
        fileUrl = `https://${GATEWAY_URL}/ipfs/${cid}`;
        response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch public file: ${response.status} ${response.statusText}`);
        }
      } else {
        // For private IPFS, we need to create a download link first
        if (!PINATA_JWT) {
          throw new Error("PINATA_JWT environment variable is not set");
        }

        // The URL for the download link API
        const filePath = `https://${GATEWAY_URL}/files/${cid}`;
        const apiUrl = `https://api.pinata.cloud/v3/files/private/download_link`;

        // Current timestamp and expiration (e.g., 10 minutes from now)
        const date = Math.floor(new Date().getTime() / 1000);
        const expires = 600; // 10 minutes

        const payload = {
          url: filePath,
          expires,
          date,
          method: "GET"
        };

        // Create the download link
        const linkResponse = await fetch(apiUrl, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });

        if (!linkResponse.ok) {
          const errorText = await linkResponse.text();
          throw new Error(`Failed to create download link: ${linkResponse.status} ${linkResponse.statusText}. Response: ${errorText}`);
        }

        const linkData = await linkResponse.json();

        if (!linkData.data) {
          throw new Error("Failed to get download URL from response");
        }

        // Use the generated download link
        fileUrl = linkData.data;
        response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch private file: ${response.status} ${response.statusText}`);
        }
      }

      // Get content type from headers
      const contentType = response.headers.get("content-type") || "application/octet-stream";

      // Handle the response based on the options
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // If a save path is provided, save the file
      if (saveToPath) {
        // Validate the save path is allowed
        const validatedPath = await validatePath(saveToPath);

        // Create directory if it doesn't exist
        const dir = path.dirname(validatedPath);
        await fs.mkdir(dir, { recursive: true });

        // Save the file
        await fs.writeFile(validatedPath, buffer);
      }

      // Return appropriate response
      let resultText = "";
      if (network === "public") {
        resultText = `✅ Fetched ${buffer.length} bytes from public IPFS (CID: ${cid})`;
      } else {
        resultText = `✅ Fetched ${buffer.length} bytes from private IPFS (CID: ${cid})`;
      }

      if (saveToPath) {
        resultText += `\nFile saved to: ${saveToPath}`;
      }

      // Return content if requested and if it's reasonable to do so
      if (returnContent) {
        // If it's a text file and not too large, return as text
        if (contentType.startsWith("text/") ||
          contentType.includes("json") ||
          contentType.includes("javascript") ||
          contentType.includes("xml")) {
          if (buffer.length < 100000) { // Less than 100KB
            const textContent = buffer.toString('utf-8');
            resultText += `\n\nContent:\n${textContent}`;
          } else {
            resultText += `\n\nContent too large to display (${buffer.length} bytes). File was saved${saveToPath ? ` to ${saveToPath}` : ' but not returned'}.`;
          }
        } else if (buffer.length < 50000) { // Less than 50KB for binary files
          // For small binary files, return base64
          resultText += `\n\nBase64 Content (${contentType}):\n${buffer.toString('base64')}`;
        } else {
          resultText += `\n\nContent too large to display (${buffer.length} bytes). File was saved${saveToPath ? ` to ${saveToPath}` : ' but not returned'}.`;
        }
      }

      return {
        content: [{ type: "text", text: resultText }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error fetching file: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Add a tool to list allowed directories
server.tool(
  "listAllowedDirectories",
  {},
  async () => {
    return {
      content: [{
        type: "text",
        text: `Allowed directories:\n${allowedDirectories.join('\n')}`
      }],
    };
  }
);

// List available resources
server.server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uriTemplate: "file://{path}",
        name: "Local Files",
        description: "Access local files to upload to Pinata IPFS (only from allowed directories)"
      }
    ]
  };
});

// Read resource contents
server.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  // Handle file resource
  if (uri.startsWith("file://")) {
    let filePath = decodeURIComponent(uri.replace(/^file:\/\//, ''));
    if (process.platform === 'win32') {
      filePath = filePath.replace(/\//g, '\\');
    }

    try {
      // Validate path is allowed
      filePath = await validatePath(filePath);

      // Check if the file exists
      const fileStats = await fs.stat(filePath);
      if (!fileStats.isFile()) {
        throw new Error(`Not a file: ${filePath}`);
      }

      const mimeType = getMimeType(filePath);

      // For text files, read as text
      if (isTextFile(mimeType)) {
        const content = await fs.readFile(filePath, 'utf-8');
        return {
          contents: [
            {
              uri,
              mimeType,
              text: content
            }
          ]
        };
      } else {
        // For binary files, use base64 encoding
        const content = await fs.readFile(filePath);
        return {
          contents: [
            {
              uri,
              mimeType,
              blob: content.toString('base64')
            }
          ]
        };
      }
    } catch (error) {
      throw new Error(`Failed to read file: ${error}`);
    }
  }

  throw new Error("Unsupported resource URI");
});



server.server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "searchFiles",
        description: "Search for files in your Pinata account by name, CID, or MIME type. Returns a list of files matching the given criteria.",
        inputSchema: {
          type: "object",
          properties: {
            network: {
              type: "string",
              enum: ["public", "private"],
              description: "Whether to search in public or private IPFS",
              default: "public"
            },
            name: {
              type: "string",
              description: "Search by filename (optional)"
            },
            cid: {
              type: "string",
              description: "Search by content ID (optional)"
            },
            mimeType: {
              type: "string",
              description: "Search by MIME type (optional)"
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (optional)"
            }
          }
        },
      },
      {
        name: "getFileById",
        description: "Retrieve detailed information about a specific file stored on Pinata by its ID.",
        inputSchema: {
          type: "object",
          properties: {
            network: {
              type: "string",
              enum: ["public", "private"],
              description: "Whether the file is in public or private IPFS",
              default: "public"
            },
            id: {
              type: "string",
              description: "The ID of the file to retrieve"
            }
          },
          required: ["id"]
        },
      },
      {
        name: "updateFile",
        description: "Update metadata for an existing file on Pinata. Can update the name and keyvalues (metadata).",
        inputSchema: {
          type: "object",
          properties: {
            network: {
              type: "string",
              enum: ["public", "private"],
              description: "Whether the file is in public or private storage",
              default: "public"
            },
            id: {
              type: "string",
              description: "The ID of the file to update"
            },
            name: {
              type: "string",
              description: "New name for the file (optional)"
            },
            keyvalues: {
              type: "object",
              description: "Metadata key-value pairs to update (optional)"
            }
          },
          required: ["id"]
        },
      },
      {
        name: "deleteFile",
        description: "Delete a file from your Pinata account by its ID.",
        inputSchema: {
          type: "object",
          properties: {
            network: {
              type: "string",
              enum: ["public", "private"],
              description: "Whether the file is in public or private IPFS",
              default: "public"
            },
            id: {
              type: "string",
              description: "The ID of the file to delete"
            }
          },
          required: ["id"]
        },
      },
      {
        name: "createPrivateDownloadLink",
        description: "Generate a temporary download link for accessing a private ipfs file from Pinata.",
        inputSchema: {
          type: "object",
          properties: {
            cid: {
              type: "string",
              description: "The content ID (CID) of the file"
            },
            expires: {
              type: "number",
              description: "Expiration time in seconds for the download link"
            }
          },
          required: ["cid", "expires"]
        },
      },
      {
        name: "createLink",
        description: "Create a direct access link for a file stored on Pinata IPFS. For private files, generates a temporary download link.",
        inputSchema: {
          type: "object",
          properties: {
            cid: {
              type: "string",
              description: "The CID of the file to create a link for"
            },
            network: {
              type: "string",
              enum: ["public", "private"],
              description: "Whether the file is on public or private IPFS",
              default: "public"
            },
            expires: {
              type: "number",
              description: "Expiration time in seconds for private download links",
              default: 600
            }
          },
          required: ["cid"]
        },
      },
      {
        name: "listGroups",
        description: "List groups in your Pinata account, with optional filtering by name.",
        inputSchema: {
          type: "object",
          properties: {
            network: {
              type: "string",
              enum: ["public", "private"],
              description: "Whether to list groups in public or private IPFS",
              default: "public"
            },
            name: {
              type: "string",
              description: "Filter groups by name (optional)"
            },
            isPublic: {
              type: "boolean",
              description: "Filter groups by public status (optional)"
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (optional)"
            },
            pageToken: {
              type: "string",
              description: "Token for pagination (optional)"
            }
          }
        },
      },
      {
        name: "createGroup",
        description: "Create a new group in your Pinata account to organize files.",
        inputSchema: {
          type: "object",
          properties: {
            network: {
              type: "string",
              enum: ["public", "private"],
              description: "Whether to create the group in public or private IPFS",
              default: "public"
            },
            name: {
              type: "string",
              description: "Name for the new group"
            },
            is_public: {
              type: "boolean",
              description: "Whether the group should be public (optional)"
            }
          },
          required: ["name"]
        },
      },
      {
        name: "getGroup",
        description: "Retrieve detailed information about a specific group by its ID.",
        inputSchema: {
          type: "object",
          properties: {
            network: {
              type: "string",
              enum: ["public", "private"],
              description: "Whether the group is in public or private IPFS",
              default: "public"
            },
            id: {
              type: "string",
              description: "The ID of the group to retrieve"
            }
          },
          required: ["id"]
        },
      },
      {
        name: "updateGroup",
        description: "Update metadata for an existing group on Pinata. Can update the name.",
        inputSchema: {
          type: "object",
          properties: {
            network: {
              type: "string",
              enum: ["public", "private"],
              description: "Whether the group is in public or private IPFS",
              default: "public"
            },
            id: {
              type: "string",
              description: "The ID of the group to update"
            },
            name: {
              type: "string",
              description: "New name for the group (optional)"
            },
          },
          required: ["id"]
        },
      },
      {
        name: "deleteGroup",
        description: "Delete a group from your Pinata storage by its ID.",
        inputSchema: {
          type: "object",
          properties: {
            network: {
              type: "string",
              enum: ["public", "private"],
              description: "Whether the group is in public or private IPFS",
              default: "public"
            },
            id: {
              type: "string",
              description: "The ID of the group to delete"
            }
          },
          required: ["id"]
        },
      },
      {
        name: "addFileToGroup",
        description: "Add an existing file to a group in your Pinata account.",
        inputSchema: {
          type: "object",
          properties: {
            network: {
              type: "string",
              enum: ["public", "private"],
              description: "Whether the group and file are in public or private IPFS",
              default: "public"
            },
            groupId: {
              type: "string",
              description: "The ID of the group to add the file to"
            },
            fileId: {
              type: "string",
              description: "The ID of the file to add to the group"
            }
          },
          required: ["groupId", "fileId"]
        },
      },
      {
        name: "removeFileFromGroup",
        description: "Remove a file from a group in your Pinata account.",
        inputSchema: {
          type: "object",
          properties: {
            network: {
              type: "string",
              enum: ["public", "private"],
              description: "Whether the group and file are in public or private IPFS",
              default: "public"
            },
            groupId: {
              type: "string",
              description: "The ID of the group to remove the file from"
            },
            fileId: {
              type: "string",
              description: "The ID of the file to remove from the group"
            }
          },
          required: ["groupId", "fileId"]
        },
      },
      {
        name: "uploadFile",
        description: "Upload a file to Pinata Public of Private IPFS. Can upload from local filesystem or directly from provided content.",
        inputSchema: {
          type: "object",
          properties: {
            resourceUri: {
              type: "string",
              description: "The file:// URI of the file to upload (optional if providing fileContent)"
            },
            fileContent: {
              type: "string",
              description: "Base64-encoded file content (required in Claude Desktop or when not using resourceUri)"
            },
            mimeType: {
              type: "string",
              description: "MIME type of the file (optional, will be detected from filename if not provided)"
            },
            network: {
              type: "string",
              enum: ["public", "private"],
              description: "Whether to upload to public or private IPFS",
              default: "public"
            },
            name: {
              type: "string",
              description: "Custom name for the file (optional)"
            },
            group_id: {
              type: "string",
              description: "ID of a group to add the file to (optional)"
            },
            keyvalues: {
              type: "object",
              description: "Metadata key-value pairs for the file (optional)"
            }
          }
        },
      },
      {
        name: "fetchFromGateway",
        description: "Fetch a file from Public or Private IPFS via Pinata gateway. Can retrieve public and private files and optionally save to local filesystem.",
        inputSchema: {
          type: "object",
          properties: {
            cid: {
              type: "string",
              description: "The CID of the file to fetch"
            },
            network: {
              type: "string",
              enum: ["public", "private"],
              description: "Whether the file is on public or private IPFS",
              default: "public"
            },
            saveToPath: {
              type: "string",
              description: "Optional local file path to save the fetched content"
            },
            returnContent: {
              type: "boolean",
              description: "Whether to return the content directly (not recommended for large files)",
              default: false
            }
          },
          required: ["cid"]
        },
      },
      {
        name: "listAllowedDirectories",
        description: "List all directories that this MCP server is allowed to access for file operations.",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        },
      }
    ],
  };
});

// Helper function to get MIME type from file extension
function getMimeType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'zip': 'application/zip',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };

  return mimeTypes[extension] || 'application/octet-stream';
}

// Helper function to determine if a file is text-based
function isTextFile(mimeType: string): boolean {
  return mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/javascript' ||
    mimeType === 'application/xml';
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Pinata MCP Server running on stdio");
  console.error("Allowed directories:", allowedDirectories);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
