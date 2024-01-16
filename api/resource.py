from flask_restful import Api, Resource, fields, marshal,marshal_with
from flask_security import auth_required, current_user ,hash_password,login_required
from security import user_datastore
from models import db, User as user_model,Post as post_model,Followers as follow_model,Like as like_model, Comment as comment_model,IntervalData as inter_data
from datetime import datetime
from sqlalchemy import or_
from flask import abort, request,jsonify,redirect,url_for
import base64,os


api = Api(prefix="/api")

userf_resource_fields = {
    "username": fields.String,
    "password": fields.String,
    "email": fields.String,
}

user_resource_fields = {
    "username": fields.String,
    "password": fields.String,
    "email": fields.String,
    "pfp": fields.Raw
}

follower_resource_fields = {
    "follower_id": fields.Integer(attribute="follower.id"),
    "following_id": fields.Integer(attribute="following.id"),
    "user": fields.Nested(userf_resource_fields, attribute="follower")
}

following_resource_fields = {
    "follower_id": fields.Integer(attribute="follower.id"),
    "following_id": fields.Integer(attribute="following.id"),
    "user": fields.Nested(userf_resource_fields, attribute="following")
}




like_resource_fields = {
    "id": fields.Integer(),
    "user": fields.Nested(userf_resource_fields),
}


comment_resource_fields = {
    "id": fields.Integer(),
    "text": fields.String(),
    "user": fields.Nested(userf_resource_fields),
}

post_resource_fields = {
    "id": fields.Integer(),
    "title": fields.String,
    "picture": fields.Raw,
    "user": fields.Nested(userf_resource_fields),
    "likes": fields.List(fields.Nested(like_resource_fields)),
    "comments": fields.List(fields.Nested(comment_resource_fields))
}




class User(Resource):
    def get(self, email):
        user = user_model.query.filter_by(email=email).first()
        if not user:
            abort(404, "User not found")
        
        # Check if the requested user is the current user
        if current_user.email == email:
            if user.pfp:
                user.pfp=base64.b64encode(user.pfp).decode('utf-8')
                return marshal(user, user_resource_fields)
            else:
                return marshal(user, userf_resource_fields)
        # Check if the current user is following the requested user
        following = follow_model.query.filter_by(follower_id=current_user.id, following_id=user.id).first()
        if following:
            return marshal(user, userf_resource_fields)
        
        abort(403, "follow this user to see their profile!")

        
    def put(self,email):
        if email==current_user.email:
            user = user_model.query.filter_by(email=email).first()
            if not user:
                abort(404, "User not found")
            email = request.form.get('email')
            password = request.form.get('password')
            username = request.form.get('username')
            pfp = request.files.get('pfp')
            if pfp:
                user.pfp = pfp.read()

            if email:
                user.email = email
            if password:
                user.password= password
            if username:
                user.username= username

            db.session.commit()

            return {"message": "User Details updated successfully"}
        else:
            return {"message": "You are not authorized to update this user"}
        
    def post(self):
        email = request.json.get('email')
        password = request.json.get('password')
        username = request.json.get('username')
        
        if email and password and username:
            # Check if user with email already exists
            user = user_model.query.filter_by(email=email).first()
            if user:
                abort(400,"user with email already exists")
            else:
                # Create a new user with the given email and password
                user = user_model(email=email)
                user.password = password
                user_datastore.create_user(username=username, email=email,password=hash_password(password))
                db.session.commit()
                return marshal(user, user_resource_fields)
        else:
            abort(400,"email and password are required")

