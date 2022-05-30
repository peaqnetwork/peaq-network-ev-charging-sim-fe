FROM node:16.13.0-alpine3.14 as builder

ADD . /peaq/simulator-frontend

WORKDIR /peaq/simulator-frontend

RUN npm install 
RUN npm run build

FROM nginx:stable-alpine
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /peaq/simulator-frontend/dist /usr/share/nginx/html
COPY --from=builder /peaq/simulator-frontend/.env.sample /usr/share/nginx/html/.env

RUN apk add --update nodejs
RUN apk add --update npm
RUN npm i -g runtime-env-cra

WORKDIR /usr/share/nginx/html

EXPOSE 80
CMD ["/bin/sh", "-c", "runtime-env-cra --env-file && nginx -g \"daemon off;\""]
