FROM node:22-alpine
RUN addgroup -S runner && adduser -S runner -G runner
WORKDIR /work
USER runner
ENV NODE_ENV=production
CMD ["node", "/runner/worker.js"]
