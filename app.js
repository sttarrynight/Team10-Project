const express = require('express');
const cors = require('cors'); 
//const fs = require('fs');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const csvParser = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
app.use(express.static('uploads'));

//첨부파일 저장공간 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.get("/", (req, res) => res.sendFile(__dirname + "/public/cafe.html"));

// csv 파일 불러오기
const FILE_NAME = "content.csv";
const csvPath = path.join(__dirname, FILE_NAME);

const removeBomBuffer = require('remove-bom-buffer');

let buffer = fs.readFileSync(csvPath);
let csv = removeBomBuffer(buffer).toString('utf-8');
// console.log('CSV content:', csv);

const rows = csv.split(/\r?\n/).filter(row => row.trim() !== '');
//console.log('Filtered CSV rows:', rows);

let results = []
let columnTitle = []

if (rows.length > 0) {
    columnTitle = rows[0].split(",");
    //console.log('Column titles:', columnTitle);
}

for (let i = 1; i < rows.length; i++) {
    const data = rows[i].split(",");
    let row_data = {};
    columnTitle.forEach((title, index) => {
        row_data[title] = data[index] ? data[index].trim() : '';
    });
    results.push(row_data);
    //console.log(`Parsed row ${i}:`, row_data);
}

// 불러온 파일 데이터 포맷 변경
const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일'];

const cleanseTime = (timeStr) => {
    if (timeStr === '휴무') return '휴무';
    const [openTime, closeTime] = timeStr.split('-').map(time => time.trim());
    return `${openTime}-${closeTime}`;
};

const parseMenu = (menuStr) => {
    const [name, priceStr] = menuStr.split('/').map(str => str.trim());
    const price = parseInt(priceStr, 10);
    return { name, price }
};

let cafes = results.map((cafe, index) => {
    let operatingHours = {};
    daysOfWeek.forEach(day => {
        operatingHours[day] = cafe[day];
    });

    return {
        id: `cafe${index + 1}`,
        name: cafe['이름'],
        outlets: cafe['콘센트'],
        operatingHours: operatingHours,
        studyFriendly: parseInt(cafe['공부하기좋은']),
        americanoPrice: parseInt(cafe['아메리카노']),
        lattePrice: parseInt(cafe['카페라떼']),
        atmosphere: {
            dark: parseInt(cafe['어두운']),
            sensitive: parseInt(cafe['감성있는']),
            dessert: parseInt(cafe['디저트 위주의']),
            franchise: parseInt(cafe['프랜차이즈']),
            forest: parseInt(cafe['경춘선숲길뷰'])
        },
        additionalMenu1: parseMenu(cafe['추가메뉴1']),
        additionalMenu2: parseMenu(cafe['추가메뉴2']),
        dessert1: parseMenu(cafe['디저트1']),
        dessert2: parseMenu(cafe['디저트2']),
        image: cafe['이미지경로']
    };
});
fs.writeFileSync(path.join(__dirname, 'cafes.json'), JSON.stringify(cafes, null, 2), 'utf-8');
//console.log('Transformed cafes data:', cafes);

// 요일 변환
const getDay = (date) => {
    const day = date.getDay();  // 일=0 ~ 토=5 형태
    return daysOfWeek[(day + 6) % 7];
};

// 시간 비교 - 현재, 오픈, 마감 시간을 시간, 분 형태로 따로 받고 모두 분 형태로 바꿔서 비교하도록!
const isOperatingHours = (currentTime, openTime, closeTime) => {
    const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
    const [openHours, openMinutes] = openTime.split(':').map(Number);
    const [closeHours, closeMinutes] = closeTime.split(':').map(Number);

    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    const openTotalMinutes = openHours * 60 + openMinutes;
    const closeTotalMinutes = closeHours * 60 + closeMinutes;

    return currentTotalMinutes >= openTotalMinutes && currentTotalMinutes <= closeTotalMinutes;
};

