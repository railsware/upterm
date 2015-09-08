FROM node
ENV DEBIAN_FRONTEND=noninteractive
RUN npm install -g selenium-standalone
RUN apt-get update
RUN apt-get install -y sudo openjdk-7-jdk xserver-xorg-video-dummy xorg xvfb
RUN selenium-standalone install
ADD entrypoint.sh /entrypoint.sh
ADD xorg.conf /etc/X11/xorg.conf
RUN chmod +x /entrypoint.sh
RUN useradd -m -G users testrunner
ENTRYPOINT /entrypoint.sh
EXPOSE 4444
