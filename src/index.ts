#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs"
import path from "path";
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";

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

      const payload: any = {};
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

      const payload: any = {
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

      const payload: any = {};
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
  "listAPIKeys",
  {
    revoked: z.boolean().optional(),
    limitedUse: z.boolean().optional(),
    exhausted: z.boolean().optional(),
    name: z.string().optional(),
    offset: z.number().optional(),
  },
  async ({ revoked, limitedUse, exhausted, name, offset }) => {
    try {
      const params = new URLSearchParams();
      if (revoked !== undefined) params.append("revoked", revoked.toString());
      if (limitedUse !== undefined) params.append("limitedUse", limitedUse.toString());
      if (exhausted !== undefined) params.append("exhausted", exhausted.toString());
      if (name) params.append("name", name);
      if (offset) params.append("offset", offset.toString());

      const url = `https://api.pinata.cloud/v3/pinata/keys?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to list API keys: ${response.status} ${response.statusText}`);
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
  "createAPIKey",
  {
    keyName: z.string(),
    permissions: z.object({
      admin: z.boolean().optional(),
      endpoints: z.object({
        data: z.object({
          pinList: z.boolean().optional(),
          userPinnedDataTotal: z.boolean().optional(),
        }).optional(),
        pinning: z.object({
          hashMetadata: z.boolean().optional(),
          hashPinPolicy: z.boolean().optional(),
          pinByHash: z.boolean().optional(),
          pinFileToIPFS: z.boolean().optional(),
          pinJSONToIPFS: z.boolean().optional(),
          pinJobs: z.boolean().optional(),
          unpin: z.boolean().optional(),
          userPinPolicy: z.boolean().optional(),
        }).optional(),
      }).optional(),
    }),
    maxUses: z.number().optional(),
  },
  async ({ keyName, permissions, maxUses }) => {
    try {
      const url = `https://api.pinata.cloud/v3/pinata/keys`;

      const payload: any = {
        keyName,
        permissions,
      };

      if (maxUses !== undefined) {
        payload.maxUses = maxUses;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to create API key: ${response.status} ${response.statusText}`);
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
  "revokeAPIKey",
  {
    key: z.string(),
  },
  async ({ key }) => {
    try {
      const url = `https://api.pinata.cloud/v3/pinata/keys/${key}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to revoke API key: ${response.status} ${response.statusText}`);
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

server.tool(
  "getSignature",
  {
    network: z.enum(["public", "private"]).default("public"),
    cid: z.string(),
  },
  async ({ network, cid }) => {
    try {
      const url = `https://api.pinata.cloud/v3/files/${network}/signature/${cid}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get signature: ${response.status} ${response.statusText}`);
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
  "addSignature",
  {
    network: z.enum(["public", "private"]).default("public"),
    cid: z.string(),
    signature: z.string(),
    address: z.string(),
  },
  async ({ network, cid, signature, address }) => {
    try {
      const url = `https://api.pinata.cloud/v3/files/${network}/signature/${cid}`;

      const payload = {
        signature,
        address,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to add signature: ${response.status} ${response.statusText}`);
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
  "removeSignature",
  {
    network: z.enum(["public", "private"]).default("public"),
    cid: z.string(),
  },
  async ({ network, cid }) => {
    try {
      const url = `https://api.pinata.cloud/v3/files/${network}/signature/${cid}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to remove signature: ${response.status} ${response.statusText}`);
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
    resourceUri: z.string().describe("The file:// URI of the file to upload"),
    network: z.enum(["public", "private"]).default("private").describe("Network to upload to (public or private)"),
    name: z.string().optional().describe("Custom name for the uploaded file"),
    group_id: z.string().optional().describe("Optional group ID to add file to"),
    keyvalues: z.record(z.string()).optional().describe("Optional metadata key-value pairs"),
  },
  async ({ resourceUri, network, name, group_id, keyvalues }) => {
    console.log(resourceUri)
    try {
      if (!resourceUri.startsWith("file://")) {
        throw new Error("Resource URI must be a file:// URI");
      }

      // Properly handle the file path conversion
      let filePath = resourceUri.replace("file://", "");

      // Normalize the path to handle potential issues
      filePath = path.normalize(filePath);

      if (!fs.existsSync(filePath)) {
        return {
          content: [{
            type: "text",
            text: `Error: File not found at ${filePath}. Please check the path.`
          }],
          isError: true
        };
      }

      const fileStats = fs.statSync(filePath);
      if (!fileStats.isFile()) {
        return {
          content: [{
            type: "text",
            text: `Error: ${filePath} is not a file.`
          }],
          isError: true
        };
      }

      // Load the whole file into memory as a buffer
      const fileBuffer = fs.readFileSync(filePath);

      const fileName = name || path.basename(filePath);
      const mimeType = getMimeType(filePath);

      // Create form data for the upload
      const formData = new FormData();

      // Create a blob from the file buffer and append it
      const blob = new Blob([fileBuffer], { type: mimeType });

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

      if (!PINATA_JWT) {
        throw new Error("PINATA_JWT environment variable is not set");
      }

      const headers = {
        Authorization: `Bearer ${PINATA_JWT}`,
      };

      const response = await fetch("https://uploads.pinata.cloud/v3/files", {
        method: "POST",
        headers: headers,
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
          text: `Error uploading file: ${error}`
        }],
        isError: true
      };
    }
  }
);

// Tool to vectorize a file
server.tool(
  "vectorizeFile",
  {
    file_id: z.string(),
  },
  async ({ file_id }) => {
    try {
      const url = `https://uploads.pinata.cloud/v3/vectorize/files/${file_id}`;

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to vectorize file: ${response.status} ${response.statusText}`);
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

// Tool to query vectors in a group
server.tool(
  "queryVectors",
  {
    group_id: z.string(),
    text: z.string(),
  },
  async ({ group_id, text }) => {
    try {
      const url = `https://uploads.pinata.cloud/v3/vectorize/groups/${group_id}/query`;

      const payload = {
        text,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to query vectors: ${response.status} ${response.statusText}`);
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

// List available resources
server.server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uriTemplate: "file://{path}",
        name: "Local Files",
        description: "Access local files to upload to Pinata IPFS"
      }
    ]
  };
});

// Read resource contents
server.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  // Handle file resource
  if (uri.startsWith("file://")) {
    const filePath = path.normalize(uri.replace("file://", ""));

    try {
      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileStats = fs.statSync(filePath);
      if (!fileStats.isFile()) {
        throw new Error(`Not a file: ${filePath}`);
      }

      const mimeType = getMimeType(filePath);

      // For text files, read as text
      if (isTextFile(mimeType)) {
        const content = fs.readFileSync(filePath, 'utf-8');
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
        const content = fs.readFileSync(filePath);
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

const transport = new StdioServerTransport();
await server.connect(transport);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
