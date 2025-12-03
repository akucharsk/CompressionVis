FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    git \
    ninja-build \
    meson \
    pkg-config \
    build-essential \
    yasm nasm \
    libtool autoconf automake cmake \
    ca-certificates \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /vmaf
RUN git clone --depth 1 https://github.com/Netflix/vmaf.git .
WORKDIR /vmaf/libvmaf
RUN meson build --buildtype release
RUN ninja -vC build
RUN ninja -vC build install
RUN ldconfig

WORKDIR /x264
RUN git clone --depth 1 https://code.videolan.org/videolan/x264.git .
RUN ./configure --prefix=/usr/local --enable-shared
RUN make -j"$(nproc)" && make install
RUN ldconfig

WORKDIR /ffmpeg
RUN git clone --depth 1 https://github.com/FFmpeg/FFmpeg.git .
RUN ./configure \
    --enable-gpl \
    --enable-nonfree \
    --enable-libx264 \
    --enable-libvmaf \
    --enable-version3

RUN make -j$(nproc)
RUN make install

WORKDIR /app

COPY . .
RUN pip install -r requirements.txt

EXPOSE 8000
CMD ["celery", "-A", "compression_vis", "worker", "-l", "info"]
