from django.urls import path
from . import views

urlpatterns = [
    path('', views.MacroBlockView.as_view(), name='macroblocks')
]
