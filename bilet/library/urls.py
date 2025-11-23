# library/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BookGroupViewSet, BookCopyViewSet, LoanViewSet, RenewRequestViewSet,
    EventViewSet, AnalyticsViewSet, UserActiveLoansView, UserReturnedLoansView, UserViewSet, ReviewViewSet
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from library.auth_views import AdminLoginView, MeView, ReaderLoginView, LibraryLoginView
from library.auth_views import InspectTokenView

router = DefaultRouter()
router.register(r"book-groups", BookGroupViewSet, basename="bookgroup")
router.register(r"book-copies", BookCopyViewSet, basename="bookcopy")
router.register(r"loans", LoanViewSet, basename="loan")
router.register(r"renew-requests", RenewRequestViewSet, basename="renewrequest")
router.register(r"events", EventViewSet, basename="event")
router.register(r"reviews", ReviewViewSet, basename="review")
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("api/auth/reader/login/", ReaderLoginView.as_view()),
    path("api/auth/library/login/", LibraryLoginView.as_view()),
    path("api/auth/admin/login/", AdminLoginView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),
    path("api/auth/token-info/", InspectTokenView.as_view()),
    path("api/loans/active/", UserActiveLoansView.as_view()),
    path("api/loans/returned/", UserReturnedLoansView.as_view()),
    path("api/auth/me/", MeView.as_view()),
    path("api/", include(router.urls)),
]
