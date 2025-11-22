# library/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from .models import User, Author, Genre, BookGroup, BookCopy, Loan, RenewRequest, Event, Notification
from .serializers import (
    UserCreateSerializer, UserSerializer, AuthorSerializer, GenreSerializer, BookGroupSerializer,
    BookCopySerializer, LoanSerializer, RenewRequestSerializer, EventSerializer
)
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.exceptions import ValidationError, PermissionDenied
from datetime import timedelta

# Простая роль-пермишен проверка (можно заменить на более серьёзную систему)
def require_role(user, role_or_roles):
    """Require that `user` has one of role_or_roles (str or iterable).

    Raises PermissionDenied if not matched.
    """
    if not user.is_authenticated:
        raise PermissionDenied(detail=f"Требуется роль {role_or_roles}")
    if isinstance(role_or_roles, (list, tuple, set)):
        if getattr(user, "role", None) not in role_or_roles:
            raise PermissionDenied(detail=f"Требуется одна из ролей: {', '.join(role_or_roles)}")
    else:
        if getattr(user, "role", None) != role_or_roles:
            raise PermissionDenied(detail=f"Требуется роль {role_or_roles}")


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        # Only library staff or admin may create readers or library staff.
        # Creating an admin must be done by an admin.
        requested_role = serializer.validated_data.get("role", "reader")
        if requested_role == "admin":
            require_role(self.request.user, "admin")
        else:
            # allow library staff to create readers and allow admin too
            require_role(self.request.user, ("library", "admin"))
        return serializer.save()

    def destroy(self, request, *args, **kwargs):
        # Admins can delete users with role 'library' and 'reader' only.
        target = self.get_object()
        if target.role in ("library", "reader"):
            require_role(request.user, "admin")
            return super().destroy(request, *args, **kwargs)
        # Prevent deleting admins (or unknown roles) via this endpoint
        raise PermissionDenied(detail="Недостаточно прав для удаления данного пользователя")

class BookGroupViewSet(viewsets.ModelViewSet):
    queryset = BookGroup.objects.prefetch_related("authors", "genres", "copies").all()
    serializer_class = BookGroupSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["get"])
    def copies(self, request, pk=None):
        bg = self.get_object()
        copies = bg.copies.all()
        return Response(BookCopySerializer(copies, many=True).data)


class BookCopyViewSet(viewsets.ModelViewSet):
    queryset = BookCopy.objects.select_related("book_group").all()
    serializer_class = BookCopySerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"])
    def issue(self, request, pk=None):
        # Выдача экземпляра copy -> loan
        copy = self.get_object()
        reader_id = request.data.get("reader_id")
        if not reader_id:
            raise ValidationError({"reader_id": "required"})
        reader = User.objects.get(id=reader_id)

        # Проверка на возраст
        if copy.book_group.age_limit and reader.birth_date:
            age = (timezone.now().date() - reader.birth_date).days // 365
            if age < copy.book_group.age_limit:
                return Response({"detail": "Возрастной рейтинг запрещает выдачу"}, status=400)

        if copy.status != "available":
            return Response({"detail": "Копия недоступна для выдачи"}, status=400)

        due_days = int(request.data.get("due_days", 21))  # по умолчанию 21 день
        due_at = timezone.now() + timedelta(days=due_days)

        with transaction.atomic():
            loan = Loan.objects.create(copy=copy, reader=reader, issued_by=request.user if request.user.is_authenticated else None, due_at=due_at)
            copy.status = "issued"
            copy.save()
        return Response(LoanSerializer(loan).data, status=201)

    @action(detail=True, methods=["post"])
    def return_copy(self, request, pk=None):
        copy = self.get_object()
        try:
            loan = Loan.objects.filter(copy=copy, status="active").latest("issued_at")
        except Loan.DoesNotExist:
            return Response({"detail": "Активная выдача не найдена"}, status=404)
        loan.returned_at = timezone.now()
        loan.return_condition = request.data.get("condition", "")
        loan.save()
        copy.status = "available"
        copy.save()
        return Response({"detail": "Принято"}, status=200)


class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.select_related("copy", "reader").all()
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"])
    def extend(self, request, pk=None):
        loan = self.get_object()
        # Простейшая логика: максимум 5 продлений
        MAX_RENEWS = 5
        if loan.renew_count >= MAX_RENEWS:
            return Response({"detail": "Достигнуто максимальное количество продлений"}, status=400)
        # Создаём заявку на продление
        extra_days = int(request.data.get("extra_days", 14))
        new_due = loan.due_at + timedelta(days=extra_days)
        rr = RenewRequest.objects.create(loan=loan, requested_by=request.user, new_due_at=new_due)
        # Можно автоматически одобрять — но оставим pending
        return Response(RenewRequestSerializer(rr).data, status=201)

    @action(detail=True, methods=["post"])
    def mark_returned(self, request, pk=None):
        loan = self.get_object()
        if loan.returned_at:
            return Response({"detail": "Уже возвращено"}, status=400)
        loan.returned_at = timezone.now()
        loan.save()
        loan.copy.status = "available"
        loan.copy.save()
        return Response({"detail": "Отмечено как возвращенное"}, status=200)


class RenewRequestViewSet(viewsets.ModelViewSet):
    queryset = RenewRequest.objects.select_related("loan", "requested_by").all()
    serializer_class = RenewRequestSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        require_role(request.user, ("library", "admin"))
        rr = self.get_object()
        if rr.status != "pending":
            return Response({"detail": "Старая заявка"}, status=400)
        loan = rr.loan
        loan.due_at = rr.new_due_at or (loan.due_at + timedelta(days=14))
        loan.renew_count += 1
        loan.save()
        rr.status = "approved"
        rr.save()
        return Response({"detail": "Продление одобрено"})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        require_role(request.user, ("library", "admin"))
        rr = self.get_object()
        rr.status = "rejected"
        rr.save()
        return Response({"detail": "Продление отклонено"})


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.prefetch_related("participants").all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"])
    def register(self, request, pk=None):
        event = self.get_object()
        user = request.user
        # Проверка мест
        seats = event.seats_left()
        if seats is not None and seats <= 0:
            return Response({"detail": "Мест нет"}, status=400)
        event.participants.add(user)
        # Можно добавить уведомление
        Notification.objects.create(user=user, title="Регистрация на мероприятие", message=f"Вы записаны на {event.title}")
        return Response({"detail": "Запись успешна"})

    @action(detail=True, methods=["post"])
    def unregister(self, request, pk=None):
        event = self.get_object()
        user = request.user
        event.participants.remove(user)
        return Response({"detail": "Отмена записи"})


class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def top_books(self, request):
        from django.db.models import Count
        qs = BookGroup.objects.annotate(issues=Count("copies__loans")).order_by("-issues")[:20]
        data = []
        for bg in qs:
            data.append({
                "book_group_id": bg.id,
                "title": bg.title,
                "issues": bg.issues
            })
        return Response(data)
