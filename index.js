const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Map subdomains to Railway URLs (just a sample; replace with your actual mapping logic)
const projectMap = {
  customer1: 'https://pin-portfolio-production-0b79.up.railway.app',
  customer2: 'https://scube-production.up.railway.app',
};

// Middleware to handle subdomain routing
app.use((req, res, next) => {
  const host = req.headers.host; // Get the full host (e.g., customer1.app.contentql.io)
  const subdomain = host.split('.')[0]; // Extract subdomain (e.g., customer1)

  if (subdomain !== 'app') {
    // Redirect all non-"app" subdomains to app.contentql.io
    return res.redirect(`https://app.contentql.io`);
  }

  // If subdomain is "app", serve the main page for app.contentql.io
  next();
});

// Handle requests for the "app.contentql.io" subdomain
app.get('/', (req, res) => {
  // Redirect users to their appropriate subdomain (e.g., customer1.app.contentql.io)
  // You can customize this behavior based on user authentication or other logic
  const userSubdomain = 'customer1'; // Placeholder logic, replace with actual logic
  res.redirect(`https://${userSubdomain}.app.contentql.io`);
});

// Middleware to handle subdomain-specific proxying
app.use((req, res, next) => {
  const host = req.headers.host; // Get the full host (e.g., customer1.app.contentql.io)
  const subdomain = host.split('.')[0]; // Extract subdomain (e.g., customer1)

  if (projectMap[subdomain]) {
    // Dynamically proxy requests to the corresponding Railway URL
    const proxy = createProxyMiddleware({
      target: projectMap[subdomain], // The target Railway project URL
      changeOrigin: true, // Update the Host header to the target
      xfwd: true, // Forward client IP and headers
      onProxyReq: (proxyReq) => {
        console.log(
          `Proxying request from ${host} to: ${projectMap[subdomain]}`,
        );
      },
    });
    return proxy(req, res, next);
  }

  // If subdomain doesn't match, return 404
  res.status(404).send('Subdomain not found.');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Reverse proxy server running on http://localhost:${PORT}`);
});
