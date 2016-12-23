FROM node:4
ADD index.js index.js
ADD package.json package.json
RUN npm install
EXPOSE 3000
CMD ["node", "index.js"]
