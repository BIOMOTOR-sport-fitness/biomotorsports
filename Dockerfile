# Optional: run the BIOMOTOR website on Google Cloud Run
#   gcloud run deploy biomotor --source . --region asia-south1 --allow-unauthenticated
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html download.html manifest.webmanifest sw.js /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY assets /usr/share/nginx/html/assets
COPY sk /usr/share/nginx/html/sk
EXPOSE 8080
