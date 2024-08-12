FROM node:20-alpine as base
WORKDIR /usr/app/
COPY package*.json tsconfig*.json ./

FROM base as dev
RUN npm install
COPY . .
RUN npm run build

FROM base as prod
RUN npm install --omit=dev

FROM base
COPY --from=dev /usr/app/dist ./dist
COPY --from=prod /usr/app/node_modules  ./node_modules

CMD npm run start:prod