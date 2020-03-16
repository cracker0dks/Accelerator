FROM node:12

MAINTAINER fh-reutlingen

#INSTALL DEPS for doc/pdf convertion
RUN apt-get update && apt-get install -y unoconv nano

# Create app directory
RUN mkdir -p /opt/app
WORKDIR /opt/app

# Install app dependencies
COPY ./package.json /opt/app
RUN npm install

# Bundle app source
COPY . /opt/app

EXPOSE 443
CMD [ "npm", "start" ]