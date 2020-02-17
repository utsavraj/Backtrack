from django.http import HttpResponseRedirect
from django.contrib.auth.models import User
from rest_framework import permissions, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserSerializer, UserSerializerWithToken
from projects.models import ProductOwner, Developer, ScrumMaster
from django.contrib.auth.models import User


@api_view(['GET'])
def current_user(request):
    """
    Determine the current user by their token, and return their data
    """

    serializer = UserSerializer(request.user)
    return Response(serializer.data)


class UserList(APIView):
    """
    Create a new user. It's called 'UserList' because normally we'd have a get
    method here too, for retrieving a list of all User objects.
    """

    permission_classes = (permissions.AllowAny,)

    def post(self, request, format=None):
        serializer = UserSerializerWithToken(data=request.data)
        if serializer.is_valid():
            serializer.save()
            role = request.data["role"]
            print(role)
            user = User.objects.get(username=str(request.data["username"]))
            print(request.data["username"])
            if role == "Developer":
                r = Developer(author=user)
                r.save()
            elif role == "Product Owner":
                r = ProductOwner(author=user)
                r.save()
            else:
                r = ScrumMaster(author=user)
                r.save()
            print(r)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)