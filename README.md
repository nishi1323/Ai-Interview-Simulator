# AI Interview Simulator

AI Interview Simulator is a Java-only full-stack interview preparation platform that combines resume analysis, job-role matching, adaptive interview generation, scoring, and personalized learning roadmaps.

## Implemented Workflows

- Register, sign in, view and update the authenticated profile, and sign out
- Upload selectable-text PDFs, extract text with PDFBox, save analysis in MongoDB, and view identified resume sections
- Compare the latest resume's detected skills with a pasted job description and display matching/missing skills
- Select a target role, create a persisted interview, resume at the first unanswered question, submit evaluated answers, and view results/history
- View performance trends, score-derived skill gaps, and a ranked improvement plan
- Chat with a signed-in career assistant personalized with the latest resume and interview scores
- Practice voice responses with browser speech recognition where supported, manual transcript entry elsewhere, and Java-generated evaluation metrics
- Solve a sample JavaScript challenge with test cases executed in a terminable browser worker

## System Architecture

Frontend (React + Vite)
- User interface for authentication, dashboard, resume upload, interview flow, reports, and settings
- Uses React Router for routing and Axios for API calls
- Consumes REST APIs from the Spring Boot backend

Backend (Spring Boot + Java)
- Authentication and authorization using JWT
- Business logic for users, resumes, interviews, scoring, and reports
- Persistence with JPA/Hibernate and PostgreSQL/MySQL
- Resume-analysis documents are stored in MongoDB; user and interview records remain relational
- AI analysis is handled directly inside the Java service layer using rule-based evaluation and adaptive logic

## Database ER Diagram Description

Core entities:
- USER: id, name, email, password, phone, experienceLevel, createdAt
- RESUME: id, userId, fileName, extractedText, skills, education, projects, certifications
- SKILL: id, name, category
- JOB_ROLE: id, title, description, requiredSkills
- INTERVIEW: id, userId, jobRoleId, type, difficulty, questionsCount, score, duration
- QUESTION: id, interviewId, statement, type, difficulty, isFollowUp
- ANSWER: id, questionId, interviewId, text, score, communicationScore, feedback
- SCORE: id, interviewId, technical, communication, relevance, problemSolving, delivery
- INTERVIEW_FEEDBACK: id, interviewId, strengths, weaknesses, summary
- SKILL_GAP: id, interviewId, skillName, gapPercent, priority
- LEARNING_ROADMAP: id, interviewId, day, title, task

Relationships:
- One user has many resumes, interviews, and progress reports
- One interview has many questions and answers
- One interview has one overall score summary and multiple skill-gap records
- One interview has one roadmap and one feedback summary

## Complete Folder Structure

frontend/
  src/
    components/
    pages/
    services/
    hooks/
    context/
    utils/
    assets/

backend/
  src/main/java/
    controller/
    service/
    repository/
    entity/
    dto/
    security/
    exception/
    config/

## Development Phases

1. Foundation and project structure
2. Backend authentication and user management
3. Resume upload and parsing
4. Job role matching and interview configuration
5. Interview engine and adaptive question flow
6. Scoring, reports, and skill gaps
7. Dashboard analytics and frontend polish
8. Integration, testing, and demo readiness

## Backend Setup

1. Install Java 17+
2. Ensure Maven is installed
3. Configure PostgreSQL and set `DB_PASSWORD` (and `DB_USERNAME` if needed) in the backend process environment.
4. Set `JWT_SECRET` to a secret of at least 32 characters. Do not commit credentials or signing keys.
5. Run: `mvn clean install`
6. Start: `mvn spring-boot:run`

For a local demo without installing a database, start the backend with the included in-memory H2 profile:

`$env:JWT_SECRET="replace-with-a-random-secret-of-at-least-32-characters"; mvn spring-boot:run -Dspring-boot.run.profiles=demo`

The demo profile still requires `JWT_SECRET`. `MONGODB_URI` and `GROQ_API_KEY` are optional; MongoDB defaults to the local instance and the assistant uses built-in coaching when no Groq key is configured.

