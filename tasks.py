import os
import csv
from models import Post, User, IntervalData,Followers
from workers import celery
from flask import json
from flask_mail import Message
from mailimports import mail
from pytz import timezone
from datetime import datetime, timedelta

IST = timezone('Asia/Kolkata')

@celery.task(bind=True)
def export_blogs_csv(self, user_email):
    # Get the path to the CSV folder
    csv_folder_path = os.path.join(os.getcwd(), 'csv_files')

    # Create the CSV folder if it doesn't exist
    if not os.path.exists(csv_folder_path):
        os.makedirs(csv_folder_path)

    # CSV file headers
    fieldnames = ['ID', 'Title', 'Date Posted', 'USER ID', 'Likes', 'Comments']

    # posts data to a CSV file
    csv_file_path = os.path.join(csv_folder_path, f'blogs_{self.request.id}.csv')
    with open(csv_file_path, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        # Get the user object
        user = User.query.filter_by(email=user_email).first()
        posts = Post.query.filter_by(up_id=user.id)
        # Iterate over the user's posts only
        for post in posts:
            likes = len(post.likes.all())
            comments = len(post.comments.all())
            writer.writerow({
                'ID': post.id,
                'Title': post.title,
                'Date Posted': post.date_posted,
                'USER ID': post.up_id,
                'Likes': likes,
                'Comments': comments
            })

    return {'csv_file_path': csv_file_path}

@celery.task(bind=True)
def export_user_info_csv(self, user_email):
    # Get the path to the CSV folder
    csv_folder_path = os.path.join(os.getcwd(), 'csv_files')

    # Create the CSV folder if it doesn't exist
    if not os.path.exists(csv_folder_path):
        os.makedirs(csv_folder_path)

    # CSV file headers
    fieldnames = ['Username', 'Email', 'Followers', 'Following', 'Post Count', 'Interval Data']

    # Get the user object
    user = User.query.filter_by(email=user_email).first()
    followers = Followers.query.filter_by(following_id=user.id).all()
    following = Followers.query.filter_by(follower_id=user.id).all()

    # Count the number of followers and following
    followers_count = len(followers) if followers else 0
    following_count = len(following) if following else 0


    # Count the number of posts
    post_count = Post.query.filter_by(up_id=user.id).count()
    interval_data = IntervalData.query.filter_by(user_id=user.id).all()

    # Get the user's interval data
    interval_data_list = [{'login_time': data.login_time, 'logout_time': data.logout_time, 'interval': data.interval} for data in interval_data]

    # posts data to a CSV file
    csv_file_path = os.path.join(csv_folder_path, f'user_info_{self.request.id}.csv')
    with open(csv_file_path, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        writer.writerow({
            'Username': user.username,
            'Email': user.email,
            'Followers': followers_count,
            'Following': following_count,
            'Post Count': post_count,
            'Interval Data': json.dumps(interval_data_list)
        })

    return {'csv_file_path': csv_file_path}

@celery.task(name="core.daily_reminder_jobs.send_reminder_email")
def send_reminder_email(user_email):
    user = User.query.filter_by(email=user_email).first()
    if user:
        msg = Message('Daily Reminder', sender='muskan01jan@gmail.com', recipients=[user.email])
        msg.body = 'Please post something today!'
        mail.send(msg)

@celery.task(name="core.daily_reminder_jobs.get_users_to_remind")
def get_users_to_remind():
    users = User.query.all()
    for user in users:
        # Check if user has posted anything in the last day
        last_post = Post.query.filter_by(user_id=user.id).order_by(Post.date_posted.desc()).first()
        if not last_post or last_post.date_posted < datetime.now(IST) - timedelta(days=1):
            send_reminder_email.delay(user.email)