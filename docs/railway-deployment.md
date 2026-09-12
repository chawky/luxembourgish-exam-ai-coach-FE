# Railway deployment

The frontend container serves Angular through Nginx and proxies browser calls from `/api/*` to the backend service.

The Dockerfile defaults to `PORT=80` for local Docker, while Railway overrides `PORT` at runtime.

Set this environment variable on the Railway frontend service:

```text
BACKEND_URL=http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:${{backend.PORT}}
```

Replace `backend` with the actual Railway backend service name if it differs.
Use the backend service's Railway private networking address, not the Docker Compose hostname `backend`.

Keep frontend API calls relative to `/api` so the browser talks to one origin:

```text
Browser -> frontend Railway service /api -> Nginx -> backend Railway private network
```

For local Docker Compose, the Dockerfile default remains:

```text
BACKEND_URL=http://backend:8080
```
