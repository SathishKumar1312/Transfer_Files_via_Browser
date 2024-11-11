const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");

const app = express();
const PORT = 5000;

app.use(express.static(path.join(__dirname,"./Public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname,"./views/index.html"));
});

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Upload folder where files will be stored
  },

  filename: (req, file, cb) => {
    cb(null, file.originalname); // Save with unique name
  },
});

// Initialize multer with the defined storage settings
const upload = multer({ storage });

let upfilename = "";

app.post("/upload", upload.single("file"), (req, res) => {
  try {
    upfilename = req.file.originalname;
    res.sendFile(path.join(__dirname,"./views/uploadPage.html"))
  } catch (error) {
    res.status(500).send({ message: "File upload failed", error });
  }
});

app.get("/uploadedFile", (req, res) => {
  res.sendFile(path.join(__dirname,"uploads",upfilename));
});


const folderPath = path.join(__dirname, "./toMobile"); // Replace with your folder path

app.get("/data", (req, res) => {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Unable to read folder:", err);
      return res.status(500).send("Error reading folder");
    }

    // Filter only files (if you need to exclude directories)
    const fileNames = files.filter((file) => {
      const filePath = path.join(folderPath, file);
      return fs.statSync(filePath).isFile();
    });

    if (fileNames.length == 0) {
      return res.json({ message: "OOPS!! There is no file as of now. Copy to the 'toMobile' folder if you want to transfer something!" });
    }

    res.json({fileNames});
  });
});

app.get("/files", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/files.html"));
});

app.get("/files/:id", (req, res) => {
  let id = req.params.id;
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Unable to read folder:", err);
      return res.status(500).send("Error reading folder");
    }

    // Filter only files (if you need to exclude directories)
    const fileNames = files.filter((file) => {
      const filePath = path.join(folderPath, file);
      return fs.statSync(filePath).isFile();
    });
    if (id) {
      return res.sendFile(path.join(__dirname,"./toMobile",fileNames[id]));
    }
    res.sendFile(path.join(__dirname, "./views/files.html"));
  });
});

function getWifiIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    // Check if the interface name includes "Wi-Fi" or "wlan0" (for Linux)
    if (
      interfaceName.toLowerCase().includes("wi-fi") ||
      interfaceName === "wlan0"
    ) {
      const interfaceInfo = interfaces[interfaceName];
      for (const alias of interfaceInfo) {
        // Check if it's an IPv4 address and not internal
        if (alias.family === "IPv4" && !alias.internal) {
          return alias.address;
        }
      }
    }
  }
  return null;
}

const wifiIPAddress = getWifiIPAddress();
console.log("Your Wireless LAN (Wi-Fi) IPv4 Address:", wifiIPAddress);

const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false }));

const route = express.Router();
app.use("/v1", route);


//CHANGE X, Y AND Z
const transporter = nodemailer.createTransport({
  port: 465, // true for 465, false for other ports
  host: "smtp.gmail.com", //gmail host
  auth: {
    user: "XXXXXXXXXXXX", // user GMAIL ID
    pass: "YYYYYYYYYYYY", // APP PASSWORD -CREATE in your GOOGLE ACCOUNT
  },
  secure: true,
});

const mailData = {
  from: "XXXXXXXXXXXX", // sender address
  to: "['ZZZZZZZZZZ','ZZZZZZZZZZ']", // list of receivers
  subject: "File Transfer",
  text: `<h1>GO TO <br><br> <a href="http://${wifiIPAddress}:5000/" target="_blank">fileTransfer Website</a></h1>`,
  html: `<h1>GO TO <br><br> <a href="http://${wifiIPAddress}:5000/" target="_blank">fileTransfer Website</a></h1>`,
};

transporter.sendMail(mailData, function (err, info) {
    if(err)
      console.log(err)
    else
      console.log("Message sent from '"+info.envelope.from+"' to '"+info.envelope.to[0]+"' is SUCCESSFUL\nMessage-ID : " + info.messageId);
 });

app.all('*',(req,res) =>{
  res.sendFile(path.join(__dirname,"./views/notFound.html"))
})
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
