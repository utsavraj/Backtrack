# Generated by Django 2.2.7 on 2019-11-24 08:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0008_auto_20191117_2257'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='created_on',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
    ]