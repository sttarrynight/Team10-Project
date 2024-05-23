const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path'); 
const csvParser = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'project')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'project', 'practice.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'project', 'login2.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'project', 'login.html'));
});

const readCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

const writeCSV = (filePath, data) => {
    const headers = Object.keys(data[0]).map(key => ({ id: key, title: key }));
    const csvWriter = createCsvWriter({
        path: filePath,
        header: headers
    });

    return csvWriter.writeRecords(data);
};

app.post('/signup', async (req, res) => {
    const { username, password, email, role, phone } = req.body;
    const filePath = role === 'guest' ? 'guest.csv' : 'manager.csv';

    try {
        const data = await readCSV(filePath);
        data.push({ username, password, email, phone });
        await writeCSV(filePath, data);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false });
    }
});

app.post('/login', async (req, res) => {
    const { username, password, role } = req.body;
    const filePath = role === 'guest' ? 'guest.csv' : 'manager.csv';

    try {
        const data = await readCSV(filePath);
        const user = data.find(user => user.username === username && user.password === password);

        if (user) {
            res.json({ success: true, role });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