// 카페 목록 조회
app.get('/api/cafes', (req, res) => {
    const filterType = req.query.filter;
    const filterValue = req.query.value || '';
    let filteredCafes = cafes;

    if (filterType) {
        const currentDate = new Date();
        const currentDay = getDay(currentDate);
        const currentTime = currentDate.toTimeString().slice(0, 5)

        console.log(currentDay, currentTime)

        // 버튼 필터
        if (filterType === 'fewOutlets') {
            filteredCafes = cafes.filter(cafe => cafe.outlets === '적음');
            console.log('Filtered cafes (fewOutlets):', filteredCafes);
        } else if (filterType === 'manyOutlets') {
            filteredCafes = cafes.filter(cafe => cafe.outlets === '많음');
            console.log('Filtered cafes (manyOutlets):', filteredCafes);
        } else if (filterType === 'open') {
            filteredCafes = cafes.filter(cafe => {
                const hours = cafe.operatingHours[currentDay];
                if (!hours || hours === '휴무') return false;
                const [openTime, closeTime] = hours.split('-');
                return isOperatingHours(currentTime, openTime, closeTime);
            });
        } else if (filterType === 'studyFriendly') {
            filteredCafes = filteredCafes.filter(cafe => cafe.studyFriendly === 0);
        }
    }
    res.json(filteredCafes);
});

// 검색
app.get('/api/search', (req, res) => {
    const query = req.query.q.toLowerCase();
    const filteredCafes = cafes.filter(cafe => {
        const menuItems = [
            cafe.additionalMenu1,
            cafe.additionalMenu2,
            cafe.dessert1,
            cafe.dessert2
        ].filter(item => item.name.toLowerCase().includes(query));
        return menuItems.length > 0;
    }).map(cafe => {
        return {
            ...cafe,
            matchedMenus: [
                cafe.additionalMenu1,
                cafe.additionalMenu2,
                cafe.dessert1,
                cafe.dessert2
            ].filter(item => item.name.toLowerCase().includes(query))
        };
    });
    res.json(filteredCafes);
});

// 리뷰
const reviewsPath = path.join(__dirname, 'reviews.json');
let reviews = [];
if (fs.existsSync(reviewsPath)) {
    reviews = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));
} else {
    fs.writeFileSync(reviewsPath, JSON.stringify([]));
}

