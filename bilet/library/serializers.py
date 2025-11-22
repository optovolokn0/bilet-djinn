# library/serializers.py
from rest_framework import serializers
from .models import (
    User, Author, Genre, BookGroup, BookCopy, Loan, RenewRequest, Event, Notification
)
from django.utils import timezone
from django.utils.crypto import get_random_string


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ("id", "name")


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ("id", "name")


class BookCopySerializer(serializers.ModelSerializer):
    book_group = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = BookCopy
        fields = ("id", "book_group", "status", "condition", "created_at", "updated_at")


class BookGroupSerializer(serializers.ModelSerializer):
    authors = AuthorSerializer(many=True, required=False)
    genres = GenreSerializer(many=True, required=False)
    copies_count = serializers.SerializerMethodField()
    available_count = serializers.SerializerMethodField()

    class Meta:
        model = BookGroup
        fields = ("id", "title", "subtitle", "isbn", "publisher", "year",
                  "description", "cover_url", "age_limit", "authors", "genres",
                  "created_at", "updated_at", "copies_count", "available_count")

    def get_copies_count(self, obj):
        return obj.copies.count()

    def get_available_count(self, obj):
        return obj.copies.filter(status="available").count()

    def create(self, validated_data):
        authors_data = validated_data.pop("authors", [])
        genres_data = validated_data.pop("genres", [])
        book = BookGroup.objects.create(**validated_data)
        for a in authors_data:
            author, _ = Author.objects.get_or_create(name=a["name"])
            book.authors.add(author)
        for g in genres_data:
            genre, _ = Genre.objects.get_or_create(name=g["name"])
            book.genres.add(genre)
        return book

    def update(self, instance, validated_data):
        authors_data = validated_data.pop("authors", None)
        genres_data = validated_data.pop("genres", None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if authors_data is not None:
            instance.authors.clear()
            for a in authors_data:
                author, _ = Author.objects.get_or_create(name=a["name"])
                instance.authors.add(author)
        if genres_data is not None:
            instance.genres.clear()
            for g in genres_data:
                genre, _ = Genre.objects.get_or_create(name=g["name"])
                instance.genres.add(genre)
        return instance


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "role", "phone", "birth_date", "password")


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(read_only=True)
    class Meta:
        model = User
        fields = (
            "id", 
            "ticket_number",
            "contract_number",
            "first_name",
            "last_name",
            "phone",
            "birth_date",
            "role",
            "password"
        )
        extra_kwargs = {
            
            "role": {"default": "reader"},
        }

    def create(self, validated_data):
        random_password = get_random_string(
            length=10,
            allowed_chars="abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        )
        user = User(**validated_data)
        user.set_password(random_password)
        user.save()
        user.password = random_password
        return user

class LoanSerializer(serializers.ModelSerializer):
    copy = BookCopySerializer(read_only=True)
    copy_id = serializers.IntegerField(write_only=True, required=True)
    reader = UserSerializer(read_only=True)
    reader_id = serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = Loan
        fields = ("id", "copy", "copy_id", "reader", "reader_id", "issued_by", "issued_at", "due_at", "returned_at", "renew_count", "status")

    def create(self, validated_data):
        copy_id = validated_data.pop("copy_id")
        reader_id = validated_data.pop("reader_id")
        copy = BookCopy.objects.select_for_update().get(id=copy_id)
        reader = User.objects.get(id=reader_id)
        loan = Loan.objects.create(copy=copy, reader=reader, **validated_data)
        copy.status = "issued"
        copy.save()
        return loan


class RenewRequestSerializer(serializers.ModelSerializer):
    loan = LoanSerializer(read_only=True)
    loan_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = RenewRequest
        fields = ("id", "loan", "loan_id", "requested_by", "requested_at", "new_due_at", "status")


class EventSerializer(serializers.ModelSerializer):
    participants_count = serializers.SerializerMethodField()
    seats_left = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ("id", "title", "description", "start_at", "duration_minutes", "capacity", "cover_url", "created_by", "participants_count", "seats_left")

    def get_participants_count(self, obj):
        return obj.participants.count()

    def get_seats_left(self, obj):
        return obj.seats_left()
