# library/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

ROLE_CHOICES = (
    ("reader", "Reader"),
    ("library", "LibraryStaff"),
)

LOAN_STATUS = (
    ("active", "Active"),
    ("returned", "Returned"),
    ("overdue", "Overdue"),
    ("cancelled", "Cancelled"),
)

COPY_STATUS = (
    ("available", "Available"),
    ("issued", "Issued"),
    ("lost", "Lost"),
    ("reserved", "Reserved"),
)

RENEW_STATUS = (
    ("pending", "Pending"),
    ("approved", "Approved"),
    ("rejected", "Rejected"),
)


class User(AbstractUser):
    # Наследуемся от AbstractUser, чтобы использовать username/password и админку.
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="reader")
    phone = models.CharField(max_length=30, blank=True, null=True, unique=True)
    birth_date = models.DateField(blank=True, null=True)

    # Номер читательского билета и договорной номер
    ticket_number = models.CharField(max_length=50, unique=True)
    contract_number = models.CharField(max_length=50, unique=True)

    def save(self, *args, **kwargs):
        # username = contract_number, чтобы читатель входил по договорному номеру
        if self.contract_number:
            self.username = self.contract_number
        super().save(*args, **kwargs)
    class Meta:
        db_table = "users"

    def is_reader(self):
        return self.role == "reader"

    def is_library(self):
        return self.role == "library"


class Author(models.Model):
    name = models.TextField()

    def __str__(self):
        return self.name


class Genre(models.Model):
    name = models.TextField()

    def __str__(self):
        return self.name


class BookGroup(models.Model):
    title = models.TextField()
    subtitle = models.TextField(blank=True, null=True)
    isbn = models.CharField(max_length=50, unique=True, blank=True, null=True)
    publisher = models.TextField(blank=True, null=True)
    year = models.IntegerField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    cover_url = models.TextField(blank=True, null=True)
    age_limit = models.IntegerField(default=0)  # 0 — без ограничений
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    authors = models.ManyToManyField(Author, related_name="book_groups", blank=True)
    genres = models.ManyToManyField(Genre, related_name="book_groups", blank=True)

    def __str__(self):
        return self.title


class BookCopy(models.Model):
    # В ТЗ: id вводится вручную (не генерируем). Используем IntegerField(primary_key=True)
    id = models.IntegerField(primary_key=True)  # номер экземпляра вводит библиотекарь
    book_group = models.ForeignKey(BookGroup, on_delete=models.CASCADE, related_name="copies")
    status = models.CharField(max_length=20, choices=COPY_STATUS, default="available")
    condition = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.book_group.title} | copy {self.id}"


class Loan(models.Model):
    copy = models.ForeignKey(BookCopy, on_delete=models.CASCADE, related_name="loans")
    reader = models.ForeignKey(User, on_delete=models.CASCADE, related_name="loans")
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="issued_loans")
    issued_at = models.DateTimeField(default=timezone.now)
    due_at = models.DateTimeField()
    returned_at = models.DateTimeField(blank=True, null=True)
    return_condition = models.TextField(blank=True, null=True)
    renew_count = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=LOAN_STATUS, default="active")

    created_at = models.DateTimeField(default=timezone.now)

    def is_overdue(self):
        if self.returned_at:
            return False
        return timezone.now() > self.due_at

    def save(self, *args, **kwargs):
        # Автоматически обновляем статус по датам
        if self.returned_at:
            self.status = "returned"
        else:
            if self.is_overdue():
                self.status = "overdue"
            else:
                self.status = "active"
        super().save(*args, **kwargs)


class RenewRequest(models.Model):
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name="renew_requests")
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="renew_requests")
    requested_at = models.DateTimeField(default=timezone.now)
    new_due_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=RENEW_STATUS, default="pending")

    def __str__(self):
        return f"RenewRequest {self.id} for loan {self.loan.id}"


class Event(models.Model):
    title = models.TextField()
    description = models.TextField(blank=True, null=True)
    start_at = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    capacity = models.IntegerField(default=0)
    cover_url = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="created_events")
    created_at = models.DateTimeField(default=timezone.now)

    participants = models.ManyToManyField(User, related_name="events", blank=True)

    def seats_left(self):
        if self.capacity <= 0:
            return None  # бесконечно
        return max(0, self.capacity - self.participants.count())

    def __str__(self):
        return self.title


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    title = models.TextField()
    message = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"
