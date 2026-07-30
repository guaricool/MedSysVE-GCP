terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "The GCP Region"
  type        = string
  default     = "us-central1"
}

variable "image_url" {
  description = "The container image URL"
  type        = string
}

resource "google_cloud_run_v2_service" "medsysve_service" {
  name     = "medsysve-app"
  location = var.region
  
  # CRITICAL SECURITY CONTROL:
  # Restrict ingress to internal traffic and the Global HTTP(S) Load Balancer.
  # This prevents direct access via the default *.run.app URL and forces all
  # external traffic to pass through Google Cloud Armor (WAF).
  ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    containers {
      image = var.image_url
      
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
      
      ports {
        container_port = 3000
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = "medsysve-database-url"
            version = "latest"
          }
        }
      }

      env {
        name = "AUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = "medsysve-auth-secret"
            version = "latest"
          }
        }
      }

      env {
        name = "FIELD_ENCRYPTION_KEY"
        value_source {
          secret_key_ref {
            secret  = "medsysve-field-encryption-key"
            version = "latest"
          }
        }
      }

      env {
        name = "STRIPE_SECRET_KEY"
        value_source {
          secret_key_ref {
            secret  = "medsysve-stripe-secret-key"
            version = "latest"
          }
        }
      }

      env {
        name = "CRON_SECRET"
        value_source {
          secret_key_ref {
            secret  = "medsysve-cron-secret"
            version = "latest"
          }
        }
      }
    }
  }
}
