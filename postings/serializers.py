from rest_framework import serializers
from .models import MarketplacePost, PostingJob, ErrorLog
from accounts.models import FacebookAccount
from accounts.serializers import FacebookAccountSerializer


class MarketplacePostSerializer(serializers.ModelSerializer):
    # Nested account object for read operations
    account = FacebookAccountSerializer(read_only=True)
    # Account ID for write operations
    account_id = serializers.PrimaryKeyRelatedField(
        source='account',
        queryset=FacebookAccount.objects.none(),  # Will be set dynamically
        write_only=True,
        required=False
    )

    # Make all fields optional for updates (partial updates)
    title = serializers.CharField(required=False, max_length=255)
    description = serializers.CharField(required=False)
    price = serializers.DecimalField(
        required=False, max_digits=10, decimal_places=2)
    image = serializers.ImageField(required=False)
    scheduled_time = serializers.DateTimeField(required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Dynamically set queryset based on the request user
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            self.fields['account_id'].queryset = FacebookAccount.objects.filter(
                user=request.user
            )

    class Meta:
        model = MarketplacePost
        fields = [
            'id', 'title', 'description', 'price', 'image',
            'scheduled_time', 'posted', 'account', 'account_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_price(self, value):
        """Validate that price is positive"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Price must be greater than 0")
        return value

    def validate_title(self, value):
        """Validate that title is not empty if provided"""
        if value is not None and not value.strip():
            raise serializers.ValidationError("Title cannot be empty")
        return value

    def validate_description(self, value):
        """Validate that description is not empty if provided"""
        if value is not None and not value.strip():
            raise serializers.ValidationError("Description cannot be empty")
        return value


class PostingJobSerializer(serializers.ModelSerializer):
    """Serializer for posting job status"""
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = PostingJob
        fields = [
            'id', 'job_id', 'status', 'total_posts', 'completed_posts',
            'failed_posts', 'current_post_id', 'current_post_title',
            'error_message', 'started_at', 'completed_at', 'progress_percentage'
        ]

    def get_progress_percentage(self, obj):
        if obj.total_posts == 0:
            return 0
        return round((obj.completed_posts / obj.total_posts) * 100, 1)


class ErrorLogSerializer(serializers.ModelSerializer):
    """Serializer for error logs"""
    post_title = serializers.CharField(source='post.title', read_only=True)

    class Meta:
        model = ErrorLog
        fields = [
            'id', 'post', 'post_title', 'error_type', 'error_message',
            'stack_trace', 'screenshot', 'created_at'
        ]
        read_only_fields = ['created_at']
