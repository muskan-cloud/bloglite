from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from datetime import datetime
import pytz


db = SQLAlchemy()
IST = pytz.timezone('Asia/Kolkata')

roles_users = db.Table('roles_users',
                       db.Column('user_id', db.Integer(),
                                 db.ForeignKey('user.id')),
                       db.Column('role_id', db.Integer(),
                                 db.ForeignKey('role.id')))

class Followers(db.Model):
    __tablename__ = 'followers'
    follower_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    following_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    created_date = db.Column(db.DateTime, nullable=False, default=datetime.now(IST))

    def __repr__(self):
        return f"User {self.follower_id} is following user {self.following_id}"

class User(db.Model, UserMixin):
    __tablename__ = 'user'
    id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    pfp = db.Column(db.BLOB, nullable=True)
    username = db.Column(db.String, unique=True)
    email = db.Column(db.String, unique=True)
    password = db.Column(db.String(255))
    active = db.Column(db.Boolean())
    fs_uniquifier = db.Column(db.String(255), unique=True, nullable=False)
    roles = db.relationship('Role', secondary=roles_users,
                            backref=db.backref('users', lazy='dynamic'))

    followers = db.relationship('Followers', foreign_keys=[Followers.following_id],
                                backref=db.backref('following', lazy='joined'), lazy='dynamic',
                                cascade='all, delete-orphan')

    following = db.relationship('Followers', foreign_keys=[Followers.follower_id],
                                backref=db.backref('follower', lazy='joined'), lazy='dynamic',
                                cascade='all, delete-orphan')
    interval_data = db.relationship('IntervalData', backref='user', lazy='dynamic')


class IntervalData(db.Model):
    __tablename__ = 'interval_data'
    id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    login_time = db.Column(db.DateTime, nullable=False)
    logout_time = db.Column(db.DateTime, nullable=False)
    interval = db.Column(db.Integer, nullable=False)

class Role(db.Model, RoleMixin):
    __tablename__ = 'role'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    date_posted = db.Column(db.DateTime, nullable=False, default=datetime.now(IST))
    picture = db.Column(db.BLOB, nullable=False)
    up_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('posts', lazy=True))
    likes = db.relationship('Like', backref='post', lazy='dynamic')
    comments = db.relationship('Comment', backref='post', lazy='dynamic')
    def __repr__(self):
        return f"Post('{self.title}', '{self.date_posted}')"

class Like(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user = db.relationship('User', backref=db.backref('like', lazy=True))
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'))
    user_email = db.Column(db.Integer, db.ForeignKey('user.email'))
    date_liked = db.Column(db.DateTime, default=datetime.now(IST))

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user = db.relationship('User', backref=db.backref('comment', lazy=True))
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'))
    user_email = db.Column(db.Integer, db.ForeignKey('user.email'))
    text = db.Column(db.String(140))
    date_posted = db.Column(db.DateTime, default=datetime.now(IST))
