from django.urls import path
from . import views

urlpatterns = [
    path('video/compress/', views.CompressionView.as_view(), name='compress'),
    path('video/<int:video_id>/', views.VideoView.as_view(), name='video'),
    path('video/frames/<int:video_id>/', views.CompressionFramesView.as_view(), name='video_frames'),
    path('video/example/', views.ExampleVideosView.as_view(), name='example_videos'),
    path('video/thumbnail/<int:video_id>/', views.ThumbnailView.as_view(), name='thumbnail'),
    path('frames/<int:video_id>/<int:frame_number>/', views.FrameView.as_view(), name='frames'),
    path('frames/<int:video_id>/<int:frame_number>/url', views.FrameStatusView.as_view(), name='frames-status'),
    path('metrics/<int:video_id>/', views.MetricView.as_view(), name='metrics'),
    path('metrics/frames/<int:video_id>/<int:frame_number>', views.FrameMetricView.as_view(), name='frame_metrics'),
    path('metrics/frames/<int:video_id>/all', views.AllFramesMetricsView.as_view(), name='all_metrics'),
    path('video/size/<int:video_id>/', views.SizeView.as_view(), name='video_size'),
    path('video/size-compress/', views.SizeCompressionView.as_view(), name='size_compress'),
    path('video/parameters/<int:video_id>/', views.VideoParameters.as_view(), name='video_parameters'),
    path('video/all-compressed-videos/', views.AllCompressed.as_view(), name='all_compressed_video'),
    path('video/delete/<int:video_id>/', views.DeleteVideoView.as_view(), name='delete_video'),
    path('frame/size/<int:video_id>/<int:frame_number>/', views.FrameSizeView.as_view(), name='frame_size'),
    path("upload-questions/", views.UploadQuestionsView.as_view()),
    path("questions/<int:number>/", views.GetQuestionsView.as_view()),
    path("download-questions/", views.DownloadQuestionsZipView.as_view()),
]
