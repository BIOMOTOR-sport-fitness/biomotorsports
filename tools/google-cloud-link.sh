#!/usr/bin/env bash
# BIOMOTOR — links your Google Cloud project to your GitHub repository, with NO key file.
# Run it in Google Cloud Shell:
#   bash <(curl -sL https://raw.githubusercontent.com/<github-user>/biomotor-platform/main/tools/google-cloud-link.sh) <project-id> <github-user>/biomotor-platform
set -euo pipefail
PROJECT_ID="${1:?Give your Google Cloud / Firebase Project ID}"
REPO="${2:?Give your GitHub repository, e.g. biomotorsports/biomotor-platform}"
SA_NAME=github-deploy
SA="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
POOL=github; PROVIDER=biomotor

echo "▶ Project: $PROJECT_ID   GitHub repo: $REPO"
gcloud config set project "$PROJECT_ID" >/dev/null
PN=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

echo "▶ Turning on the Google services that are needed…"
gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com \
  firebase.googleapis.com firebasehosting.googleapis.com cloudresourcemanager.googleapis.com serviceusage.googleapis.com

echo "▶ Making the deploy account ($SA)…"
gcloud iam service-accounts describe "$SA" >/dev/null 2>&1 || \
  gcloud iam service-accounts create "$SA_NAME" --display-name="GitHub deploy (BIOMOTOR)"
for ROLE in roles/firebasehosting.admin roles/serviceusage.apiKeysViewer roles/serviceusage.serviceUsageConsumer roles/firebase.viewer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA" --role="$ROLE" --condition=None >/dev/null
done

echo "▶ Letting only your GitHub repository use it (Workload Identity)…"
gcloud iam workload-identity-pools describe "$POOL" --location=global >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools create "$POOL" --location=global --display-name="GitHub"
if gcloud iam workload-identity-pools providers describe "$PROVIDER" --location=global --workload-identity-pool="$POOL" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers update-oidc "$PROVIDER" --location=global --workload-identity-pool="$POOL" \
    --attribute-condition="assertion.repository=='$REPO'" >/dev/null
else
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" --location=global --workload-identity-pool="$POOL" \
    --display-name="BIOMOTOR GitHub" --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository=='$REPO'"
fi
gcloud iam service-accounts add-iam-policy-binding "$SA" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PN/locations/global/workloadIdentityPools/$POOL/attribute.repository/$REPO" >/dev/null

echo
echo "✅ Done. Now add these 3 values in GitHub → repo → Settings → Secrets and variables → Actions → Variables:"
echo
echo "   FIREBASE_PROJECT_ID   = $PROJECT_ID"
echo "   GCP_WIF_PROVIDER      = projects/$PN/locations/global/workloadIdentityPools/$POOL/providers/$PROVIDER"
echo "   GCP_SERVICE_ACCOUNT   = $SA"
echo
