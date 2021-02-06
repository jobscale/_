FROM node:lts-buster-slim
SHELL ["bash", "-c"]
WORKDIR /root
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get install -y locales vim curl git zip unzip net-tools dnsutils netcat procps
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/$( \
      curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt \
    )/bin/linux/amd64/kubectl \
 && chmod +x kubectl \
 && mv kubectl /usr/local/bin
RUN sed -i -e 's/# ja_JP.UTF-8 UTF-8/ja_JP.UTF-8 UTF-8/' /etc/locale.gen && locale-gen && update-locale LANG=ja_JP.UTF-8
RUN echo -e "export LANG=ja_JP.UTF-8\nexport TZ=Asia/Tokyo\numask u=rwx,g=rx,o=rx" | tee -a /root/.bashrc
COPY x /root/x
CMD ["./x"]
