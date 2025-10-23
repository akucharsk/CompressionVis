from django.urls import path
from . import views

urlpatterns = [
    path('<int:video_id>/', views.MacroBlockView.as_view(), name='macroblocks'),
    path('details', views.MacroBlockDetailsView.as_view(), name='macroblock_details'),
    path('grid/<int:video_id>/<int:frame_number>/', views.MacroBlockGridView.as_view(), name='macroblock_motion_vectors')
]
