# ── Build ─────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Le variabili PUBLIC_* e SITE_URL vengono "incollate" nel sito in fase di build
ARG SITE_URL
ARG PUBLIC_WHATSAPP_NUMBER
ARG PUBLIC_CONTACT_EMAIL
ARG PUBLIC_CONTACT_PHONE
ARG PUBLIC_GA_MEASUREMENT_ID
ARG PUBLIC_PLAUSIBLE_DOMAIN
ENV SITE_URL=$SITE_URL PUBLIC_WHATSAPP_NUMBER=$PUBLIC_WHATSAPP_NUMBER PUBLIC_CONTACT_EMAIL=$PUBLIC_CONTACT_EMAIL \
    PUBLIC_CONTACT_PHONE=$PUBLIC_CONTACT_PHONE PUBLIC_GA_MEASUREMENT_ID=$PUBLIC_GA_MEASUREMENT_ID PUBLIC_PLAUSIBLE_DOMAIN=$PUBLIC_PLAUSIBLE_DOMAIN
RUN npm run build

# ── Runtime ───────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
# I segreti SMTP_* / INQUIRY_* si passano a runtime (docker run -e … oppure env_file), mai nell'immagine.
USER node
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