class Post(Resource):
    def put(self, email, post_id):
        # Update an existing post
        if email == current_user.email:
            user = user_model.query.filter_by(email=email).first()
            post = post_model.query.filter_by(up_id=user.id,id=post_id).first()

            if not post:
                abort(404, "Post not found")

            # Update the post's title and/or picture
            caption = request.form.get("caption")
            pic = request.files.get('pic')
            if caption:
                post.title = caption
            if pic:
                post.picture = pic.read()

            db.session.commit()

            return {"message": "Post updated successfully"}
        else:
            return {"message": "You are not authorized to update this post"}
        
    
    def post(self):
        caption = request.form.get("caption")
        pic = request.files.get('pic')
        if caption and pic:
            # Create a new post object and store it in the database
            new_post = post_model(up_id=current_user.id, title=caption, picture=pic.read())
            db.session.add(new_post)
            db.session.commit()
        else:
            abort(400)

    def get(self, email):
        user = user_model.query.filter_by(email=email).first()
        if user:
            # Fetch all posts for the user from the database
            posts = post_model.query.filter_by(up_id=user.id).all()
            post_dicts = []
            for post in posts:
                # Fetch all likes for the post from the database
                likes = like_model.query.filter_by(post_id=post.id).all()
                like_dicts = []
                for like in likes:
                    like_dict = marshal(like, like_resource_fields)
                    user_dict = marshal(like.user, userf_resource_fields)
                    user_dict['pfp'] = base64.b64encode(like.user.pfp).decode()
                    like_dict['user'] = user_dict
                    like_dicts.append(like_dict)
                  
                
                # Fetch all comments for the post from the database
                comments = comment_model.query.filter_by(post_id=post.id).all()
                comment_dicts = []
                for comment in comments:
                    comment_dict = marshal(comment, comment_resource_fields)
                    user_dict = marshal(comment.user, userf_resource_fields)
                    user_dict['pfp'] = base64.b64encode(comment.user.pfp).decode()
                    comment_dict['user'] = user_dict
                    comment_dicts.append(comment_dict)
                   
                # Add likes and comments to the post data
                post_dict = marshal(post, post_resource_fields)
                post_dict['picture'] = base64.b64encode(post.picture).decode() if post.picture else None
                
                post_dict['likes'] = like_dicts
                post_dict['comments'] = comment_dicts
                post_dicts.append(post_dict)
            
            return post_dicts
        else:
            abort(404, "post not found")

    def delete(self,email,post_id):
        if email==current_user.email:
            user=user_model.query.filter_by(email=email).first()
          

            # Check if the user has the post
            post = post_model.query.filter_by(up_id=user.id,id=post_id).first()
            if not post:
                abort(400, "no post")

            # Delete the like relationship from the database
            db.session.delete(post)
            db.session.commit()

            return {"message": "deleted successfully"}
        else:
            return {"message": "you are not authorized"}

class Like(Resource):
    def get(self,post_id):
        post = post_model.query.filter_by(id=post_id).first()
        if not post:
            abort(404, "Post not found")

        likes = like_model.query.filter_by(post_id=post_id).all()
        likes_dicts=[]
        for like in likes:
            like_dict = marshal(like, like_resource_fields)
            user = user_model.query.filter_by(email=like.user_email).first()
            like_dict['user'] = marshal(user, userf_resource_fields)
            likes_dicts.append(like_dict)

        return likes_dicts

    def post(self,email,post_id):
        user = user_model.query.filter_by(email=email).first()
        post = post_model.query.filter_by(id=post_id).first()
        if not post:
            abort(404, "Post not found")

        # Check if the user has already liked the post
        like = like_model.query.filter_by(user_email=user.email, post_id=post_id).first()
        if like:
            abort(400, "You have already liked this post")

        # Create a new like relationship in the database
        new_like = like_model(user_email=user.email, post_id=post_id)
        db.session.add(new_like)
        db.session.commit()

        # Retrieve the user object and serialize it
        user_dict = marshal(user, userf_resource_fields)

        # Serialize the like object and add the user object
        like_dict = marshal(new_like, like_resource_fields)
        like_dict['user'] = user_dict

        return like_dict
 
    def delete(self,email,post_id):
        user=user_model.query.filter_by(email=email).first()
        post = post_model.query.filter_by(id=post_id).first()
        if not post:
            abort(404, "Post not found")

        # Check if the user has not already liked the post
        like = like_model.query.filter_by(user_email=user.email, post_id=post_id).first()
        if not like:
            abort(400, "You have not liked this post")

        # Delete the like relationship from the database
        db.session.delete(like)
        db.session.commit()

        return {"message": "Unliked successfully"}
        
class Comment(Resource):
    def get(self, post_id):
        post = post_model.query.filter_by(id=post_id).first()
        if not post:
            abort(404, "Post not found")

        # Fetch all comments for the post from the database
        comments = comment_model.query.filter_by(post_id=post_id).all()
        comment_dicts =[]
        for comment in comments:
            com_dict = marshal(comment, comment_resource_fields)
            user = user_model.query.filter_by(email=comment.user_email).first()
            com_dict['user'] = marshal(user, userf_resource_fields)
            comment_dicts .append(com_dict)

        return comment_dicts
    
    def post(self, email,post_id):
        post = post_model.query.filter_by(id=post_id).first()
        user = user_model.query.filter_by(email=email).first()
        if not post:
            abort(404, "Post not found")

        text = request.json.get('text')
        if not text:
            abort(400, "Text is required")

        # Create a new comment object and store it in the database
        new_comment = comment_model(user_email=user.email, post_id=post_id, text=text, date_posted=datetime.now())
        db.session.add(new_comment)
        db.session.commit()

        # Retrieve the user object and serialize it
        user_dict = marshal(user, userf_resource_fields)
        com_dict=marshal(new_comment, comment_resource_fields)
        com_dict['user'] = user_dict

        return com_dict
    
    def delete(self,email,post_id,comment_id):
        user=user_model.query.filter_by(email=email).first()
        post = post_model.query.filter_by(id=post_id).first()
        if not post:
            abort(404, "Post not found")

        
        comment = comment_model.query.filter_by(user_email=user.email, post_id=post_id,id=comment_id).first()
        if not comment:
            abort(400, "You have not commented on this post")

        # Delete the like relationship from the database
        db.session.delete(comment)
        db.session.commit()

        return {"message": "comment deleted successfully"}

    
