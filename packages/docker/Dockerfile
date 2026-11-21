FROM node:22-alpine
LABEL org.opencontainers.image.title="kitchen-remodeling-cost" \
      org.opencontainers.image.description="Kitchen remodeling cost planner API and calculator page: line-item budget split, sales tax, contingency reserve, permits" \
      org.opencontainers.image.source="https://github.com/nbkdevs/kitchen-remodeling-bellevue" \
      org.opencontainers.image.url="https://wakitchenremodelingbellevue.com/" \
      org.opencontainers.image.documentation="https://wakitchenremodelingbellevue.com/" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="1.0.1" \
      org.opencontainers.image.vendor="Bellevue Kitchen Pros"
WORKDIR /app
# Build context: packages/ (the npm library is copied in, not downloaded)
COPY npm/package.json npm/README.md npm/LICENSE ./node_modules/kitchen-remodeling-cost/
COPY npm/lib ./node_modules/kitchen-remodeling-cost/lib
COPY docker/server.js ./
COPY docker/public ./public
ENV NODE_ENV=production PORT=8080
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["node", "server.js"]
