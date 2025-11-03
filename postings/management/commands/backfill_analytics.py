from django.core.management.base import BaseCommand
from postings.models import MarketplacePost, PostAnalytics


class Command(BaseCommand):
    help = 'Backfill analytics data for existing posts'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting analytics backfill...'))

        posts = MarketplacePost.objects.all().select_related('account', 'account__user')
        total_created = 0
        total_posted = 0

        for post in posts:
            # Track creation
            PostAnalytics.objects.get_or_create(
                post_id=post.id,
                action='created',
                defaults={
                    'user': post.account.user,
                    'account': post.account,
                    'post_title': post.title,
                    'account_email': post.account.email,
                    'price': post.price,
                    'timestamp': post.created_at,
                }
            )
            total_created += 1

            # Track if posted
            if post.posted:
                PostAnalytics.objects.get_or_create(
                    post_id=post.id,
                    action='posted',
                    defaults={
                        'user': post.account.user,
                        'account': post.account,
                        'post_title': post.title,
                        'account_email': post.account.email,
                        'price': post.price,
                        'timestamp': post.updated_at,
                    }
                )
                total_posted += 1

        self.stdout.write(self.style.SUCCESS(
            f'✅ Backfill complete! Tracked {total_created} creations and {total_posted} posts'
        ))
