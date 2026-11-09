# Team Notes

<img width="1507" height="760" alt="Screenshot 2026-11-09 at 15 42 34" src="https://github.com/user-attachments/assets/14a25b21-72c7-422b-9f7a-101d7f279f8d" />

Team meeting notes. Pick a team and role, get a token, then use the web app or an AI assistant (MCP).

**How it works:** each team keeps its meeting notes in one shared place. When you sign in, you choose your team and your role. Your role decides what you can do: viewers can read their team's notes, editors can also write new ones, and admins can read every team's notes and delete their own team's. You can use the app in your browser, or ask an AI assistant like Claude to find, add or delete notes for you, with the same permissions.

## Roles

| Role | Sees | Create | Delete |
|---|---|---|---|
| admin | all teams | ✅ | own team only |
| editor | own team | ✅ | ❌ |
| viewer | own team | ❌ | ❌ |

## Architecture
<img width="3160" height="3661" alt="compacted-architecture" src="https://github.com/user-attachments/assets/74543cdb-8040-4dcb-bd23-b9e31f45b8bb" />

- **auth-service:** creates its RSA key on first start, issues 1-hour tokens with `teamId` and `role`.
- **notes-service:** the only place access rules are enforced.
- **frontend:** React, Redux Toolkit + saga, Tailwind, `<team-badge>` Web Component.
- **mcp-server:** notes as LLM tools, with friendly permission messages.
- **Cross-cutting:** pino logs with request and trace ids, Swagger docs, Vitest + Playwright tests.

## Run

```sh
docker compose up --build -d     # start everything
docker compose down              # stop (add -v to wipe data)
```

| | URL |
|---|---|
| Web app | http://localhost:8080 |
| Swagger (auth / notes) | http://localhost:4000/docs, http://localhost:3000/docs |
| MCP | http://localhost:5000/mcp (send `Authorization: Bearer <token>`) |
| Grafana | http://localhost:3300 |

**Local dev:** run `npm install && npm run dev` in `auth-service`, `notes-service`, `frontend-service` (http://localhost:5173) and, if needed, `mcp-server`. Start auth-service first. No `.env` is needed.

## Connect an AI agent (Claude)

<img width="1503" height="890" alt="Screenshot 2026-11-09 at 10 46 15" src="https://github.com/user-attachments/assets/aff242c7-458d-4712-813f-89bd1d4cae3f" />
<br>
<img width="1505" height="893" alt="Screenshot 2026-11-09 at 10 52 00" src="https://github.com/user-attachments/assets/a893df72-b1ed-4f85-a926-9683fb449381" />

<br>

1. **Get a token:** sign in at http://localhost:8080 with a team and role, then click **Copy token**. The agent gets exactly that team's and role's access, for 1 hour.
2. **Make the MCP server reachable:** Claude needs a public URL, not `localhost`, so forward the MCP port with ngrok:
   ```sh
   ngrok http 5000      # gives e.g. https://<your-name>.ngrok-free.dev
   ```
3. **Add it to Claude**, with the token in the header:
   ```sh
   claude mcp add --transport http your-mcp-server-name --scope user https://<your-name>.ngrok-free.dev/mcp --header "Authorization: Bearer <token>"
   ```

Then ask Claude things like "list my team's notes". When the token expires, get a new one and re-add the server.

## Test

<img width="698" height="714" alt="Screenshot 2026-11-09 at 11 02 45" src="https://github.com/user-attachments/assets/2ede82fe-c64d-4b42-8348-5803a04a0a73" />

<img width="988" height="546" alt="Screenshot 2026-11-09 at 08 39 42" src="https://github.com/user-attachments/assets/cbd0ce3f-243f-4f02-b505-d72a141db530" />


<br>

```sh
cd e2e && ./run.sh              # all: service tests, then UI tests (Docker)
SKIP_SERVICE_TESTS=1 ./run.sh   # UI tests only (Playwright, Docker)

cd auth-service && npm test     # one service: unit + integration (Vitest, no Docker)
cd notes-service && npm test
```

`frontend-service` and `mcp-server` have no unit tests yet.

## Security

- **Private key signs, public key verifies.** auth-service creates an RSA key pair on first start and signs every token (RS256) with the private key. The private key never leaves auth-service; it sits in its own Docker volume.
- **Public key is shared.** auth-service publishes only the public key at `/.well-known/jwks.json`. notes-service fetches it and uses it to check each token's signature. It can verify tokens but can't create them.
- **Every request is checked** by notes-service: a valid signature, not expired, issued by `auth-service` for `notes-service`, and a known role. Tokens using any other algorithm are rejected.
- **Access is decided in one place:** notes-service applies the team and role rules. The web app and the MCP server only pass the token on.
- **Not production-ready yet:** anyone can request a token for any team and role. Real login is the next step (see [ARCHITECTURE.md](ARCHITECTURE.md)).

## Observability

<img width="1501" height="781" alt="Screenshot 2026-11-09 at 15 55 08" src="https://github.com/user-attachments/assets/46a07969-cc68-4985-9535-3def88c90c05" />

<br>
Open Grafana at http://localhost:3300 (no login). The **Team Notes** dashboard shows requests per second, latency and errors for each service, plus live logs.

- **Traces (Tempo):** follow one request across services, e.g. an MCP call into notes-service.
- **Logs (Loki):** every service's logs. Each line has a **Trace** link.
- **Metrics (Prometheus):** request counts, latency and status codes.

The services send all three through an OpenTelemetry Collector. It's turned on in `docker-compose.yml`, with no code in the services; `npm run dev` and the tests send nothing. Configs are in `observability/`.

## Later

- Real login instead of open token minting; key rotation.
- MCP gets its own token instead of passing the user's on.
- Postgres + migrations; note editing, authors, tags, pagination.
- Health checks, CI running `e2e/run.sh`, alerts.

[Open the diagram in Excalidraw](https://excalidraw.com/#json=P1v-XHk2aWPFSR4lL3NP5,XWwb1OWtfCnTjm5EZhJyLA).
