FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache imagemagick
# Copy sources and build sources
WORKDIR /cestmaddy
COPY package.json package.json
RUN npm i

COPY tsconfig.json tsconfig.json
COPY core core
RUN npm run build

EXPOSE 80
ENV PORT=80
CMD npm start
