# library/admin.py
from django.contrib import admin
from .models import User, Author, Genre, BookGroup, BookCopy, Loan, RenewRequest, Event, Notification
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Extra", {"fields": ("role", "phone", "birth_date")}),
    )
    list_display = ("username", "email", "first_name", "last_name", "role")


admin.site.register(Author)
admin.site.register(Genre)
admin.site.register(BookGroup)
admin.site.register(BookCopy)
admin.site.register(Loan)
admin.site.register(RenewRequest)
admin.site.register(Event)
admin.site.register(Notification)
