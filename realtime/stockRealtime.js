const crypto = require("crypto");

const WS_MAGIC_KEY = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const clients = new Set();

function normalizeBranch(value) {
  const raw = String(value || "").trim().toLowerCase();
  return raw || "all";
}

function createFrame(payload, opcode = 0x1) {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload || ""), "utf8");
  const bodyLength = body.length;

  let header = null;
  if (bodyLength < 126) {
    header = Buffer.from([0x80 | opcode, bodyLength]);
  } else if (bodyLength < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(bodyLength, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(bodyLength), 2);
  }

  return Buffer.concat([header, body]);
}

function sendJson(socket, payload) {
  if (!socket || socket.destroyed || !socket.writable) return;
  socket.write(createFrame(JSON.stringify(payload)));
}

function removeClient(client) {
  clients.delete(client);
}

function parseWsFrames(buffer, onFrame) {
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const firstByte = buffer[offset];
    const secondByte = buffer[offset + 1];
    const opcode = firstByte & 0x0f;
    const masked = (secondByte & 0x80) !== 0;
    let payloadLength = secondByte & 0x7f;
    let cursor = offset + 2;

    if (payloadLength === 126) {
      if (cursor + 2 > buffer.length) break;
      payloadLength = buffer.readUInt16BE(cursor);
      cursor += 2;
    } else if (payloadLength === 127) {
      if (cursor + 8 > buffer.length) break;
      const longLength = buffer.readBigUInt64BE(cursor);
      payloadLength = Number(longLength);
      cursor += 8;
    }

    let maskKey = null;
    if (masked) {
      if (cursor + 4 > buffer.length) break;
      maskKey = buffer.subarray(cursor, cursor + 4);
      cursor += 4;
    }

    if (cursor + payloadLength > buffer.length) break;
    const payload = buffer.subarray(cursor, cursor + payloadLength);
    cursor += payloadLength;

    if (masked && maskKey) {
      for (let i = 0; i < payload.length; i += 1) {
        payload[i] ^= maskKey[i % 4];
      }
    }

    onFrame(opcode, payload);
    offset = cursor;
  }
}

function handleUpgrade(req, socket) {
  const upgradeHeader = String(req.headers.upgrade || "").toLowerCase();
  const wsKey = String(req.headers["sec-websocket-key"] || "").trim();
  if (upgradeHeader !== "websocket" || !wsKey) {
    socket.destroy();
    return;
  }

  const requestUrl = new URL(req.url || "/", "http://localhost");
  if (requestUrl.pathname !== "/ws/stock-updates") {
    socket.destroy();
    return;
  }

  const branch = normalizeBranch(requestUrl.searchParams.get("branch"));
  const accept = crypto
    .createHash("sha1")
    .update(wsKey + WS_MAGIC_KEY)
    .digest("base64");

  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      "\r\n"
    ].join("\r\n")
  );

  const client = { socket, branch };
  clients.add(client);

  sendJson(socket, {
    type: "stock:connected",
    branch,
    at: new Date().toISOString()
  });

  socket.on("data", (chunk) => {
    parseWsFrames(chunk, (opcode, payload) => {
      if (opcode === 0x8) {
        socket.end(createFrame(Buffer.alloc(0), 0x8));
      } else if (opcode === 0x9) {
        socket.write(createFrame(payload, 0xA));
      }
    });
  });

  socket.on("close", () => removeClient(client));
  socket.on("error", () => removeClient(client));
  socket.on("end", () => removeClient(client));
}

function attachStockRealtime(server) {
  server.on("upgrade", (req, socket) => {
    try {
      handleUpgrade(req, socket);
    } catch {
      socket.destroy();
    }
  });
}

function publishStockUpdate({ branch, source }) {
  const normalizedBranch = normalizeBranch(branch);
  const payload = {
    type: "stock:update",
    branch: normalizedBranch,
    source: String(source || "unknown"),
    at: new Date().toISOString()
  };

  clients.forEach((client) => {
    if (!client || !client.socket || client.socket.destroyed) {
      clients.delete(client);
      return;
    }
    if (client.branch !== "all" && client.branch !== normalizedBranch) return;
    sendJson(client.socket, payload);
  });
}

module.exports = { attachStockRealtime, publishStockUpdate };
