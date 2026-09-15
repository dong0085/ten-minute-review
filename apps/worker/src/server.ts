import http from "node:http";

export function startHealthServer(port: number): http.Server {
  const server = http.createServer((request, response) => {
    if (request.url === "/health" || request.url === "/") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          status: "ok",
          service: "ten-minutes-review-worker",
          uptimeSeconds: Math.round(process.uptime()),
        }),
      );
      return;
    }
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "not found" }));
  });

  server.listen(port, () => {
    console.log(`[worker] health server listening on :${port}`);
  });

  return server;
}
