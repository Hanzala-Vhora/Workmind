# AWS Hosting & Scaling Guide for Workmind.ai

This document outlines the strategy for scaling the Workmind.ai application to handle multiple concurrent users and provides a step-by-step guide for hosting on AWS.

## 1. Scaling for Multiple Users (Fix 2)

To ensure that multiple users can access the website concurrently without performance degradation, the following architecture and application-level changes are implemented:

### Application-Level Optimization
*   **Process Management**: Node.js is single-threaded. To utilize multi-core servers, we use **PM2** (Process Manager 2). PM2 automatically spawns multiple instances of the server (one per core) and load balances traffic between them.
*   **Stateless Architecture**: The server is designed to be stateless. Sessions are handled via JWT/Clerk/NextAuth, and all persistent data is in PostgreSQL. This allows horizontal scaling (running multiple servers) without data inconsistency.
*   **Database Connection Pooling**: Prisma is configured to handle connection pooling, ensuring that multiple concurrent requests don't exhaust the database connection limit.
*   **Asynchronous RAG**: The "Retrieval Augmented Generation" (PDF searching) is asynchronous, preventing the server from blocking while searching through large documents.

### Infrastructure-Level Scaling
*   **Horizontal Pod Autoscaling (HPA)**: When using AWS ECS or App Runner, the system automatically spins up new server instances when CPU usage exceeds 60%.
*   **Load Balancing**: An Application Load Balancer (ALB) distributes incoming traffic across all healthy server instances.

---

## 2. AWS hosting for Smoother Usage (Fix 3)

For the best performance and "smoother usage," AWS provides several managed services that offload the operational burden.

### Recommended AWS Architecture
| Component | AWS Service | Rationale |
| :--- | :--- | :--- |
| **Frontend** | S3 + CloudFront | Lightning-fast asset delivery via CDN; reduces load on your server. |
| **Backend** | App Runner / ECS | Managed container services with automatic scaling and SSL. |
| **Database** | RDS (PostgreSQL) | Managed backups, high availability, and scaling. |
| **Secrets** | Secrets Manager | Securely stores API keys for OpenAI, Gemini, etc. |
| **File Storage**| S3 | Securely stores uploaded PDFs and images. |

### Deployment Steps (Step-by-Step)

#### Step 1: Containerize the application
Create a `Dockerfile` in the root of the project to bundle the frontend and backend together, or deploy them separately (recommended).

#### Step 2: Set up RDS (Relational Database Service)
1.  Launch a PostgreSQL instance.
2.  Enable "Multi-AZ" for high availability (so the site stays up if one AWS data center fails).
3.  Copy the connection string to your environment variables.

#### Step 3: Deploy Backend to AWS App Runner
1.  Connect your GitHub repository.
2.  Choose **App Runner** for the simplest experience. It will automatically build and deploy your code whenever you push to main.
3.  Set the environment variables in the App Runner console.

#### Step 4: Deploy Frontend to S3 & CloudFront
1.  Run `npm run build` locally or in a CI/CD pipeline.
2.  Sync the `dist` folder to an S3 bucket.
3.  Create a CloudFront distribution pointing to that S3 bucket. This ensures your website loads instantly for users everywhere.

### Why this is "Smoother"
*   **Zero Downtime**: AWS App Runner performs rolling updates, meaning the old version stays up while the new one starts.
*   **Elasticity**: If 1,000 users join at once, AWS will automatically add 5 more servers to handle the load.
*   **Managed Updates**: You don't need to worry about patching the OS or managing Node.js versions on the server.
