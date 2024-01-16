from flask import Flask, render_template,jsonify
from api.resource import User,api
from models import db,User as user_model
from security import user_datastore, sec
from flask_security import hash_password
import os
import smtplib
import workers
from mailimports import mail
from celery.schedules import crontab
from tasks import export_blogs_csv,export_user_info_csv,send_reminder_email,get_users_to_remind

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///Bloglite_v2.db'
app.config['SECRET_KEY'] = "thisissecret"
app.config['SECURITY_PASSWORD_SALT'] = 'salt'
app.config['WTF_CSRF_ENABLED'] = False
app.config['SECURITY_TOKEN_AUTHENTICATION_HEADER'] = "Authentication-Token"
app.config['SECURITY_PASSWORD_HASH'] = 'bcrypt'
app.config['SMTP_SERVER_HOST']='localhost'
app.config['SMTP_SERVER_PORT']=1025
app.config['SENDER_ADDRESS']='muskan01jan@gmail.com'
app.config['SENDER_PASSWORD']=''

api.init_app(app)
db.init_app(app)
app.app_context().push()
sec.init_app(app,user_datastore)

celery = workers.celery
app.app_context().push()




@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(hour=20, minute=36, day_of_week=0),
       export_blogs_csv.s('waheguru@gmail.com'),
    )
# @app.before_first_request
# def create_db():
#     db.create_all()
#     if not user_datastore.find_user(email="narendra@gmail.com"):
#         script_dir = os.path.dirname(os.path.abspath(__file__))
#         file_path = os.path.join(script_dir, 'static', 'images', 'samaina.jpg')
#         with open(file_path, 'rb') as f:
#             pfp_data = f.read()

#         user_datastore.create_user(pfp=pfp_data,
#             username="narendra", email="narendra@gmail.com", password=hash_password("1234"))
#         db.session.commit()

#     if not user_datastore.find_role('admin'):
#         user_datastore.create_role(
#             name='Admin', description='Admin Related Role')

#         db.session.commit()

from flask import send_file

@app.route('/export-csv/<string:user_email>', methods=['POST'])
def export_blog_csv(user_email):
    # Trigger the Celery task to export the CSV in the background
    task = export_blogs_csv.delay(user_email=user_email)

    # Wait for the task to complete and get its result
    task_result = task.get()

    # Get the path of the CSV file from the task result
    csv_file_path = task_result['csv_file_path']

    # Send the CSV file as a download to the user
    return send_file(csv_file_path, as_attachment=True)

@app.route('/export-csv-user/<string:user_email>', methods=['POST'])
def export_user_csv(user_email):
    # Trigger the Celery task to export the CSV in the background
    task = export_user_info_csv.delay(user_email=user_email)

    # Wait for the task to complete and get its result
    task_result = task.get()

    # Get the path of the CSV file from the task result
    csv_file_path = task_result['csv_file_path']

    # Send the CSV file as a download to the user
    return send_file(csv_file_path, as_attachment=True)


@app.route("/")
def home():
    return render_template("index.html")

@app.route("/sum/a/<int:a>/b/<int:b>")
def get_sum(a,b):
    c= tasks.sum.apply_async((a,b),expires=10)
    return str(c.get())


if __name__=="__main__":
    app.run(debug=True)