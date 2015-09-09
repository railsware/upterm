FROM node
RUN ping -c 10 8.8.8.8
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update
RUN apt-get install -y sudo openjdk-7-jdk xorg xvfb xserver-xorg-video-dummy
RUN useradd -m -G users testrunner
ADD entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT /entrypoint.sh
