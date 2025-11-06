// middleware/errorMiddleware.js

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  // If some middleware already set status, use it; otherwise default to 500
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // If Mongoose validation or duplicate key
  if (err.name === "ValidationError") {
    res.status(400);
  } else if (err.code === 11000) {
    // duplicate key error
    res.status(400);
  }

  res.status(res.statusCode === 200 ? statusCode : res.statusCode);

  const message = err.message || "Server Error";
  // send JSON — frontend expects { message: "..."}
  res.json({
    message,
    // include stack in non-production for debugging
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
};
