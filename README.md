# Wekan Webhook Handler

A simple webhook handler for Wekan board events. This service provides a secure endpoint for receiving webhooks from Wekan boards with token-based authentication.

## Features
- Token-based authentication (supports both `X-Webhook-Token` and `X-Wekan-Token` headers)
- Zero logging policy - no data is stored or logged
- Simple JSON responses
- Web interface with documentation

## Test Endpoint

A test endpoint is available at:
```
https://wekan-webhook.deno.dev/
```

📖 [View Documentation in Browser](https://wekan-webhook.deno.dev/)

## Authentication

The endpoint requires a webhook token for authentication using either the `X-Webhook-Token` or `X-Wekan-Token` header.
Default test token: `test1234`

## Example Requests

### Success Example (with correct token)
```bash
curl -X POST https://wekan-webhook.deno.dev/ \
  -H "Content-Type: application/json" \
  -H "X-Wekan-Token: test1234" \
  -d '{"event":"test","data":{"message":"This is a test webhook"}}'
```
[Try in Browser](https://wekan-webhook.deno.dev/?example=success)

### Failure Example (wrong token)
```bash
curl -X POST https://wekan-webhook.deno.dev/ \
  -H "Content-Type: application/json" \
  -H "X-Wekan-Token: wrong-token" \
  -d '{"event":"test","data":{"message":"This should fail"}}'
```
[Try in Browser](https://wekan-webhook.deno.dev/?example=fail-token)

### Failure Example (missing token)
```bash
curl -X POST https://wekan-webhook.deno.dev/ \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"This should fail"}}'
```
[Try in Browser](https://wekan-webhook.deno.dev/?example=fail-missing)

## Development

### Prerequisites
- Deno installed
- Environment variables set in `.env` file:
  ```
  WEBHOOK_TOKEN=your-token-here
  ```

### Running locally
```bash
deno task start
```

### Testing
```bash
deno task test-webhook
```

## Deployment

You can easily deploy your own instance of this webhook service to Deno Deploy:

1. Fork this repository
2. Set up a new project on [Deno Deploy](https://deno.com/deploy)
3. Configure your webhook token in the environment variables

## Privacy Notice

This service operates with a strict no-logging policy. No webhook data, headers, or request information is stored or logged. All requests are processed in memory and immediately discarded after the response is sent.

## License

[MIT License](LICENSE) 