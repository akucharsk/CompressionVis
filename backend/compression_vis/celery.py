import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'compression_vis.settings')
app = Celery('compression_vis')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
