import express from "express";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import routes from "./routes/index.js";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use("/api", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };
