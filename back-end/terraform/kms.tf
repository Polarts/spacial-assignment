# KMS Key for encryption
resource "aws_kms_key" "files" {
  description             = "KMS key for ${var.project_name} file encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "${var.project_name}-files-key-${var.environment}"
  }
}

resource "aws_kms_alias" "files" {
  name          = "alias/${var.project_name}-files-${var.environment}"
  target_key_id = aws_kms_key.files.key_id
}

# KMS Key Policy
resource "aws_kms_key_policy" "files" {
  key_id = aws_kms_key.files.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda to use the key"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.lambda_api.arn,
            aws_iam_role.lambda_verifier.arn
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

data "aws_caller_identity" "current" {}
