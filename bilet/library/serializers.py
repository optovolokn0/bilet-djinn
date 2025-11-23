# library/serializers.py
from rest_framework import serializers
from .models import (
    User, Author, Genre, BookGroup, BookCopy, Loan, RenewRequest, Event, Notification, Review
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
    book_group_id = serializers.IntegerField(write_only=True)
    class Meta:
        model = BookCopy
        fields = ("id", "book_group", "book_group_id", "status", "condition", "created_at", "updated_at")
    def create(self, validated_data):
        book_group_id = validated_data.pop("book_group_id")
        book_group = BookGroup.objects.get(id=book_group_id)
        copy = BookCopy.objects.create(book_group=book_group, **validated_data)
        return copy


class SimpleNameSerializer(serializers.Serializer):
    name = serializers.CharField()

class BookGroupSerializer(serializers.ModelSerializer):
    authors = SimpleNameSerializer(many=True, required=False)
    genres = SimpleNameSerializer(many=True, required=False)

    authors_full = AuthorSerializer(source="authors", many=True, read_only=True)
    genres_full = GenreSerializer(source="genres", many=True, read_only=True)
    copies_count = serializers.SerializerMethodField()
    available_count = serializers.SerializerMethodField()
    cover_image = serializers.ImageField(required=False, allow_null=True, use_url=True)
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = BookGroup
        fields = ("id", "title", "subtitle", "isbn", "publisher", "year",
            "description", "cover_url", "cover_image", "age_limit", "authors", "genres", "authors_full", "genres_full",
            "created_at", "updated_at", "copies_count", "available_count", "average_rating", "reviews_count")

    def get_copies_count(self, obj):
        return obj.copies.count()

    def get_available_count(self, obj):
        return obj.copies.filter(status="available").count()

    def get_average_rating(self, obj):
        # Use model helper
        avg = obj.average_rating()
        if avg is None:
            return 0
        # round to 2 decimals
        return round(avg, 2)

    def get_reviews_count(self, obj):
        return obj.reviews.count()

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

class ActiveLoanSerializer(serializers.ModelSerializer):
    loan_id = serializers.IntegerField()
    copy_id = serializers.IntegerField()
    book_title = serializers.CharField()
    due_at = serializers.DateTimeField()
    is_overdue = serializers.BooleanField()

class RenewRequestSerializer(serializers.ModelSerializer):
    loan = LoanSerializer(read_only=True)
    loan_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = RenewRequest
        fields = ("id", "loan", "loan_id", "requested_by", "requested_at", "new_due_at", "status")


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    book_group = serializers.PrimaryKeyRelatedField(read_only=True)
    book_group_id = serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = Review
        fields = ("id", "book_group", "book_group_id", "user", "rating", "text", "created_at")

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value

    def create(self, validated_data):
        bg_id = validated_data.pop("book_group_id")
        try:
            bg = BookGroup.objects.get(id=bg_id)
        except BookGroup.DoesNotExist:
            raise serializers.ValidationError({"book_group_id": "BookGroup not found"})
        user = self.context.get("request").user if self.context.get("request") else None
        return Review.objects.create(book_group=bg, user=user, **validated_data)


class EventSerializer(serializers.ModelSerializer):
    participants_count = serializers.SerializerMethodField()
    seats_left = serializers.SerializerMethodField()
    cover_image = serializers.ImageField(required=False, allow_null=True, use_url=True)

    class Meta:
        model = Event
        fields = ("id", "title", "description", "start_at", "duration_minutes", "capacity", "cover_url", "cover_image", "created_by", "participants_count", "seats_left")

    def get_participants_count(self, obj):
        return obj.participants.count()

    def get_seats_left(self, obj):
        return obj.seats_left()
