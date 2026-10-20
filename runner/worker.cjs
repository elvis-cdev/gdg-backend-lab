// Restricted local runner API. Keep private; do not expose Docker itself.
"use strict";

const http = require("node:http");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 8787);
const TOKEN = process.env.RUNNER_TOKEN;
const WORK_ROOT = path.resolve(
  process.env.RUNNER_WORK_DIR || path.join(__dirname, "..", "runner-jobs")
);
const MAX_BODY = 65000;
const MAX_FILE = 30000;
const MAX_FILES = 5;
const MAX_CONCURRENT = 2;
const TIMEOUT_MS = 5000;

let activeJobs = 0;

function send(res, status, data) {
  if (res.destroyed || res.writableEnded) return;
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  res.end(JSON.stringify(data));
}

function safeEq(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];

    req.on("data", chunk => {
      size += chunk.length;

      if (size > MAX_BODY) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }

      if (!tooLarge) chunks.push(chunk);
    });

    req.on("end", () => {
      if (tooLarge) return reject(new Error("large"));
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    req.on("error", reject);
    req.on("aborted", () => reject(new Error("aborted")));
  });
}

function run(files) {
  return new Promise(resolve => {
    const started = Date.now();
    const id = `gdg-${process.pid}-${crypto.randomBytes(8).toString("hex")}`;
    const jobDir = path.join(WORK_ROOT, id);
    let stdout = "";
    let stderr = "";
    let finished = false;
    let timedOut = false;
    let timer;
    let child;

    function append(current, chunk) {
      return current.length >= 12000
        ? current
        : current + chunk.toString().slice(0, 12000 - current.length);
    }

    function finish(code, errorText = stderr) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);

      // Kill/remove the named container before removing its host files.
      const cleanup = spawn("docker", ["rm", "-f", id], {
        stdio: "ignore"
      });

      cleanup.on("error", () => cleanupWorkspace());
      cleanup.on("close", () => cleanupWorkspace());

      function cleanupWorkspace() {
        try {
          fs.rmSync(jobDir, { recursive: true, force: true });
        } catch {}

        activeJobs = Math.max(0, activeJobs - 1);
        resolve({
          exitCode: timedOut ? 124 : code,
          stdout,
          stderr: timedOut
            ? (errorText + "\nExecution timed out after 5 seconds").trim()
            : errorText,
          durationMs: Date.now() - started
        });
      }
    }

    try {
      fs.mkdirSync(jobDir, { recursive: false, mode: 0o700 });

      for (const [name, content] of Object.entries(files)) {
        if (
          !/^[a-zA-Z0-9_-][a-zA-Z0-9._-]{0,79}$/.test(name) ||
          name.startsWith(".") ||
          name === ".."
        ) {
          throw new Error("Invalid filename");
        }

        fs.writeFileSync(path.join(jobDir, name), content, {
          encoding: "utf8",
          mode: 0o444,
          flag: "wx"
        });
      }

      // The unprivileged container must be able to traverse/read this
      // directory. Its random name and parent directory remain private.
      fs.chmodSync(jobDir, 0o755);
    } catch (error) {
      try {
        fs.rmSync(jobDir, { recursive: true, force: true });
      } catch {}

      activeJobs = Math.max(0, activeJobs - 1);
      return resolve({
        exitCode: null,
        stdout: "",
        stderr: "Workspace setup failed: " + error.message,
        durationMs: Date.now() - started
      });
    }

    const args = [
      "run",
      "--name", id,
      "--network=none",
      "--memory=96m",
      "--memory-swap=96m",
      "--cpus=0.50",
      "--pids-limit=32",
      "--read-only",
      "--tmpfs", "/tmp:rw,noexec,nosuid,size=8m",
      "--cap-drop=ALL",
      "--security-opt=no-new-privileges",
      "--user", "10001:10001",
      "--workdir", "/work",
      "--mount", `type=bind,src=${jobDir},dst=/work,readonly`,
      "node:22-alpine",
      "node",
      "/work/server.js"
    ];

    child = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"] });

    timer = setTimeout(() => {
      timedOut = true;

      // Stop the container through the Docker CLI, not just the client.
      const killer = spawn("docker", ["kill", id], { stdio: "ignore" });
      killer.on("error", () => {
        if (child && !child.killed) child.kill("SIGKILL");
      });
    }, TIMEOUT_MS);

    child.stdout.on("data", chunk => {
      stdout = append(stdout, chunk);
    });

    child.stderr.on("data", chunk => {
      stderr = append(stderr, chunk);
    });

    child.on("error", error => {
      finish(null, "Runner launch failed: " + error.message);
    });

    child.on("close", code => {
      finish(code);
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/run") {
    return send(res, 404, { error: "Not found" });
  }

  if (!TOKEN || TOKEN.length < 32) {
    return send(res, 503, { error: "Runner token is not configured securely" });
  }

  if (activeJobs >= MAX_CONCURRENT) {
    return send(res, 429, { error: "Runner is busy; try again shortly" });
  }

  let raw;
  try {
    raw = await readBody(req);
  } catch {
    return send(res, 413, { error: "Request too large or incomplete" });
  }

  const ts = req.headers["x-runner-timestamp"];
  const sig = req.headers["x-runner-signature"];

  if (
    typeof ts !== "string" ||
    !/^\d{13}$/.test(ts) ||
    Math.abs(Date.now() - Number(ts)) > 60000 ||
    typeof sig !== "string" ||
    !/^[a-f0-9]{64}$/.test(sig)
  ) {
    return send(res, 401, { error: "Invalid signature timestamp" });
  }

  const expected = crypto
    .createHmac("sha256", TOKEN)
    .update(ts + "." + raw)
    .digest("hex");

  if (!safeEq(sig, expected)) {
    return send(res, 401, { error: "Invalid signature" });
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return send(res, 400, { error: "Invalid JSON" });
  }

  if (
    !data ||
    !data.files ||
    typeof data.files !== "object" ||
    Array.isArray(data.files) ||
    typeof data.files["server.js"] !== "string"
  ) {
    return send(res, 400, { error: "A server.js file is required" });
  }

  const entries = Object.entries(data.files);
  if (
    entries.length > MAX_FILES ||
    entries.some(([name, content]) =>
      !/^[a-zA-Z0-9_-][a-zA-Z0-9._-]{0,79}$/.test(name) ||
      name.startsWith(".") ||
      typeof content !== "string" ||
      Buffer.byteLength(content, "utf8") > MAX_FILE
    ) ||
    entries.reduce((total, [, content]) =>
      total + Buffer.byteLength(content, "utf8"), 0) > 60000
  ) {
    return send(res, 400, { error: "Workspace files exceed policy" });
  }

  activeJobs++;
  const result = await run(data.files);
  return send(res, 200, result);
});

server.requestTimeout = 10000;
server.headersTimeout = 12000;

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Runner API listening on 127.0.0.1:${PORT}`);
});
