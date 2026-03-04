aws_region  = "us-east-1"
environment = "dev"
project_name = "spatial-files"

lambda_runtime     = "nodejs20.x"
lambda_memory_size = 512
lambda_timeout     = 30

max_file_size_mb           = 100
presigned_url_expiration   = 3600
allowed_file_types         = "pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,mp4,mov,avi"

cognito_user_pool_name = "spatial-users"
