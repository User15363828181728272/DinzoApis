const express = require("express");
const chalk = require("chalk");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const fileUpload = require("express-fileupload");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

const TG_BOT_TOKEN = process.env.TG_TOKEN || "8513744057:AAFmmLVaWQJ8G-KkN1bjNaNlz2VtYTaFSxY";
const TG_CHAT_ID = process.env.TG_CHAT_ID || "8412273544";

async function sendTelegram(message) {
    try {
        await axios.post(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
            chat_id: TG_CHAT_ID,
            text: message,
            parse_mode: "Markdown"
        });
    } catch (err) {
        console.error(chalk.red(`[TelegramError] ${err.message}`));
    }
}

app.enable("trust proxy");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(fileUpload());
app.set("json spaces", 2);

app.use("/", express.static(path.join(__dirname, "api-page")));
app.use("/src", express.static(path.join(__dirname, "src")));

const openApiPath = path.join(__dirname, "src", "openapi.json");
let openApi = {};
if (fs.existsSync(openApiPath)) {
    openApi = JSON.parse(fs.readFileSync(openApiPath));
}

app.use((req, res, next) => {
    const original = res.json;
    res.json = function (data) {
        if (typeof data === "object") {
            data = {
                status: data.status ?? true,
                creator: "D2:业",
                ...data
            };
        }
        return original.call(this, data);
    };
    next();
});

const apiFolder = path.join(__dirname, "src", "api");
if (fs.existsSync(apiFolder)) {
    const categories = fs.readdirSync(apiFolder);
    categories.forEach((sub) => {
        const subPath = path.join(apiFolder, sub);
        if (fs.statSync(subPath).isDirectory()) {
            const files = fs.readdirSync(subPath);
            files.forEach((file) => {
                if (file.endsWith(".js")) {
                    const route = require(path.join(subPath, file));
                    if (typeof route === "function") route(app);
                    console.log(chalk.bgYellow.black(`Loaded: ${file}`));
                }
            });
        }
    });
}

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "api-page", "index.html")));
app.get("/docs", (req, res) => res.sendFile(path.join(__dirname, "api-page", "docs.html")));
app.get("/legal", (req, res) => res.sendFile(path.join(__dirname, "api-page", "legal.html")));
app.get("/openapi.json", (req, res) => res.sendFile(openApiPath));

app.use((err, req, res, next) => {
    sendTelegram(`🚨 *Server Error*\n${err.message}`);
    res.status(500).sendFile(path.join(__dirname, "api-page", "500.html"));
});

app.listen(PORT, () => {
    console.log(chalk.bgGreen.black(`Server running on port ${PORT}`));
    sendTelegram("🟢 *Server Dinzo Apis Started*");
});

module.exports = app;
