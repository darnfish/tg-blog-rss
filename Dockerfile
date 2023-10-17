FROM node:18

WORKDIR /usr/src/app
COPY . .

RUN yarn

EXPOSE 4000

CMD node .
