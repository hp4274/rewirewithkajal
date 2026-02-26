const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testUpload() {
    try {
        const formData = new FormData();
        // we'll just use package.json as a fake image to trigger the file filter or upload error
        formData.append('image', fs.createReadStream(path.join(__dirname, 'package.json')));

        // We need a token since it's protected
        // To bypass token for this test or get a real one, let's just send the request
        // and see if auth fails first
        console.log('Sending request...');
        const res = await axios.post('http://localhost:5000/api/blogs/upload', formData, {
            headers: {
                ...formData.getHeaders(),
                // mock token if needed or we'll get 401
            }
        });
        console.log('Success:', res.data);
    } catch (err) {
        console.error('Error status:', err.response?.status);
        console.error('Error data:', err.response?.data);
    }
}

testUpload();
