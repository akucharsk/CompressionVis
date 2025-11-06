from django.urls import path
from . import views

urlpatterns = [
    path('<int:video_id>/<int:frame_number>/', views.MacroBlockView.as_view(), name='macroblock_motion_vectors')
]
