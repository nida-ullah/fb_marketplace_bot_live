from django.db import models
from django.contrib.auth.models import User
from accounts.models import FacebookAccount


class PostAnalytics(models.Model):
    """
    Permanent analytics tracking for posts.
    Records every post creation and posting action.
    Data is never deleted to maintain lifetime statistics.
    """
    ACTION_CHOICES = [
        ('created', 'Post Created'),
        ('posted', 'Post Posted to Facebook'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    account = models.ForeignKey(
        FacebookAccount, on_delete=models.SET_NULL, null=True, blank=True)
    # Reference to MarketplacePost
    post_id = models.IntegerField(null=True, blank=True)
    post_title = models.CharField(max_length=255)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    # Additional metadata
    account_email = models.EmailField()  # Store email in case account is deleted
    price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'action', 'timestamp'],
                         name='user_action_time_idx'),
            models.Index(fields=['user', 'timestamp'], name='user_time_idx'),
            models.Index(fields=['account', 'action'],
                         name='account_action_idx'),
            models.Index(fields=['action', 'timestamp'],
                         name='action_time_idx'),
        ]
        ordering = ['-timestamp']
        verbose_name_plural = "Post Analytics"

    def __str__(self):
        return f"{self.user.email} - {self.action} - {self.post_title}"


class DailyAnalyticsSummary(models.Model):
    """
    Daily summary for faster analytics queries.
    Aggregated daily to reduce database load.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()

    # Daily counts
    posts_created = models.IntegerField(default=0)
    posts_posted = models.IntegerField(default=0)

    # Account-specific tracking
    account_email = models.EmailField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'date', 'account_email']
        indexes = [
            models.Index(fields=['user', 'date'], name='daily_user_date_idx'),
            models.Index(fields=['date'], name='daily_date_idx'),
        ]
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.email} - {self.date}"
