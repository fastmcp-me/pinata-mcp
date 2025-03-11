#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import * as fsSync from "fs";
import path from "path";
import os from 'os';
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";

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

// Get JWT token from environment variable
const PINATA_JWT = process.env.PINATA_JWT;

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
    url: z.string(),
    expires: z.number(),
    date: z.number(),
    method: z.enum(["GET"]).default("GET"),
  },
  async ({ url, expires, date, method }) => {
    try {
      const apiUrl = `https://api.pinata.cloud/v3/files/private/download_link`;

      const payload = {
        url,
        expires,
        date,
        method,
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
    isPublic: z.boolean().optional(),
    limit: z.number().optional(),
    pageToken: z.string().optional(),
  },
  async ({ network, name, isPublic, limit, pageToken }) => {
    try {
      const params = new URLSearchParams();
      if (name) params.append("name", name);
      if (isPublic !== undefined) params.append("isPublic", isPublic.toString());
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
    is_public: z.boolean().optional(),
  },
  async ({ network, name, is_public }) => {
    try {
      const url = `https://api.pinata.cloud/v3/groups/${network}`;

      const payload: { name: string; is_public?: boolean } = {
        name,
      };

      if (is_public !== undefined) {
        payload.is_public = is_public;
      }

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
    is_public: z.boolean().optional(),
  },
  async ({ network, id, name, is_public }) => {
    try {
      const url = `https://api.pinata.cloud/v3/groups/${network}/${id}`;

      const payload: { name?: string; is_public?: boolean } = {};
      if (name) payload.name = name;
      if (is_public !== undefined) payload.is_public = is_public;

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


server.tool(
  "getSwapHistory",
  {
    network: z.enum(["public", "private"]).default("public"),
    cid: z.string(),
    domain: z.string(),
  },
  async ({ network, cid, domain }) => {
    try {
      const params = new URLSearchParams();
      params.append("domain", domain);

      const url = `https://api.pinata.cloud/v3/files/${network}/swap/${cid}?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get swap history: ${response.status} ${response.statusText}`);
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
  "addSwap",
  {
    network: z.enum(["public", "private"]).default("public"),
    cid: z.string(),
    swap_cid: z.string(),
  },
  async ({ network, cid, swap_cid }) => {
    try {
      const url = `https://api.pinata.cloud/v3/files/${network}/swap/${cid}`;

      const payload = {
        swap_cid,
      };

      const response = await fetch(url, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to add swap: ${response.status} ${response.statusText}`);
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
  "removeSwap",
  {
    network: z.enum(["public", "private"]).default("public"),
    cid: z.string(),
  },
  async ({ network, cid }) => {
    try {
      const url = `https://api.pinata.cloud/v3/files/${network}/swap/${cid}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to remove swap: ${response.status} ${response.statusText}`);
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
    network: z.enum(["public", "private"]).default("private"),
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
        console.log("Using provided file content, size:", fileBuffer.length);
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

        console.log("Resolved filePath:", filePath);

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
  console.log("Requested URI:", uri);

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