class UserSearch(Resource):
    def get(self):
        search_query = request.args.get('q')
        if not search_query:
            abort(400, 'Search query parameter "q" is required')

        # Query the database for users whose usernames match the search query
        users = user_model.query.filter(user_model.username.ilike(f'%{search_query}%')).all()
        user_dicts = [marshal(user, userf_resource_fields) for user in users]

        return user_dicts
    
class Follow(Resource):

    def post(self, followee_email):
        followee = user_model.query.filter_by(email=followee_email).first()
        if not followee:
            abort(404, "User not found")

        # Check if the user is already following the given user
        follow = follow_model.query.filter_by(follower_id=current_user.id, following_id=followee.id).first()
        if follow:
            abort(400, "You are already following this user")

        # Create a new follow relationship in the database
        new_follow = follow_model(follower_id=current_user.id, following_id=followee.id)
        db.session.add(new_follow)
        db.session.commit()

        return marshal(new_follow, follower_resource_fields)


    def delete(self, followee_email):
        user = user_model.query.filter_by(email=followee_email).first()
        if not user:
            abort(404, "user not found")

        # Check if the user is not already following the given user
        follow = follow_model.query.filter_by(follower_id=current_user.id, following_id=user.id).first()
        if not follow:
            abort(400, "you are not following this user")

        # Delete the follow relationship from the database
        db.session.delete(follow)
        db.session.commit()

        return {"message": "unfollowed successfully"}

class Followers(Resource):
    def get(self, email):
        user = user_model.query.filter_by(email=email).first()
        if not user:
            abort(404, "User not found")

        followers=follow_model.query.filter_by(following_id=user.id).all()
        followers_dicts=[]
        for follower in followers:
            followers_dict= marshal(follower,follower_resource_fields)
            followers_dicts.append(followers_dict)
        return followers_dicts
    
class Following(Resource):
    def get(self, email):
        user = user_model.query.filter_by(email=email).first()
        if not user:
            abort(404, "User not found")

        followings=follow_model.query.filter_by(follower_id=user.id).all()

        following_dicts = []
        for following in followings:
            following_dict= marshal(following,following_resource_fields)
            following_dicts.append(following_dict)

        return following_dicts
    
class Feed(Resource):
    def get(self,email):
        if email==current_user.email:
            user = user_model.query.filter_by(email=current_user.email).first()
        # Get the IDs of the users that the current user is following
            following_ids = [f.following_id for f in user.following]
        
        # Fetch posts from the users that the current user is following as well as the current user
            posts = post_model.query.filter(or_(post_model.up_id.in_(following_ids), post_model.up_id == user.id)).order_by(post_model.date_posted.desc()).all()


        # Serialize the posts into dictionaries and encode the picture as a string
            post_dicts = []
            for post in posts:
                post_dict = marshal(post, post_resource_fields)
            # Add the base64-encoded picture to the post data
                post_dict['picture'] = base64.b64encode(post.picture).decode('utf-8')
                post_dicts.append(post_dict)
            return post_dicts
        else:
            abort(400,"you are not authorized")

class IntervalDataResource(Resource):
    def post(self,email):
        data = request.json
        user_id = data.get('user_id')
        login_time = datetime.fromtimestamp(int(data['login_time'])/1000)
        logout_time = datetime.fromtimestamp(int(data['logout_time'])/1000)
        interval = data.get('interval')
        user = user_model.query.filter_by(email=email).first()
        if not user:
            return {'message': 'User not found'}, 404
        interval_data = inter_data(user_id=user.id, login_time=login_time, logout_time=logout_time, interval=interval)
        db.session.add(interval_data)
        db.session.commit()
        return {'message': 'IntervalData saved'}, 201




api.add_resource(Feed,'/feed/<string:email>')
api.add_resource(Followers, '/users/<string:email>/followers')
api.add_resource(Following, '/users/<string:email>/following')
api.add_resource(Like, '/posts/<string:email>/<int:post_id>/like','/posts/<string:email>/<int:post_id>/unlike','/posts/<int:post_id>/likes')
api.add_resource(Comment, '/posts/<string:email>/<int:post_id>/comment','/posts/<int:post_id>/comments','/posts/<string:email>/<int:post_id>/delcom/<int:comment_id>')
api.add_resource(IntervalDataResource, '/interval-data/<string:email>')
api.add_resource(UserSearch, '/search/users')
api.add_resource(User, '/users/<string:email>','/signup','/users/<string:email>/updatedetails')
api.add_resource(Post,'/add_new_post','/users/<string:email>/posts','/users/<string:email>/posts/<int:post_id>','/users/<string:email>/updateposts/<int:post_id>')
api.add_resource(Follow, '/users/<string:followee_email>/follow', '/users/<string:followee_email>/unfollow')