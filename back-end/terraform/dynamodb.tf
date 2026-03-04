# DynamoDB Table for file metadata
resource "aws_dynamodb_table" "files" {
  name           = "${var.project_name}-files-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "projectId"
  range_key      = "sortKey"

  attribute {
    name = "projectId"
    type = "S"
  }

  attribute {
    name = "sortKey"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  # GSI1 for querying files by project and type
  # GSI1PK: projectId, GSI1SK: fileType#createdAt
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "retentionAt"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.files.arn
  }

  tags = {
    Name = "${var.project_name}-files-${var.environment}"
  }
}
