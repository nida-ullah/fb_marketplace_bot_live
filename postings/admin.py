from django.contrib import admin
from .models import MarketplacePost, PostAnalytics, PostingJob, ErrorLog
from django.urls import reverse

# admin.site.register(MarketplacePost)


@admin.register(MarketplacePost)
class MarketplacePostAdmin(admin.ModelAdmin):
    list_display = ['title', 'account', 'price', 'posted']
    list_filter = ['posted', 'account']
    search_fields = ['title', 'description', 'account__email']
    exclude = ['scheduled_time']  # Hide scheduled_time from admin forms

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['bulk_upload_url'] = reverse('bulk_upload_posts')
        return super().changelist_view(request, extra_context=extra_context)


@admin.register(PostAnalytics)
class PostAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['post_title', 'user',
                    'account_email', 'action', 'timestamp']
    list_filter = ['action', 'timestamp', 'user']
    search_fields = ['post_title', 'account_email', 'user__email']
    date_hierarchy = 'timestamp'
    readonly_fields = ['user', 'account', 'post_id', 'post_title',
                       'action', 'timestamp', 'account_email', 'price']

    def has_add_permission(self, request):
        # Prevent manual creation of analytics records
        return False

    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of analytics records to maintain permanent history
        return False


@admin.register(PostingJob)
class PostingJobAdmin(admin.ModelAdmin):
    list_display = ['job_id', 'status', 'total_posts',
                    'completed_posts', 'failed_posts', 'started_at']
    list_filter = ['status', 'started_at']
    search_fields = ['job_id']
    readonly_fields = ['job_id', 'total_posts', 'completed_posts',
                       'failed_posts', 'started_at', 'completed_at']


@admin.register(ErrorLog)
class ErrorLogAdmin(admin.ModelAdmin):
    list_display = ['post', 'error_type', 'created_at']
    list_filter = ['error_type', 'created_at']
    search_fields = ['post__title', 'error_message']
    date_hierarchy = 'created_at'
