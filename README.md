# Variant Curation Portal

![CI status bage](https://github.com/populationgenomics/variant-curation-portal/workflows/CI/badge.svg)

## Deployment

In the [upstream repository](https://github.com/macarthur-lab/lof-curation-portal-env), deployment is based on Kubernetes. At the CPG, we use the Identity-Aware Proxy (IAP) and Cloud Run instead.

The following steps use the `prod` environment, but simply replace `prod` with another environment like `dev` for isolated namespaces.

1. Create a GCP project and set the environment variable `GCP_PROJECT` to the corresponding GCP project ID.

    ```sh
    export GCP_PROJECT=curator-348003
    ```

1. Set up a billing budget, if desired.
1. Reserve a static external IP address.
1. Create a CNAME record to associate the IP address with a subdomain.
1. Create a managed PostgreSQL instance, called `curator-postgres-prod`, with the smallest possible resource footprint and a private IP. Make sure to enable regular backups. To enable [full query logs](https://cloud.google.com/sql/docs/postgres/pg-audit), enable the `cloudsql.enable_pgaudit` flag and set the `pgaudit.log` flag to `all`.
1. Add an `lof_curation` DB user and a database of the same name.
1. Create a service account `curator-prod` for running the Cloud Run instance.
1. In the Secret Manager, create two secrets:
    - `django-secret-key-prod` (50 random characters)
    - `postgres-password-prod` (copy password from the `lof_curation` DB user)
1. Grant the `curator-prod` service account *Secret Manager Secret Accessor* permissions to the secrets.
1. Create a VM called `curator-admin` using the `curator-prod` service account and connect using ssh:

    ```sh
    gcloud --project=$GCP_PROJECT compute ssh curator-admin
    ```

    On the VM, connect to the SQL instance (replace the `hostaddr` value with the SQL instance's private IP):

    ```sh
    sudo apt update && sudo apt install -y postgresql-client

    psql "sslmode=disable dbname=postgres user=postgres hostaddr=10.48.64.3"
    ```

    Enable the `pgaudit` extension:

    ```sql
    CREATE EXTENSION pgaudit;
    ```

    Exit the `psql` client.
1. On the VM, install Docker:

    ```sh
    sudo apt install -y docker.io

    sudo usermod -aG docker $USER
    ```

    Log out and back in. Clone the source code and run a local container:

    ```sh
    git clone https://github.com/populationgenomics/variant-curation-portal.git

    cd variant-curation-portal

    docker build --tag curator-prod .

    # Copy the environment variables from the deploy_prod workflow.
    docker run --init -it -e ... curator-prod /bin/sh
    ```

    To perform the initial Django setup and [grant user permissions](https://github.com/macarthur-lab/variant-curation-portal/blob/main/docs/permissions.md#granting-permissions), run this within the container:

    ```sh
    ./manage.py migrate

    # Add permissions as described in the link above.
    PYTHONPATH=. django-admin shell -i python
    ```

    Shut down the VM instance, but don't delete it, to easily apply future migrations.
1. Create a Serverless VPC Access connector called `curator-vpc-connector` with minimum bandwidth.
1. Build the Docker image and deploy to Cloud Run, using the `gcloud run deploy` command from the [`deploy_prod` workflow](.github/workflows/deploy_prod.yaml).
1. Set up a `curator-deploy` service account and store its JSON key as the `GCP_DEPLOY_KEY` GitHub Actions secret.
1. Grant the `curator-deploy` service account *Cloud Run Admin* permissions for the `curator-prod` Cloud Run service.
1. Set up an HTTPS load balancer pointing to the Cloud Run endpoint, using the previously reserved external IP address. Create a new Google-managed certificate that points to the subdomain chosen before.
1. Configure an OAuth consent screen.
1. Set up IAP for the HTTPS load balancer.
1. Create a Google Group called `curator-prod-access` to control who can access the portal through IAP.
1. On the IAP resource, grant the *IAP-Secured Web App User* role to the `curator-prod-access` group.
