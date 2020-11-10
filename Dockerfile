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

#Fix puppeteer error: https://raheemmi.tech.blog/2018/11/13/puppeteer-error-chrome-error-while-loading-shared-libraries-libraries-libxtst-so-6-16-04/
RUN apt-get install -y libpangocairo-1.0-0 libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 libgconf2-4 libasound2 libatk1.0-0 libgtk-3-0

USER accelerator
COPY . .

EXPOSE 8080
CMD [ "node", "server.js" ]
