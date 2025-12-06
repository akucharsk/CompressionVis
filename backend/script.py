from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

print(User.objects.get(username="admin").password)