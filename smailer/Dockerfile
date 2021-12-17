FROM node:latest
WORKDIR /app
COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json
RUN npm install
COPY ./*.js /app/
ENTRYPOINT ["node"]
CMD ["index.js"]