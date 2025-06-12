FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    python3-pip \
    meson \
    ninja-build \
    doxygen \
    nasm \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Build and install VMAF inside backend
WORKDIR /vmaf
RUN git clone --depth 1 https://github.com/Netflix/vmaf.git . \
    && pip install -r python/requirements.txt \
    && cd libvmaf && meson setup --buildtype=release build \
    && ninja -C build && ninja -C build install

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.uv /app/
RUN pip install --upgrade pip && pip install -r requirements.uv

COPY . /app

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]