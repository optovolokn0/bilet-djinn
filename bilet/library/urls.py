# library/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BookGroupViewSet, BookCopyViewSet, LoanViewSet, RenewRequestViewSet,
    EventViewSet, AnalyticsViewSet, UserViewSet
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from library.auth_views import ReaderLoginView, LibraryLoginView

router = DefaultRouter()
router.register(r"book-groups", BookGroupViewSet, basename="bookgroup")
router.register(r"book-copies", BookCopyViewSet, basename="bookcopy")
router.register(r"loans", LoanViewSet, basename="loan")
router.register(r"renew-requests", RenewRequestViewSet, basename="renewrequest")
router.register(r"events", EventViewSet, basename="event")
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("api/auth/reader/login/", ReaderLoginView.as_view()),
    path("api/auth/library/login/", LibraryLoginView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),
    path("api/", include(router.urls)),
]
