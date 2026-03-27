# Panoptics Infrastructure Hub v2

Daily checks portal rewritten in **Next.js 14 · TypeScript · Tailwind CSS · Prisma · PostgreSQL**.

## Quick start

```bash
cp .env.example .env.local   # fill in DATABASE_URL and password
npm install
npx prisma migrate dev --name init
npm run dev
```

## Auth modes

Set `NEXT_PUBLIC_AUTH_MODE` to `local`, `sso`, or `both`.

## Deploy

```bash
npm run build && npm start
```

Runs as a standard Node.js server. Drop onto any VM, Railway, Render, or Docker.
