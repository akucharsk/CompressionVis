from django.urls import path
from . import views

urlpatterns = [
    path('video/compress/', views.CompressionView.as_view(), name='compress'),
    path('video/<int:video_id>/', views.VideoView.as_view(), name='video'),
    # path('compressed_video/<int:video_id>/', views.CompressedVideoView.as_view(), name='compressed_video'),
    path('video/frames/<int:video_id>/', views.CompressionFramesView.as_view(), name='video_frames'),
    path('video/example/', views.ExampleVideosView.as_view(), name='example_videos'),
    path('video/thumbnail/<int:video_id>/', views.ThumbnailView.as_view(), name='thumbnail'),
    path('frames/<int:video_id>/<int:frame_number>/', views.FrameView.as_view(), name='frames'),
    # path('buffering_frames/<int:video_id>/<int:frame_number>/', views.BufferingFramesView.as_view(), name='buffering_frames'),
    path('metrics/<int:video_id>/', views.MetricView.as_view(), name='metrics'),
    path('metrics/frame/<int:video_id>/<int:frame_number>', views.FrameMetricView.as_view(), name='frame_metrics'),
    path('video/best-parameters/<int:video_id>/', views.ParametersView.as_view(), name='best_parameters'),
    path('video/size/<int:video_id>/', views.SizeView.as_view(), name='video_size'),
    path('video/size-compress/', views.SizeCompressionView.as_view(), name='size_compress'),
]
