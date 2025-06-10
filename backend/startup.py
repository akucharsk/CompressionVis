from compressor import models  # zmień 'yourapp' na nazwę swojej aplikacji Django

models.Video.objects.all().delete()

for i in range(1, 5):
    models.Video.objects.create(filename=f"example{i}.mp4", width=1920, height=1080)
exit()