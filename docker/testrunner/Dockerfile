FROM node
ENV DEBIAN_FRONTEND=noninteractive
RUN npm install -g selenium-standalone
RUN apt-get update
RUN apt-get install -y sudo openjdk-7-jdk xorg xvfb xserver-xorg-video-dummy
RUN useradd -m -G users testrunner
ADD entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT /entrypoint.sh
