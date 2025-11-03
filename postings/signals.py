from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import MarketplacePost, PostAnalytics


@receiver(post_save, sender=MarketplacePost)
def track_post_analytics(sender, instance, created, **kwargs):
    """
    Automatically track analytics when posts are created or posted.
    This ensures we never miss tracking any post activity.
    """
    user = instance.account.user

    # Track post creation
    if created:
        PostAnalytics.objects.create(
            user=user,
            account=instance.account,
            post_id=instance.id,
            post_title=instance.title,
            action='created',
            account_email=instance.account.email,
            price=instance.price
        )

    # Track when post is marked as posted
    # Check if posted field changed from False to True
    if not created and instance.posted:
        # Check if we already tracked this posting
        already_tracked = PostAnalytics.objects.filter(
            post_id=instance.id,
            action='posted'
        ).exists()

        if not already_tracked:
            PostAnalytics.objects.create(
                user=user,
                account=instance.account,
                post_id=instance.id,
                post_title=instance.title,
                action='posted',
                account_email=instance.account.email,
                price=instance.price
            )
