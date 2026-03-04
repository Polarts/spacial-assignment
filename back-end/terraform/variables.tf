variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "spatial-files"
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "max_file_size_mb" {
  description = "Maximum file size in MB"
  type        = number
  default     = 100
}

variable "presigned_url_expiration" {
  description = "Presigned URL expiration in seconds"
  type        = number
  default     = 3600
}

variable "allowed_file_types" {
  description = "Comma-separated list of allowed file types"
  type        = string
  default     = "pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,mp4,mov,avi"
}

variable "cognito_user_pool_name" {
  description = "Cognito User Pool name"
  type        = string
  default     = "spatial-users"
}
