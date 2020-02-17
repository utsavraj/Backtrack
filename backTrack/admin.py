from django.contrib import admin

# Register your models here.
from .models import *
# Register your models to admin site, then you can add, edit, delete and search your models in Django admin site.
admin.site.register(Product)
admin.site.register(Pbi)
admin.site.register(PbiTasks)
admin.site.register(TeamMember)
admin.site.register(ProductOwner)
admin.site.register(Developer)
admin.site.register(ScrumMaster)