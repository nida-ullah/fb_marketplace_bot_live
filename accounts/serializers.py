from rest_framework import serializers
from .models import CustomUser, FacebookAccount


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email',
                  'first_name', 'last_name', 'is_approved', 'is_staff', 'is_superuser']
        read_only_fields = ['is_approved', 'is_staff', 'is_superuser']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password',
                  'confirm_password', 'first_name', 'last_name']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError(
                {"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_approved=False  # New users need approval
        )
        return user


class FacebookAccountSerializer(serializers.ModelSerializer):
    session_exists = serializers.SerializerMethodField()
    # Accept plain password in API
    password = serializers.CharField(write_only=True)

    class Meta:
        model = FacebookAccount
        fields = ['id', 'email', 'password', 'session_exists', 'created_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def get_session_exists(self, obj):
        import os
        session_file = f"sessions/{obj.email.replace('@', '_').replace('.', '_')}.json"
        return os.path.exists(session_file)

    def create(self, validated_data):
        """Override create to encrypt password"""
        password = validated_data.pop('password')
        account = FacebookAccount(**validated_data)
        account.set_password(password)  # Encrypt before saving
        account.save()
        return account

    def update(self, instance, validated_data):
        """Override update to encrypt password if provided"""
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)  # Encrypt before saving

        instance.save()
        return instance
