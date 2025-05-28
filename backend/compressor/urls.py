from django.urls import path
from . import views

urlpatterns = [
    path('video/compress/', views.CompressionView.as_view(), name='compress'),
    path('video/<file_name>/', views.VideoView.as_view(), name='video'),
    path('video/frames/<file_name>/', views.CompressionFramesView.as_view(), name='video_frames'),
    path('video/example', views.ExampleVideosView.as_view(), name='example_videos'),
    path('video/thumbnail/<file_name>/', views.ThumbnailView.as_view(), name='thumbnail'),
    path('frames/<dirname>/<frame_name>/', views.FrameView.as_view(), name='frames'),
    path('metrics/<video_name>/', views.MetricView.as_view(), name='metrics'),
    path('metrics/frame/<video_name>/<int:frame_num>', views.FrameMetricView.as_view(), name='frame_metrics'),
]
