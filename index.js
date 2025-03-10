"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var zod_1 = require("zod");
// import fs from "fs"
// import { basename } from "path";
// import { ListResourcesRequestSchema, ReadResourceRequestSchema, ReadResourceResultSchema } from "@modelcontextprotocol/sdk/types.js";
var server = new mcp_js_1.McpServer({
    name: "Pinata",
    version: "1.0.0",
    capabilities: {
        resources: {}
    }
});
// Get JWT token from environment variable
var PINATA_JWT = process.env.PINATA_JWT;
// Base headers for all requests
var getHeaders = function () {
    if (!PINATA_JWT) {
        throw new Error("PINATA_JWT environment variable is not set");
    }
    return {
        Authorization: "Bearer ".concat(PINATA_JWT),
        "Content-Type": "application/json",
    };
};
server.tool("searchFiles", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    name: zod_1.z.string().optional(),
    cid: zod_1.z.string().optional(),
    mimeType: zod_1.z.string().optional(),
    limit: zod_1.z.number().optional(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var params, url, response, data, error_1;
    var network = _b.network, name = _b.name, cid = _b.cid, mimeType = _b.mimeType, limit = _b.limit;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                params = new URLSearchParams();
                if (name)
                    params.append("name", name);
                if (cid)
                    params.append("cid", cid);
                if (mimeType)
                    params.append("mimeType", mimeType);
                if (limit)
                    params.append("limit", limit.toString());
                url = "https://api.pinata.cloud/v3/files/".concat(network, "?").concat(params.toString());
                return [4 /*yield*/, fetch(url, {
                        method: "GET",
                        headers: getHeaders(),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to search files: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_1 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_1) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("getFileById", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    id: zod_1.z.string(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, response, data, error_2;
    var network = _b.network, id = _b.id;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/files/".concat(network, "/").concat(id);
                return [4 /*yield*/, fetch(url, {
                        method: "GET",
                        headers: getHeaders(),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to get file: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_2 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_2) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("updateFile", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    id: zod_1.z.string(),
    name: zod_1.z.string().optional(),
    keyvalues: zod_1.z.record(zod_1.z.any()).optional(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, payload, response, data, error_3;
    var network = _b.network, id = _b.id, name = _b.name, keyvalues = _b.keyvalues;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/files/".concat(network, "/").concat(id);
                payload = {};
                if (name)
                    payload.name = name;
                if (keyvalues)
                    payload.keyvalues = keyvalues;
                return [4 /*yield*/, fetch(url, {
                        method: "PUT",
                        headers: getHeaders(),
                        body: JSON.stringify(payload),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to update file: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_3 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_3) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("deleteFile", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    id: zod_1.z.string(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, response, data, error_4;
    var network = _b.network, id = _b.id;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/files/".concat(network, "/").concat(id);
                return [4 /*yield*/, fetch(url, {
                        method: "DELETE",
                        headers: getHeaders(),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to delete file: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_4 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_4) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("createPrivateDownloadLink", {
    url: zod_1.z.string(),
    expires: zod_1.z.number(),
    date: zod_1.z.number(),
    method: zod_1.z.enum(["GET"]).default("GET"),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var apiUrl, payload, response, data, error_5;
    var url = _b.url, expires = _b.expires, date = _b.date, method = _b.method;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                apiUrl = "https://api.pinata.cloud/v3/files/private/download_link";
                payload = {
                    url: url,
                    expires: expires,
                    date: date,
                    method: method,
                };
                return [4 /*yield*/, fetch(apiUrl, {
                        method: "POST",
                        headers: getHeaders(),
                        body: JSON.stringify(payload),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to create download link: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_5 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_5) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("listGroups", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    name: zod_1.z.string().optional(),
    isPublic: zod_1.z.boolean().optional(),
    limit: zod_1.z.number().optional(),
    pageToken: zod_1.z.string().optional(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var params, url, response, data, error_6;
    var network = _b.network, name = _b.name, isPublic = _b.isPublic, limit = _b.limit, pageToken = _b.pageToken;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                params = new URLSearchParams();
                if (name)
                    params.append("name", name);
                if (isPublic !== undefined)
                    params.append("isPublic", isPublic.toString());
                if (limit)
                    params.append("limit", limit.toString());
                if (pageToken)
                    params.append("pageToken", pageToken);
                url = "https://api.pinata.cloud/v3/groups/".concat(network, "?").concat(params.toString());
                return [4 /*yield*/, fetch(url, {
                        method: "GET",
                        headers: getHeaders(),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to list groups: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_6 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_6) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("createGroup", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    name: zod_1.z.string(),
    is_public: zod_1.z.boolean().optional(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, payload, response, data, error_7;
    var network = _b.network, name = _b.name, is_public = _b.is_public;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/groups/".concat(network);
                payload = {
                    name: name,
                };
                if (is_public !== undefined) {
                    payload.is_public = is_public;
                }
                return [4 /*yield*/, fetch(url, {
                        method: "POST",
                        headers: getHeaders(),
                        body: JSON.stringify(payload),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to create group: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_7 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_7) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("getGroup", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    id: zod_1.z.string(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, response, data, error_8;
    var network = _b.network, id = _b.id;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/groups/".concat(network, "/").concat(id);
                return [4 /*yield*/, fetch(url, {
                        method: "GET",
                        headers: getHeaders(),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to get group: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_8 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_8) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("updateGroup", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    id: zod_1.z.string(),
    name: zod_1.z.string().optional(),
    is_public: zod_1.z.boolean().optional(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, payload, response, data, error_9;
    var network = _b.network, id = _b.id, name = _b.name, is_public = _b.is_public;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/groups/".concat(network, "/").concat(id);
                payload = {};
                if (name)
                    payload.name = name;
                if (is_public !== undefined)
                    payload.is_public = is_public;
                return [4 /*yield*/, fetch(url, {
                        method: "PUT",
                        headers: getHeaders(),
                        body: JSON.stringify(payload),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to update group: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_9 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_9) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("deleteGroup", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    id: zod_1.z.string(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, response, data, error_10;
    var network = _b.network, id = _b.id;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/groups/".concat(network, "/").concat(id);
                return [4 /*yield*/, fetch(url, {
                        method: "DELETE",
                        headers: getHeaders(),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to delete group: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_10 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_10) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("addFileToGroup", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    groupId: zod_1.z.string(),
    fileId: zod_1.z.string(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, response, data, error_11;
    var network = _b.network, groupId = _b.groupId, fileId = _b.fileId;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/groups/".concat(network, "/").concat(groupId, "/ids/").concat(fileId);
                return [4 /*yield*/, fetch(url, {
                        method: "PUT",
                        headers: getHeaders(),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to add file to group: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_11 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_11) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("removeFileFromGroup", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    groupId: zod_1.z.string(),
    fileId: zod_1.z.string(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, response, data, error_12;
    var network = _b.network, groupId = _b.groupId, fileId = _b.fileId;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/groups/".concat(network, "/").concat(groupId, "/ids/").concat(fileId);
                return [4 /*yield*/, fetch(url, {
                        method: "DELETE",
                        headers: getHeaders(),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to remove file from group: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_12 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_12) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("listAPIKeys", {
    revoked: zod_1.z.boolean().optional(),
    limitedUse: zod_1.z.boolean().optional(),
    exhausted: zod_1.z.boolean().optional(),
    name: zod_1.z.string().optional(),
    offset: zod_1.z.number().optional(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var params, url, response, data, error_13;
    var revoked = _b.revoked, limitedUse = _b.limitedUse, exhausted = _b.exhausted, name = _b.name, offset = _b.offset;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                params = new URLSearchParams();
                if (revoked !== undefined)
                    params.append("revoked", revoked.toString());
                if (limitedUse !== undefined)
                    params.append("limitedUse", limitedUse.toString());
                if (exhausted !== undefined)
                    params.append("exhausted", exhausted.toString());
                if (name)
                    params.append("name", name);
                if (offset)
                    params.append("offset", offset.toString());
                url = "https://api.pinata.cloud/v3/pinata/keys?".concat(params.toString());
                return [4 /*yield*/, fetch(url, {
                        method: "GET",
                        headers: getHeaders(),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to list API keys: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_13 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_13) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("createAPIKey", {
    keyName: zod_1.z.string(),
    permissions: zod_1.z.object({
        admin: zod_1.z.boolean().optional(),
        endpoints: zod_1.z.object({
            data: zod_1.z.object({
                pinList: zod_1.z.boolean().optional(),
                userPinnedDataTotal: zod_1.z.boolean().optional(),
            }).optional(),
            pinning: zod_1.z.object({
                hashMetadata: zod_1.z.boolean().optional(),
                hashPinPolicy: zod_1.z.boolean().optional(),
                pinByHash: zod_1.z.boolean().optional(),
                pinFileToIPFS: zod_1.z.boolean().optional(),
                pinJSONToIPFS: zod_1.z.boolean().optional(),
                pinJobs: zod_1.z.boolean().optional(),
                unpin: zod_1.z.boolean().optional(),
                userPinPolicy: zod_1.z.boolean().optional(),
            }).optional(),
        }).optional(),
    }),
    maxUses: zod_1.z.number().optional(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, payload, response, data, error_14;
    var keyName = _b.keyName, permissions = _b.permissions, maxUses = _b.maxUses;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/pinata/keys";
                payload = {
                    keyName: keyName,
                    permissions: permissions,
                };
                if (maxUses !== undefined) {
                    payload.maxUses = maxUses;
                }
                return [4 /*yield*/, fetch(url, {
                        method: "POST",
                        headers: getHeaders(),
                        body: JSON.stringify(payload),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to create API key: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_14 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_14) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("revokeAPIKey", {
    key: zod_1.z.string(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, response, data, error_15;
    var key = _b.key;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/pinata/keys/".concat(key);
                return [4 /*yield*/, fetch(url, {
                        method: "PUT",
                        headers: getHeaders(),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to revoke API key: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_15 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_15) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("getSwapHistory", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    cid: zod_1.z.string(),
    domain: zod_1.z.string(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var params, url, response, data, error_16;
    var network = _b.network, cid = _b.cid, domain = _b.domain;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                params = new URLSearchParams();
                params.append("domain", domain);
                url = "https://api.pinata.cloud/v3/files/".concat(network, "/swap/").concat(cid, "?").concat(params.toString());
                return [4 /*yield*/, fetch(url, {
                        method: "GET",
                        headers: getHeaders(),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to get swap history: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_16 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_16) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("addSwap", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    cid: zod_1.z.string(),
    swap_cid: zod_1.z.string(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, payload, response, data, error_17;
    var network = _b.network, cid = _b.cid, swap_cid = _b.swap_cid;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/files/".concat(network, "/swap/").concat(cid);
                payload = {
                    swap_cid: swap_cid,
                };
                return [4 /*yield*/, fetch(url, {
                        method: "PUT",
                        headers: getHeaders(),
                        body: JSON.stringify(payload),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to add swap: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_17 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_17) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("removeSwap", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    cid: zod_1.z.string(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, response, data, error_18;
    var network = _b.network, cid = _b.cid;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/files/".concat(network, "/swap/").concat(cid);
                return [4 /*yield*/, fetch(url, {
                        method: "DELETE",
                        headers: getHeaders(),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to remove swap: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_18 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_18) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("getSignature", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    cid: zod_1.z.string(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, response, data, error_19;
    var network = _b.network, cid = _b.cid;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/files/".concat(network, "/signature/").concat(cid);
                return [4 /*yield*/, fetch(url, {
                        method: "GET",
                        headers: getHeaders(),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to get signature: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_19 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_19) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("addSignature", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    cid: zod_1.z.string(),
    signature: zod_1.z.string(),
    address: zod_1.z.string(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, payload, response, data, error_20;
    var network = _b.network, cid = _b.cid, signature = _b.signature, address = _b.address;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/files/".concat(network, "/signature/").concat(cid);
                payload = {
                    signature: signature,
                    address: address,
                };
                return [4 /*yield*/, fetch(url, {
                        method: "POST",
                        headers: getHeaders(),
                        body: JSON.stringify(payload),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to add signature: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_20 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_20) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
server.tool("removeSignature", {
    network: zod_1.z.enum(["public", "private"]).default("public"),
    cid: zod_1.z.string(),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, response, data, error_21;
    var network = _b.network, cid = _b.cid;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                url = "https://api.pinata.cloud/v3/files/".concat(network, "/signature/").concat(cid);
                return [4 /*yield*/, fetch(url, {
                        method: "DELETE",
                        headers: getHeaders(),
                    })];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to remove signature: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                    }];
            case 3:
                error_21 = _c.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "Error: ".concat(error_21) }],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
// // List available resources
// server.server.setRequestHandler(ListResourcesRequestSchema, async () => {
//   return {
//     resources: [
//       {
//         uriTemplate: "file://{path}",
//         name: "Local Files",
//         description: "Access local files to upload to Pinata IPFS"
//       }
//     ]
//   };
// });
// // Read resource contents
// server.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
//   const uri = request.params.uri;
//   // Handle file resource
//   if (uri.startsWith("file://")) {
//     const filePath = uri.replace("file://", "");
//     try {
//       const content = fs.readFileSync(filePath);
//       const mimeType = getMimeType(filePath);
//       if (isTextFile(mimeType)) {
//         return {
//           contents: [
//             {
//               uri,
//               mimeType,
//               text: content.toString('utf-8')
//             }
//           ]
//         };
//       } else {
//         return {
//           contents: [
//             {
//               uri,
//               mimeType,
//               blob: content.toString('base64')
//             }
//           ]
//         };
//       }
//     } catch (error) {
//       throw new Error(`Failed to read file: ${error}`);
//     }
//   }
//   throw new Error("Unsupported resource URI");
// });
// Upload file to Pinata
// server.tool(
//   "uploadFile",
//   {
//     resourceUri: z.string(),
//     network: z.enum(["public", "private"]).default("private"),
//     name: z.string().optional(),
//     group_id: z.string().optional(),
//     keyvalues: z.record(z.string()).optional(),
//   },
//   async ({ resourceUri, network, name, group_id, keyvalues }) => {
//     try {
//       if (!resourceUri.startsWith("file://")) {
//         throw new Error("Resource URI must be a file:// URI");
//       }
//       const filePath = resourceUri.replace("file://", "");
//       const blob = new Blob([fs.readFileSync("./hello-world.txt")]);
//       const fileName = name || basename(filePath);
//       const formData = new FormData();
//       formData.append("file", blob, fileName);
//       formData.append("network", network);
//       if (name) {
//         formData.append("name", name);
//       }
//       if (group_id) {
//         formData.append("group_id", group_id);
//       }
//       if (keyvalues) {
//         formData.append("keyvalues", JSON.stringify(keyvalues));
//       }
//       const headers = {
//         Authorization: `Bearer ${PINATA_JWT}`,
//       };
//       const response = await fetch("https://uploads.pinata.cloud/v3/files", {
//         method: "POST",
//         headers: headers,
//         body: formData,
//       });
//       if (!response.ok) {
//         throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
//       }
//       const data = await response.json();
//       return {
//         content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
//       };
//     } catch (error) {
//       return {
//         content: [{ type: "text", text: `Error uploading file: ${error}` }],
//       };
//     }
//   }
// );
// // Tool to vectorize a file
// server.tool(
//   "vectorizeFile",
//   {
//     file_id: z.string(),
//   },
//   async ({ file_id }) => {
//     try {
//       const url = `https://uploads.pinata.cloud/v3/vectorize/files/${file_id}`;
//       const response = await fetch(url, {
//         method: "POST",
//         headers: getHeaders(),
//       });
//       if (!response.ok) {
//         throw new Error(`Failed to vectorize file: ${response.status} ${response.statusText}`);
//       }
//       const data = await response.json();
//       return {
//         content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
//       };
//     } catch (error) {
//       return {
//         content: [{ type: "text", text: `Error: ${error}` }],
//       };
//     }
//   }
// );
// // Tool to query vectors in a group
// server.tool(
//   "queryVectors",
//   {
//     group_id: z.string(),
//     text: z.string(),
//   },
//   async ({ group_id, text }) => {
//     try {
//       const url = `https://uploads.pinata.cloud/v3/vectorize/groups/${group_id}/query`;
//       const payload = {
//         text,
//       };
//       const response = await fetch(url, {
//         method: "POST",
//         headers: getHeaders(),
//         body: JSON.stringify(payload),
//       });
//       if (!response.ok) {
//         throw new Error(`Failed to query vectors: ${response.status} ${response.statusText}`);
//       }
//       const data = await response.json();
//       return {
//         content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
//       };
//     } catch (error) {
//       return {
//         content: [{ type: "text", text: `Error: ${error}` }],
//       };
//     }
//   }
// );
// // Helper function to get MIME type from file extension
// function getMimeType(filePath: string): string {
//   const extension = filePath.split('.').pop()?.toLowerCase() || '';
//   const mimeTypes: Record<string, string> = {
//     'txt': 'text/plain',
//     'html': 'text/html',
//     'css': 'text/css',
//     'js': 'application/javascript',
//     'json': 'application/json',
//     'xml': 'application/xml',
//     'pdf': 'application/pdf',
//     'jpg': 'image/jpeg',
//     'jpeg': 'image/jpeg',
//     'png': 'image/png',
//     'gif': 'image/gif',
//     'svg': 'image/svg+xml',
//     'mp3': 'audio/mpeg',
//     'mp4': 'video/mp4',
//     'zip': 'application/zip',
//     'doc': 'application/msword',
//     'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     'xls': 'application/vnd.ms-excel',
//     'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//     'ppt': 'application/vnd.ms-powerpoint',
//     'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//   };
//   return mimeTypes[extension] || 'application/octet-stream';
// }
// // Helper function to determine if a file is text-based
// function isTextFile(mimeType: string): boolean {
//   return mimeType.startsWith('text/') ||
//     mimeType === 'application/json' ||
//     mimeType === 'application/javascript' ||
//     mimeType === 'application/xml';
// }
var transport = new stdio_js_1.StdioServerTransport();
await server.connect(transport);
