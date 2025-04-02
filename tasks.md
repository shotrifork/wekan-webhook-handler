# Wekan Webhook Logger - Project Plan

## Understanding
- Need a webhook endpoint that receives JSON payloads from Wekan
- The endpoint should log the received JSON in a prettified format
- Optional token-based authentication using .env file
- If token is configured but missing/invalid in request, log the rejection reason
- This will be used as part of Wekan automation
- The endpoint will be deployed on Deno Deploy platform

## Technology Choices
- Deno Deploy for hosting (serverless, edge computing)
- Deno's built-in web server capabilities
- Deno's dotenv module for environment variables
- Deno's standard logging capabilities

## Tasks Checklist

### 1. Project Setup
- [x] Create project structure
- [x] Create README.md with setup instructions
- [x] Create .env.example file
- [x] Create .gitignore file

### 2. Core Implementation
- [x] Create main server file (main.ts)
- [x] Implement webhook endpoint
- [x] Add JSON prettification logging
- [x] Implement token validation logic
- [x] Add error handling

### 3. Environment Configuration
- [x] Set up dotenv configuration
- [x] Implement token validation from .env
- [x] Add configuration validation

### 4. Testing
- [ ] Add test cases for token validation
- [ ] Add test cases for JSON logging
- [ ] Document test procedures

### 5. Deployment
- [x] Create deployment configuration
- [x] Document deployment process
- [x] Add deployment instructions to README

### 6. Deno Deploy Configuration
- [x] Create deno.json configuration file
- [x] Create import_map.json for module imports
- [x] Create .cursor/deploy.mdc file for Deno Deploy
- [x] Add Deno Deploy specific documentation
- [x] Configure environment variables in Deno Deploy dashboard

### 7. Documentation
- [x] Add comprehensive content to .cursor/deploy.mdc
- [x] Add section about .mdc files to README.md
- [x] Document the benefits and usage of .mdc files 