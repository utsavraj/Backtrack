from rest_framework import serializers
from .models import Product, Pbi as PBI, PbiTasks, TeamMember


class ProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = ('title', 'content', 'created_on', 'author', 'id', 'ongoingSprint', 'sprintCapacity')

class PBISerializer(serializers.ModelSerializer):

    class Meta:
        model = PBI
        fields = ('title', 'description', 'status', 'priority', 'id', 'storyPoints', 'checked', 'completedSprint')

class PbiTaskSerializer(serializers.ModelSerializer):

        class Meta:
            model = PbiTasks
            fields = ('title', 'description', 'status', 'id', 'storyPoints', 'assigined_team_member', 'completed')

class TeamMemberSerializer(serializers.ModelSerializer):

    class Meta:
            model = TeamMember
            fields = ('author', 'product')