FROM node:13-slim

RUN apt-get update \
&& apt-get install -y --no-install-recommends \
# Install unoconv and LibreOffice for document to PDF conversion
unoconv \
libreoffice-writer \
libreoffice-draw \
libreoffice-calc \
libreoffice-impress \
# Install Chromium for puppeteer
chromium \
&& rm -rf /var/lib/apt/lists/*

# Install Orb deps for puppeteer https://circleci.com/developer/orbs/orb/threetreeslight/puppeteer
RUN apt-get install -yq \
gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates \
fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# Use Debian Chromium package instead of bundled Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm install \
&& groupadd -r accelerator && useradd -r -g accelerator -G audio,video accelerator \
&& mkdir -p /home/accelerator/Downloads \
&& chown -R accelerator:accelerator /home/accelerator \
&& chown -R accelerator:accelerator /app

USER accelerator
COPY . .

EXPOSE 8080
CMD [ "node", "server.js" ]
