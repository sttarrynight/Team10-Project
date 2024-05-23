const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.get("/", (req, res) => res.sendFile(__dirname + "/public/cafe.html"));

//파일 업로드 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = 'uploads/';
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath);
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage: storage });

  app.use(express.static('public'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // 폼 데이터 처리 및 저장
  app.post('/submit', upload.single('cafe-image'), (req, res) => {
    const {
      'cafe-id': cafeId,
      'cafe-name': cafeName,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
      iceAmericano,
      coldBrew,
      latte,
      additional1,
      additional2,
      dessert1,
      dessert2,
      outlets,
      atmosphere
    } = req.body;
    
    const cafeImage = req.file ? req.file.filename : null;
    const atmosphereStr = Array.isArray(atmosphere) ? atmosphere.join(', ') : atmosphere;
  
    const cafeData = {
      cafeId,
      cafeName,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
      iceAmericano,
      coldBrew,
      latte,
      additional1,
      additional2,
      dessert1,
      dessert2,
      outlets,
      atmosphere: atmosphereStr,
      cafeImage
    };
  
    const dataPath = path.join(__dirname, 'data');
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath);
    }
  
    const fileName = `${Date.now()}.json`;
    fs.writeFile(path.join(dataPath, fileName), JSON.stringify(cafeData, null, 2), (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: '데이터 저장에 실패하였습니다.' });
        return;
      }
  
      res.status(200).json({ message: '카페 정보가 성공적으로 저장되었습니다.' });
    });
  });

  // 데이터 조회 엔드포인트
app.get('/data', (req, res) => {
    const dataPath = path.join(__dirname, 'data');
    fs.readdir(dataPath, (err, files) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: '데이터 디렉토리를 불러오는데 실패하였습니다.' });
        return;
      }
  
      const data = files.map(file => {
        const filePath = path.join(dataPath, file);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContents);
      });
  
      res.status(200).json(data);
    });
  });

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});