## Database Setup

- PostgreSQL connection settings are configured in `backend/src/main/resources/application.properties`. Supply credentials through the `DB_USERNAME` and `DB_PASSWORD` environment variables rather than committing passwords.
- MongoDB default: `mongodb://localhost:27017/ai_interview`

## MongoDB Setup

- Local default: `mongodb://localhost:27017/ai_interview`
- For MongoDB Atlas or another deployment, set `MONGODB_URI` in the backend process environment. Keep credentials out of source control.
- Resume analysis is written to the `resume_analyses` collection. SQL stores the owner and the Mongo document reference; uploaded raw resume text remains in the relational resume record.
- PDFBox extracts selectable PDF text before analysis. Image-only/scanned PDFs are rejected with an OCR-required message; OCR is not currently included.
- The Java driver uses its defaults for connection pooling. Monitor MongoDB connections and upload/read latency before tuning pool settings.

## Frontend Setup

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Build for production: `npm run build`

## Deploying the Frontend to Vercel

Import this GitHub repository in Vercel and set the project root directory to `frontend`. Vercel will use `npm run build` and `dist` as the output directory; `frontend/vercel.json` rewrites client-side routes for React Router.

Set the `VITE_API_BASE_URL` environment variable in the Vercel project to the publicly reachable backend API URL, including `/api` (for example, `https://your-backend.example.com/api`), then redeploy. The backend must also allow requests from the deployed Vercel origin in its `CORS_ALLOWED_ORIGINS` environment variable. Without a deployed backend URL, API-backed features will not work from the deployed frontend.

## Deploying the Backend to Render

The Spring Boot backend can be deployed from the repository's `render.yaml` Blueprint and `backend/Dockerfile`. The Render web service requires a PostgreSQL connection (`DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`), a MongoDB Atlas connection string (`MONGODB_URI`), and a generated `JWT_SECRET`. Set `GROQ_API_KEY` only if enabling the external AI assistant. Set `CORS_ALLOWED_ORIGINS` to the deployed frontend origin. The included Blueprint uses Render's free web-service plan; free services can spin down when idle. Create or attach a PostgreSQL database and MongoDB deployment separately, and check their current pricing, storage, and retention limits before use.

After the backend is deployed, set Vercel's `VITE_API_BASE_URL` to `https://<backend-host>/api` and redeploy the frontend. Never put database or AI provider secrets in Vite environment variables.

## Verification

- Backend tests: `cd backend` then `mvn test`
- Frontend production build: `cd frontend` then `npm run build`

## Current Limits

- Answer scores and resume section extraction are Java heuristic logic, not a connected hosted LLM. Match percentages are skill-overlap ratios, not hiring predictions.
- Without an OpenAI key, the personalized assistant uses built-in Java coaching rules and the signed-in user's saved profile, latest resume, and completed interview scores locally.
- To enable adaptive Groq-powered assistant replies, create an API key in the Groq console and set `GROQ_API_KEY` in the backend process environment. The default model is `llama-3.3-70b-versatile`; override it with `GROQ_MODEL` if needed. Keep the key on the backend and never commit it or expose it through a `VITE_` variable. The assistant sends the user's question, recent chat turns, and a limited summary of extracted skills and interview scores, not raw resume text or account identifiers. Without the key, built-in coaching remains available and the UI indicates that replies are limited.
- PDFBox extracts selectable text only. Scanned-image PDF OCR is not included.
- Browser speech recognition depends on browser support and microphone permission; manual transcript entry remains available.
- Coding practice recommends among four JavaScript challenges based on the latest interview's weakest technical/problem-solving dimensions. Tests run in a terminable browser worker; it is not a multi-language judge or hidden-test service.
- The `demo` profile uses in-memory H2 for relational data, which resets at backend restart. Use PostgreSQL/MySQL configuration for persistent accounts/interviews; MongoDB resume analysis is separate and persistent.

## Notes

This project is built as a realistic final-year BTech CSE project using Java only for the application stack, with Spring Boot powering the API, data persistence, security, and AI evaluation logic in the backend service layer.
