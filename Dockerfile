#FROM node:18-alpine AS dev
#ENV NODE_ENV=development
#RUN apk update && apk add --no-cache \
#  build-base \
#  gcc \
#  autoconf \
#  automake \
#  zlib-dev \
#  libpng-dev \
#  vips-dev \
#  git \
#  python3
#
#WORKDIR /app
#COPY package.json yarn.lock ./
#RUN yarn install
#COPY . .
#RUN yarn db:generate || echo "Skipping Prisma generate"
#
#EXPOSE 1337
#CMD ["yarn", "dev"]

# Creating multi-stage build for production
FROM node:18-alpine AS build
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git > /dev/null 2>&1
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/
# COPY package.json yarn.lock ./
COPY package.json ./
RUN yarn global add node-gyp
RUN yarn config set network-timeout 600000 -g && yarn install --production
ENV PATH=/opt/node_modules/.bin:$PATH
WORKDIR /opt/app
COPY . .
RUN yarn db:generate
RUN yarn build

# Creating final production image
FROM node:20-alpine
RUN apk add --no-cache vips-dev
ENV NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /opt/
COPY --from=build /opt/node_modules ./node_modules
WORKDIR /opt/app
COPY --from=build /opt/app ./
ENV PATH=/opt/node_modules/.bin:$PATH

RUN chown -R node:node /opt/app
USER node
EXPOSE 1337
CMD ["yarn", "start"]