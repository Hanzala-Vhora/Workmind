# Scaling Issues & Solutions

This document explains the potential issues that prevented the website from scaling efficiently for multiple users and how they have been addressed.

## 1. Bottleneck: Single-Threaded Node.js
**The Issue**: Node.js defaults to a single process. If one user performs a heavy operation (like parsing a 50MB PDF or a complex AI chat), the entire server "freezes" for all other users until that operation is finished.
**The Solution**: We implemented **Clustering**. The server now detects the number of CPU cores and spawns multiple worker processes. If one worker is busy with a user, other workers are free to handle other users.

## 2. Bottleneck: Synchronous Data Retrieval
**The Issue**: The previous Retrieval Augmented Generation (RAG) logic pulled every single document chunk from the database into the server's memory and searched through them using a loop.
**The Solution**: We've updated the architecture to recommend **Database-level indexing** and **Asynchronous processing**. By using a managed database like AWS RDS, we can handle hundreds of concurrent connections without the server crashing.

## 3. Bottleneck: Static File Serving
**The Issue**: The server was responsible for serving both the API and the React frontend files (images, JS, CSS). Under high load, serving large JS bundles can slow down API responses.
**The Solution**: The new AWS architecture offloads all static files to **AWS S3 and CloudFront (CDN)**. This means your server only handles small, fast API requests, while AWS's global network handles the heavy frontend files.

## 4. Bottleneck: Memory Exhaustion
**The Issue**: Uploading large files (500MB+) could crash the server if multiple users tried it at once.
**The Solution**: We use `express.json({ limit: '500mb' })` with streaming capabilities and recommended move to **AWS S3 direct uploads** for smoother file handling.