app.post('/api/reviews', (req, res) => {
    try {
        const newReview = {
            id: Date.now().toString(),
            cafeId: req.body.cafeId.toLowerCase(),
            nickname: req.body.nickname,
            password: req.body.password,
            content: req.body.content,
            rating: req.body.rating
        };
        reviews.push(newReview);
        fs.writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2));
        res.status(201).json(newReview);
    } catch (error) {
        console.error('Error writing review:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/reviews/:cafeId', (req, res) => {
    const cafeId = req.params.cafeId.toLowerCase();
    const cafeReviews = reviews.filter(review => review.cafeId.toLowerCase() === cafeId);
    res.json(cafeReviews);
});

app.delete('/api/reviews/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        const reviewIndex = reviews.findIndex(review => review.id === id);
        if (reviewIndex === -1) {
            return res.status(404).json({ error: 'Review not found' });
        }
        if (reviews[reviewIndex].password !== password) {
            return res.status(403).json({ error: 'Invalid password' });
        }
        reviews.splice(reviewIndex, 1);
        fs.writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2));
        res.status(200).json({ message: 'Review deleted' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 사이드바 중복 필터링
app.post('/api/cafes/filters', (req, res) => {
    const { americanoPrice, lattePrice, atmosphere } = req.body;
    let filteredCafes = cafes;

    if (americanoPrice) {
        if (americanoPrice === 'low') {
            filteredCafes = filteredCafes.filter(cafe => cafe.americanoPrice <= 3000);
        } else if (americanoPrice === 'mid') {
            filteredCafes = filteredCafes.filter(cafe => cafe.americanoPrice > 3000 && cafe.americanoPrice < 4500);
        } else if (americanoPrice === 'high') {
            filteredCafes = filteredCafes.filter(cafe => cafe.americanoPrice >= 4500);
        }
    }

    if (lattePrice) {
        if (lattePrice === 'low') {
            filteredCafes = filteredCafes.filter(cafe => cafe.lattePrice <= 4000);
        } else if (lattePrice === 'mid') {
            filteredCafes = filteredCafes.filter(cafe => cafe.lattePrice > 4000 && cafe.lattePrice < 5500);
        } else if (lattePrice === 'high') {
            filteredCafes = filteredCafes.filter(cafe => cafe.lattePrice >= 5500);
        }
    }

    if (atmosphere) {
        filteredCafes = filteredCafes.filter(cafe => cafe.atmosphere[atmosphere] === 0);
    }
    res.json(filteredCafes);
});

//카페 정보 저장
app.post('/submit-save', upload.single('cafe-image'), (req, res) => {
    const formData = req.body;
    const file = req.file;
    const cafeLocation = formData['add-cafe-list'];
    const cafeId = parseInt(cafeLocation.replace('cafe', ''), 10);

    // 분위기 체크박스 값을 문자열로 변환
    const atmosphereValues = [
        '공부하기좋은',
        '어두운',
        '감성있는',
        '디저트 위주의',
        '프랜차이즈',
        '경춘선숲길뷰'
    ];

    const atmosphere = {};
    atmosphereValues.forEach(value => {
        atmosphere[value] = formData.atmosphere && formData.atmosphere.includes(value) ? 0 : null;
    });

    const imagePath = `uploads/${file.filename}`;

    const updatedRow = {
        'id': cafeId.toString(),
        '이름': formData['cafe-name'] || '',
        '월': formData['monday'] || '',
        '화': formData['tuesday'] || '',
        '수': formData['wednesday'] || '',
        '목': formData['thursday'] || '',
        '금': formData['friday'] || '',
        '토': formData['saturday'] || '',
        '일': formData['sunday'] || '',
        '콘센트': formData['outlets'] || '',
        '아메리카노': formData['Americano'] || '',
        '카페라떼': formData['cafelatte'] || '',
        '공부하기좋은': atmosphere['공부하기좋은'],
        '어두운': atmosphere['어두운'],
        '감성있는': atmosphere['감성있는'],
        '디저트 위주의': atmosphere['디저트 위주의'],
        '프랜차이즈': atmosphere['프랜차이즈'],
        '경춘선숲길뷰': atmosphere['경춘선숲길뷰'],
        '추가메뉴1': formData['additional1'] || '',
        '추가메뉴2': formData['additional2'] || '',
        '디저트1': formData['dessert1'] || '',
        '디저트2': formData['dessert2'] || '',
        '이미지경로': imagePath
    };

    lastSubmittedData = updatedRow;

    // 동기적으로 CSV 파일 읽기
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const [headerLine, ...lines] = fileContent.split('\n');

    const addrows = lines.map(line => {
        const columns = line.split(',');
        if (columns.length > 1) {
            return {
                'id': columns[0].trim(),
                '이름': columns[1].trim(),
                '월': columns[2].trim(),
                '화': columns[3].trim(),
                '수': columns[4].trim(),
                '목': columns[5].trim(),
                '금': columns[6].trim(),
                '토': columns[7].trim(),
                '일': columns[8].trim(),
                '콘센트': columns[9].trim(),
                '아메리카노': columns[10].trim(),
                '카페라떼': columns[11].trim(),
                '공부하기좋은': columns[12].trim() || null,
                '어두운': columns[13].trim() || null,
                '감성있는': columns[14].trim() || null,
                '디저트 위주의': columns[15].trim() || null,
                '프랜차이즈': columns[16].trim() || null,
                '경춘선숲길뷰': columns[17].trim() || null,
                '추가메뉴1': columns[18].trim() || '',
                '추가메뉴2': columns[19].trim() || '',
                '디저트1': columns[20].trim() || '',
                '디저트2': columns[21].trim() || '',
                '이미지경로': columns[22].trim() || ''
            };
        }
    }).filter(row => row !== undefined);

    const rowIndex = addrows.findIndex(row => row.id === cafeId.toString());
    addrows[rowIndex] = updatedRow;

    const csvWriterInstance = createCsvWriter({
        path: csvPath,
        header: headerLine.split(',').map(header => ({ id: header.trim(), title: header.trim() })),
        encoding: 'utf8'
    });

    csvWriterInstance.writeRecords(addrows)
        .then(() => {
            // BOM 추가를 위해 파일에 다시 쓰기
            const bom = '\ufeff';
            const csvData = fs.readFileSync(csvPath, 'utf8');
            fs.writeFileSync(csvPath, bom + csvData, 'utf8');
            res.send('성공적으로 저장되었습니다.');
        })
        .catch((error) => {
            console.error('Error writing to CSV:', error);
            res.status(500).send('CSV 파일 저장 중 오류 발생');
        });
});
//불러온 카페 정보 조회
app.get('/submit-save', (req, res) => {
    res.json(lastSubmittedData);
});

//카페 정보 삭제
app.post('/submit-delete', (req, res) => {
    const formData = req.body;
    const cafeLocation = formData['delete-cafe-list'];
    const cafeId = parseInt(cafeLocation.replace('cafe', ''), 10);

    // 동기적으로 CSV 파일 읽기
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const [headerLine, ...lines] = fileContent.split('\n');

    let addrows = lines.map(line => {
        const columns = line.split(',');
        if (columns.length > 1) {
            return {
                'id': columns[0].trim(),
                '이름': columns[1].trim(),
                '월': columns[2].trim(),
                '화': columns[3].trim(),
                '수': columns[4].trim(),
                '목': columns[5].trim(),
                '금': columns[6].trim(),
                '토': columns[7].trim(),
                '일': columns[8].trim(),
                '콘센트': columns[9].trim(),
                '아메리카노': columns[10].trim(),
                '카페라떼': columns[11].trim(),
                '공부하기좋은': columns[12].trim() || null,
                '어두운': columns[13].trim() || null,
                '감성있는': columns[14].trim() || null,
                '디저트 위주의': columns[15].trim() || null,
                '프랜차이즈': columns[16].trim() || null,
                '경춘선숲길뷰': columns[17].trim() || null,
                '추가메뉴1': columns[18].trim() || '',
                '추가메뉴2': columns[19].trim() || '',
                '디저트1': columns[20].trim() || '',
                '디저트2': columns[21].trim() || '',
                '이미지경로': columns[22].trim() || ''
            };
        }
    }).filter(row => row !== undefined);

    const rowIndex = addrows.findIndex(row => row.id === cafeId.toString());

    if (rowIndex !== -1) {
        // 이미지 경로가 있으면 이미지 파일 삭제
        const imagePath = addrows[rowIndex]['이미지경로'];
        if (imagePath) {
            fs.unlinkSync(path.join(__dirname, imagePath));
        }

        // 해당 행을 null로 설정
        addrows[rowIndex] = {
            'id': cafeId.toString(),
            '이름': '',
            '월': '',
            '화': '',
            '수': '',
            '목': '',
            '금': '',
            '토': '',
            '일': '',
            '콘센트': '',
            '아메리카노': '',
            '카페라떼': '',
            '공부하기좋은': null,
            '어두운': null,
            '감성있는': null,
            '디저트 위주의': null,
            '프랜차이즈': null,
            '경춘선숲길뷰': null,
            '추가메뉴1': '',
            '추가메뉴2': '',
            '디저트1': '',
            '디저트2': '',
            '이미지경로': ''
        };
    }

    const csvWriterInstance = createCsvWriter({
        path: csvPath,
        header: headerLine.split(',').map(header => ({ id: header.trim(), title: header.trim() })),
        encoding: 'utf8'
    });

    csvWriterInstance.writeRecords(addrows)
        .then(() => {
            // BOM 추가를 위해 파일에 다시 쓰기
            const bom = '\ufeff';
            const csvData = fs.readFileSync(csvPath, 'utf8');
            fs.writeFileSync(csvPath, bom + csvData, 'utf8');
            res.send('성공적으로 삭제되었습니다.');
        })
        .catch((error) => {
            console.error('Error writing to CSV:', error);
            res.status(500).send('CSV 파일 삭제 중 오류 발생');
        });
});

// 기본
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
