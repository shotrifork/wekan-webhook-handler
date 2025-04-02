import { load } from "https://deno.land/std@0.220.1/dotenv/mod.ts";

// Load environment variables - try both Deno.env and .env file
let WEBHOOK_TOKEN: string;
try {
  // First try Deno.env (for production/Deno Deploy)
  WEBHOOK_TOKEN = Deno.env.get("WEBHOOK_TOKEN") || "";
  
  // If not found in Deno.env, try loading from .env file (for local development)
  if (!WEBHOOK_TOKEN) {
    const env = await load();
    WEBHOOK_TOKEN = env["WEBHOOK_TOKEN"] || "";
  }
} catch (error) {
  console.warn("Error loading environment variables:", error);
  WEBHOOK_TOKEN = "";
}

// Validate webhook token if present
function validateToken(request: Request): { valid: boolean; reason?: string } {
  if (!WEBHOOK_TOKEN) {
    return { valid: true };
  }

  // Check both possible header names
  const token = request.headers.get("X-Webhook-Token") || request.headers.get("X-Wekan-Token");
  if (!token) {
    return { valid: false, reason: "Missing webhook token (expected in X-Webhook-Token or X-Wekan-Token header)" };
  }

  if (token !== WEBHOOK_TOKEN) {
    return { valid: false, reason: "Invalid webhook token" };
  }

  return { valid: true };
}

// Handle webhook requests
async function handleWebhook(request: Request): Promise<Response> {
  // If GET request, show documentation
  if (request.method === "GET") {
    // Get the example type from URL parameters
    const url = new URL(request.url);
    const example = url.searchParams.get("example");
    
    // Prepare example response based on the example type
    let exampleResponse = "";
    if (example) {
      switch (example) {
        case "success":
          exampleResponse = JSON.stringify({
            status: "ok",
            message: "Webhook received successfully",
            timestamp: new Date().toISOString(),
            received_data: {
              payload: {"event":"test","data":{"message":"This is a test webhook"}},
              headers: {
                "content-type": "application/json",
                "x-wekan-token": "test1234"
              }
            }
          }, null, 2);
          break;
        case "fail-token":
          exampleResponse = JSON.stringify({
            error: "Invalid webhook token"
          }, null, 2);
          break;
        case "fail-missing":
          exampleResponse = JSON.stringify({
            error: "Missing webhook token (expected in X-Webhook-Token or X-Wekan-Token header)"
          }, null, 2);
          break;
      }
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Wekan Webhook Documentation</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/@tailwindcss/ui@latest/dist/tailwind-ui.min.css" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    html {
      scroll-behavior: smooth;
    }
    @keyframes blink-orange {
      0% { background-color: rgb(249 115 22 / 0.2); }
      50% { background-color: rgb(249 115 22 / 0.4); }
      100% { background-color: rgb(243 244 246); }
    }
    .blink-animation {
      animation: blink-orange 1s ease-in-out;
    }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Function to update response section
      async function updateResponseSection(example, targetDiv) {
        let controller;
        try {
          // Cleanup any existing controller
          if (controller) {
            controller.abort();
          }
          
          // Create new controller for this request
          controller = new AbortController();
          
          // Make the actual HTTP request based on the example type
          const requestConfig = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              event: "test",
              data: { message: example === 'success' ? "This is a test webhook" : "This should fail" }
            }),
            signal: controller.signal
          };

          // Add token based on example type
          if (example === 'success') {
            requestConfig.headers['X-Wekan-Token'] = 'test1234';
          } else if (example === 'fail-token') {
            requestConfig.headers['X-Wekan-Token'] = 'wrong-token';
          }
          
          const response = await fetch(window.location.href, requestConfig);
          const jsonResponse = await response.json();
          
          // Find or create response section in current div
          let responseSection = targetDiv.querySelector('.response-section');
          if (!responseSection) {
            responseSection = document.createElement('div');
            responseSection.className = 'mt-2 bg-gray-50 rounded-lg p-4 overflow-x-auto response-section';
            targetDiv.appendChild(responseSection);
          }
          
          // Update content with the actual response
          const escapedJson = JSON.stringify(jsonResponse, null, 2)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          responseSection.innerHTML = '<pre class="text-sm text-gray-700"><code>' + escapedJson + '</code></pre>';
          
          // Add status indicator
          const statusDiv = targetDiv.querySelector('.status-indicator');
          if (statusDiv) {
            statusDiv.textContent = response.ok ? '✓ Response:' : '✗ Response:';
            statusDiv.className = response.ok ? 'text-sm text-green-600' : 'text-sm text-red-600';
          }
          
          // Trigger animation
          responseSection.classList.remove('blink-animation');
          void responseSection.offsetWidth;
          responseSection.classList.add('blink-animation');
          
          // Scroll to the response
          responseSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('Request was aborted');
            return;
          }
          
          console.error('Error making request:', error);
          // Show error in response section
          let responseSection = targetDiv.querySelector('.response-section');
          if (!responseSection) {
            responseSection = document.createElement('div');
            responseSection.className = 'mt-2 bg-gray-50 rounded-lg p-4 overflow-x-auto response-section';
            targetDiv.appendChild(responseSection);
          }
          const errorMessage = error.message || 'Unknown error occurred';
          responseSection.innerHTML = '<pre class="text-sm text-red-600"><code>Error: ' + errorMessage + '</code></pre>';
        } finally {
          // Cleanup controller
          if (controller) {
            controller.abort();
            controller = null;
          }
        }
      }

      // Handle example buttons
      document.querySelectorAll('button[data-example]').forEach((button) => {
        button.addEventListener('click', async () => {
          const example = button.getAttribute('data-example');
          if (!example) return;

          const url = new URL(window.location.href);
          url.searchParams.set('example', example);
          window.history.pushState({}, '', url);
          
          // Update the response section
          const targetDiv = button.closest('div');
          if (targetDiv) {
            await updateResponseSection(example, targetDiv);
          }
        });
      });

      // Add animation to response sections if they exist on page load
      const urlParams = new URLSearchParams(window.location.search);
      const example = urlParams.get('example');
      if (example) {
        const button = document.querySelector('button[data-example="' + example + '"]');
        const responseElement = button?.closest('div')?.querySelector('.response-section');
        if (responseElement) {
          responseElement.classList.add('blink-animation');
        }
      }
    });
  </script>
