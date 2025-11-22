from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import PermissionDenied
from library.models import User


class ReaderTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        if self.user.role != "reader":
            raise PermissionDenied("Это логин только для читателей.")

        return data


class LibraryTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        if self.user.role != "library":
            raise PermissionDenied("Это логин только для библиотекарей.")

        return data
    


class ReaderLoginView(TokenObtainPairView):
    serializer_class = ReaderTokenObtainPairSerializer


class LibraryLoginView(TokenObtainPairView):
    serializer_class = LibraryTokenObtainPairSerializer
