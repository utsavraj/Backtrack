from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class ProductOwner(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)

class Developer(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)

class ScrumMaster(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)


class Product(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_on = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    product_owner = models.ForeignKey(ProductOwner, on_delete=models.CASCADE, null=True)
    scrum_master = models.ForeignKey(ScrumMaster, on_delete=models.CASCADE, null=True)
    ongoingSprint = models.IntegerField(default=1)
    sprintCapacity = models.IntegerField(default=100)

    class Meta:
        ordering = ['created_on']

        def __unicode__(self):
            return self.title

class TeamMember(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

class Pbi(models.Model):
    title = models.CharField(max_length=120) #max_length=required
    description = models.TextField(blank=True, null=True)
    status = models.CharField(default="Not Started", max_length= 120)
    priority = models.IntegerField(default=1)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    storyPoints = models.IntegerField(default=0, null=True)
    checked = models.BooleanField(default=False)
    completedSprint = models.IntegerField(default=-1)

class PbiTasks(models.Model):
    title = models.CharField(max_length=120) #max_length=required
    description = models.TextField(blank=True, null=True)
    status = models.CharField(default="Not Started", max_length= 120)
    Pbi = models.ForeignKey(Pbi, on_delete=models.CASCADE)
    storyPoints = models.IntegerField(default=0, null=True)
    completed = models.BooleanField(default=False)
    assigined_team_member = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
