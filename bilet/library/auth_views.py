from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import PermissionDenied
from library.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.backends import TokenBackend
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import AccessToken, TokenError
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated


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
    
class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        if self.user.role != "admin":
            raise PermissionDenied("Это логин только для библиотекарей.")

        return data


class ReaderLoginView(TokenObtainPairView):
    serializer_class = ReaderTokenObtainPairSerializer


class LibraryLoginView(TokenObtainPairView):
    serializer_class = LibraryTokenObtainPairSerializer

class AdminLoginView(TokenObtainPairView):
    serializer_class = AdminTokenObtainPairSerializer

class InspectTokenView(APIView):
    

    def post(self, request):
        token_str = request.data.get("token")
        if not token_str:
            raise ValidationError({"token": "Token is required"})

        try:
            token = AccessToken(token_str)
        except TokenError as e:
            return Response({
                "valid": False,
                "error": str(e)
            }, status=status.HTTP_200_OK)

        # Если токен валиден — извлекаем user_id
        user_id = token.get("user_id")
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                "valid": False,
                "error": "User does not exist"
            }, status=status.HTTP_200_OK)

        return Response({
            "valid": True,
            "user": {
                "id": user.id,
                "ticket_number": user.ticket_number,
                "role": user.role,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
            "expires_at": token["exp"]
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = UserSerializer(user).data
        return Response(data)