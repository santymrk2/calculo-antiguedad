# ---- Build frontend ----
FROM oven/bun:1.2 AS builder
WORKDIR /app

COPY seem-much/package.json seem-much/bun.lock ./
RUN bun install --frozen-lockfile

COPY seem-much/ .
RUN bunx vite build

# ---- Runtime ----
FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .
COPY legajo/ legajo/
COPY --from=builder /app/dist seem-much/dist/

RUN mkdir -p datos_locales && chmod 755 datos_locales

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

EXPOSE 3000
VOLUME /app/datos_locales

USER nobody

ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["python3", "server.py"]