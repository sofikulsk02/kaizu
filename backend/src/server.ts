import app, { initializeApp } from "./app";
import { port } from "./config";
initializeApp()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize the application:", err);
    process.exit(1);
  });
