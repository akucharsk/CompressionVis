FROM nvidia/cuda:12.6.2-devel-ubuntu22.04

USER root

RUN apt-get update && apt-get install -y \
    git \
    ninja-build \
    meson \
    libgnutls28-dev \
    pkg-config \
    build-essential \
    yasm nasm \
    libtool autoconf automake cmake \
    unzip wget libnuma1 libnuma-dev \
    xxd pkg-config \
    libc6 libc6-dev \
    ca-certificates \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libpng-dev \
    python3 python3-pip \
    libx264-dev libx265-dev \
    libnvidia-encode-570 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /nv-codec-headers
RUN git clone --depth 1 https://github.com/FFmpeg/nv-codec-headers.git .
RUN make install
RUN ldconfig

WORKDIR /vmaf
RUN git clone --depth 1 https://github.com/Netflix/vmaf.git .
WORKDIR /vmaf/libvmaf
RUN meson setup \
    build . \
    --prefix=/usr/local \
    --libdir=/usr/local/lib \
    --default-library=shared \
    -Denable_tests=false \
    -Denable_cuda=true \
    -Denable_avx512=true \
    --buildtype release

RUN ninja -vC build
RUN ninja -vC build install
RUN ldconfig

WORKDIR /ffmpeg
RUN git clone --depth 1 https://github.com/FFmpeg/FFmpeg.git .
RUN ./configure \
    --enable-gpl \
    --enable-gnutls \
    --enable-nonfree \
    --enable-ffnvcodec \
    --enable-cuda-nvcc \
    --enable-libnpp \
    --enable-libx264 \
    --enable-libx265 \
    --enable-nvdec \
    --enable-nvenc \
    --enable-cuvid \
    --enable-cuda \
    --enable-libvmaf \
    --enable-version3 \
    --disable-stripping \
    --enable-static \
    --extra-cflags=-I/usr/local/cuda/include \
    --extra-ldflags=-L/usr/local/cuda/lib64

RUN make -j$(nproc)
RUN make install

WORKDIR /app

COPY . .
RUN pip install -r requirements.txt

EXPOSE 8000
CMD ["celery", "-A", "compression_vis", "worker", "-l", "info"]
