from django.urls import path
from . import views

urlpatterns = [
    path('video/compress/', views.CompressionView.as_view(), name='compress'),
    path('video/<file_name>/', views.VideoView.as_view(), name='video'),
]
