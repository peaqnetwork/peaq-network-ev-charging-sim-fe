FROM node:16.13.0-alpine3.14 as builder

ADD . /peaq/simulator-frontend

WORKDIR /peaq/simulator-frontend

RUN npm run dumpenv
RUN npm install 
RUN npm run build

FROM nginx:stable-alpine
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /peaq/simulator-frontend/dist /usr/share/nginx/html

EXPOSE 80

