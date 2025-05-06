from django.urls import path
from . import views

urlpatterns = [
    path('video/compress/', views.CompressionView.as_view(), name='compress'),
    path('video/<file_name>/', views.VideoView.as_view(), name='video'),
    path('video/frames/<file_name>', views.CompressionFramesView.as_view(), name='video_frames'),
    path('video/example', views.ExampleVideosView.as_view(), name='example_videos'),
]
