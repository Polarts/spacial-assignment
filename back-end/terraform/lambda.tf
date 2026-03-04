# Package Lambda function
data "archive_file" "lambda_api" {
  type        = "zip"
  source_dir  = "${path.module}/../dist"
  output_path = "${path.module}/lambda-api.zip"
}

data "archive_file" "lambda_verifier" {
  type        = "zip"
  source_dir  = "${path.module}/../dist"
  output_path = "${path.module}/lambda-verifier.zip"
}

# API Lambda Function
resource "aws_lambda_function" "api" {
  filename         = data.archive_file.lambda_api.output_path
  function_name    = "${var.project_name}-api-${var.environment}"
  role             = aws_iam_role.lambda_api.arn
  handler          = "lambda.handler"
  source_code_hash = data.archive_file.lambda_api.output_base64sha256
  runtime          = var.lambda_runtime
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size

  environment {
    variables = {
      NODE_ENV                   = var.environment
      AWS_REGION                 = var.aws_region
      DYNAMODB_FILES_TABLE       = aws_dynamodb_table.files.name
      S3_FILES_BUCKET            = aws_s3_bucket.files.id
      KMS_KEY_ID                 = aws_kms_key.files.id
      COGNITO_USER_POOL_ID       = aws_cognito_user_pool.main.id
      COGNITO_CLIENT_ID          = aws_cognito_user_pool_client.main.id
      MAX_FILE_SIZE_MB           = var.max_file_size_mb
      ALLOWED_FILE_TYPES         = var.allowed_file_types
      PRESIGNED_URL_EXPIRATION   = var.presigned_url_expiration
    }
  }

  tags = {
    Name = "${var.project_name}-api-${var.environment}"
  }
}

# Verifier Lambda Function
resource "aws_lambda_function" "verifier" {
  filename         = data.archive_file.lambda_verifier.output_path
  function_name    = "${var.project_name}-verifier-${var.environment}"
  role             = aws_iam_role.lambda_verifier.arn
  handler          = "verifier/verifier.handler.handler"
  source_code_hash = data.archive_file.lambda_verifier.output_base64sha256
  runtime          = var.lambda_runtime
  timeout          = 60
  memory_size      = var.lambda_memory_size

  environment {
    variables = {
      NODE_ENV             = var.environment
      AWS_REGION           = var.aws_region
      DYNAMODB_FILES_TABLE = aws_dynamodb_table.files.name
      S3_FILES_BUCKET      = aws_s3_bucket.files.id
      KMS_KEY_ID           = aws_kms_key.files.id
    }
  }

  tags = {
    Name = "${var.project_name}-verifier-${var.environment}"
  }
}

# Lambda permission for S3 to invoke verifier
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.verifier.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.files.arn
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*"
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_api" {
  name              = "/aws/lambda/${aws_lambda_function.api.function_name}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "lambda_verifier" {
  name              = "/aws/lambda/${aws_lambda_function.verifier.function_name}"
  retention_in_days = 14
}
