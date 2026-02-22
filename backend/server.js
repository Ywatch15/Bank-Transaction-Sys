require("dotenv").config();

const app = require("./src/app");
const connectToDB = require("./src/config/db");

const startServer = async () => {
  try {
    await connectToDB();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

startServer();