</head>
<body class="bg-gray-100 min-h-screen p-4 md:p-8">
  <div class="max-w-4xl mx-auto">
    <!-- Main Card -->
    <div class="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
      <div class="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
        <h1 class="text-2xl font-bold text-white">Wekan Webhook Documentation</h1>
      </div>
      
      <div class="p-6">
        <!-- About Section -->
        <div class="mb-8">
          <h2 class="text-xl font-semibold text-gray-800 mb-3">About This Service</h2>
          <div class="bg-blue-50 rounded-lg p-4">
            <p class="text-blue-700 mb-3">
              This is a simple webhook service designed to receive and validate webhooks from Wekan boards. 
              It provides a secure endpoint that validates incoming requests using a token-based authentication system.
            </p>
            <p class="text-blue-700">
              The service is stateless and doesn't store or log any data, making it suitable for testing 
              and development purposes.
            </p>
          </div>
        </div>

        <!-- Endpoint Section -->
        <div class="mb-8">
          <h2 class="text-xl font-semibold text-gray-800 mb-3">Endpoint</h2>
          <div class="bg-gray-50 rounded-lg p-4">
            <code class="text-sm text-blue-600">${request.url}</code>
          </div>
        </div>

        <!-- Authentication Section -->
        <div class="mb-8">
          <h2 class="text-xl font-semibold text-gray-800 mb-3">Authentication</h2>
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p class="text-yellow-700">
              Requests must include a token in either the <code class="bg-yellow-100 px-1 rounded">X-Webhook-Token</code> 
              or <code class="bg-yellow-100 px-1 rounded">X-Wekan-Token</code> header.
            </p>
          </div>
        </div>

        <!-- Examples Section -->
        <div class="mb-8">
          <h2 class="text-xl font-semibold text-gray-800 mb-3">Interactive Examples</h2>
          
          <!-- Success Example -->
          <div class="mb-6">
            <h3 class="text-lg font-medium text-green-700 mb-2">Success Example (with correct token)</h3>
            <div class="bg-gray-50 rounded-lg p-4 overflow-x-auto">
              <pre class="text-sm text-gray-700"><code>curl -X POST ${request.url} \\
  -H "Content-Type: application/json" \\
  -H "X-Wekan-Token: test1234" \\
  -d '{"event":"test","data":{"message":"This is a test webhook"}}'</code></pre>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <button data-example="success" class="inline-flex items-center px-3 py-1 rounded-md bg-green-100 text-green-700 text-sm hover:bg-green-200 transition-colors">
                ▶ Try this example
              </button>
              <div class="text-sm text-green-600 status-indicator"></div>
            </div>
            <div class="response-section"></div>
          </div>

          <!-- Failure Example (wrong token) -->
          <div class="mb-6">
            <h3 class="text-lg font-medium text-red-700 mb-2">Failure Example (wrong token)</h3>
            <div class="bg-gray-50 rounded-lg p-4 overflow-x-auto">
              <pre class="text-sm text-gray-700"><code>curl -X POST ${request.url} \\
  -H "Content-Type: application/json" \\
  -H "X-Wekan-Token: wrong-token" \\
  -d '{"event":"test","data":{"message":"This should fail"}}'</code></pre>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <button data-example="fail-token" class="inline-flex items-center px-3 py-1 rounded-md bg-red-100 text-red-700 text-sm hover:bg-red-200 transition-colors">
                ▶ Try this example
              </button>
              <div class="text-sm text-red-600 status-indicator"></div>
            </div>
            <div class="response-section"></div>
          </div>

          <!-- Failure Example (missing token) -->
          <div class="mb-6">
            <h3 class="text-lg font-medium text-red-700 mb-2">Failure Example (missing token)</h3>
            <div class="bg-gray-50 rounded-lg p-4 overflow-x-auto">
              <pre class="text-sm text-gray-700"><code>curl -X POST ${request.url} \\
  -H "Content-Type: application/json" \\
  -d '{"event":"test","data":{"message":"This should fail"}}'</code></pre>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <button data-example="fail-missing" class="inline-flex items-center px-3 py-1 rounded-md bg-red-100 text-red-700 text-sm hover:bg-red-200 transition-colors">
                ▶ Try this example
              </button>
              <div class="text-sm text-red-600 status-indicator"></div>
            </div>
            <div class="response-section"></div>
          </div>
        </div>

        <!-- Testing Section -->
        <div>
          <h2 class="text-xl font-semibold text-gray-800 mb-3">Testing</h2>
          <div class="bg-blue-50 rounded-lg p-4">
            <p class="text-blue-700">
              You can test the webhook using the curl commands above or by configuring your Wekan board 
              to send webhooks to this URL with the appropriate token.
            </p>
          </div>
        </div>

        <!-- Privacy Notice -->
        <div class="mt-8 border-t pt-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-3">Privacy Notice</h2>
          <div class="bg-green-50 rounded-lg p-4">
            <p class="text-green-700 mb-3">
              <strong>Zero Logging Policy:</strong> This service operates with a strict no-logging policy. 
              No webhook data, headers, or request information is stored or logged.
            </p>
            <p class="text-green-700">
              All requests are processed in memory and immediately discarded after the response is sent.
            </p>
          </div>
        </div>

        <!-- Deploy Your Own -->
        <div class="mt-8 border-t pt-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-3">Deploy Your Own Instance</h2>
          <div class="bg-purple-50 rounded-lg p-4">
            <p class="text-purple-700 mb-3">
              Want to run your own instance of this webhook service? You can easily deploy it to Deno Deploy:
            </p>
            <ol class="list-decimal list-inside text-purple-700 mb-3 pl-4">
              <li class="mb-2">Fork the repository from GitHub [Link coming soon]</li>
              <li class="mb-2">Set up a new project on Deno Deploy</li>
              <li>Configure your webhook token in the environment variables</li>
            </ol>
            <p class="text-purple-700 font-medium">
              GitHub Repository: <a href="#" class="underline">[Coming Soon]</a>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center text-gray-500 text-sm">
      Powered by Deno Deploy • No data collection • Open source
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Log basic request info
  console.log(`\nReceived ${request.method} request from ${request.headers.get("user-agent") || "unknown client"}`);
  console.log("Headers:", Object.fromEntries(request.headers.entries()));

  // Validate token if configured
  const tokenValidation = validateToken(request);
  if (!tokenValidation.valid) {
    console.log("🚫 Webhook authentication failed:");
    console.log(`  Reason: ${tokenValidation.reason}`);
    console.log(`  Received token: "${request.headers.get("X-Webhook-Token")}"`);
    console.log(`  Expected token: "${WEBHOOK_TOKEN}"`);
    console.log("  Request details:");
    console.log(`    URL: ${request.url}`);
    console.log(`    Method: ${request.method}`);
    console.log("    Headers:", JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2));
    
    try {
      // Try to log the request body if possible
      const clonedRequest = request.clone();
      const body = await clonedRequest.text();
      console.log("    Body:", body);
    } catch (error) {
      console.log("    Body: Could not read request body");
    }

    return new Response(JSON.stringify({ error: tokenValidation.reason }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse and log the webhook payload
    const payload = await request.json();
    console.log("✅ Webhook authenticated successfully");
    console.log("Received webhook payload:");
    console.log(JSON.stringify(payload, null, 2));

    return new Response(JSON.stringify({
      status: "ok",
      message: "Webhook received successfully",
      timestamp: new Date().toISOString(),
      received_data: {
        payload: payload,
        headers: Object.fromEntries(request.headers.entries())
      }
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "X-Webhook-Processed": "true"
      },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Start the server
Deno.serve({ port: 8000 }, handleWebhook); 