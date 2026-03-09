// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
// This returns a simple JSON message when route is not found.
function notFound(req, res) {
  return res.status(404).json({ message: "Endpoint not found." });
}

// I use one error handler here so I don't repeat try/catch everywhere.
function errorHandler(error, req, res, next) {
  // If no status was set before, use 500.
  const statusCode = res.statusCode && res.statusCode >= 400 ? res.statusCode : 500;
  const response = { message: error.message || "Internal server error." };

  // Stack trace should only show in development.
  if (process.env.NODE_ENV !== "production") {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
}

module.exports = { notFound, errorHandler };

