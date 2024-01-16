broker_url= "redis://localhost:6379/1"
result_backend = "redis://localhost:6379/2"
enable_utc=False
timezone = "Asia/Kolkata"

# # Flask settings
# SECRET_KEY = 'mysecretkey'

# # Celery settings
# CELERY_BROKER_URL = 'redis://localhost:6379/0'
# CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
task_serializer = 'json'
result_serializer= 'json'
accept_content = ['json']