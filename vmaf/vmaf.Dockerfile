FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    git \
    python3 \
    python3-pip \
    meson \
    ninja-build \
    doxygen \
    nasm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /vmaf
RUN git clone --depth 1 https://github.com/Netflix/vmaf.git .
RUN pip3 install -r python/requirements.txt
RUN cd libvmaf && meson setup --buildtype=release build && ninja -C build && ninja -C build install

ENV PATH="/vmaf:/vmaf/wrapper:${PATH}"
ENV PYTHONPATH="/vmaf/python/src:${PYTHONPATH}"

CMD ["tail", "-f", "/dev/null"]