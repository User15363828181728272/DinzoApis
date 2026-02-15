const axios = require('axios');
const FormData = require('form-data');

module.exports = function(app) {
    async function unblurVisualParadigm(fileBuffer, fileName) {
        const API_URL = "https://ai-services.visual-paradigm.com/api/deblur/file";
        try {
            const form = new FormData();
            form.append('file', fileBuffer, {
                filename: fileName || 'image.jpg',
                contentType: 'image/jpeg'
            });

            const res = await axios.post(API_URL, form, {
                headers: {
                    ...form.getHeaders(),
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko)',
                    'Referer': 'https://online.visual-paradigm.com/'
                },
                responseType: 'arraybuffer'
            });

            return { status: true, data: res.data };
        } catch (err) {
            let errorMsg = err.message;
            if (err.response && err.response.data) {
                errorMsg = Buffer.from(err.response.data).toString();
            }
            return { status: false, error: errorMsg };
        }
    }

    app.get('/ai/unblur', async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });

        try {
            const imageRes = await axios.get(url, { responseType: 'arraybuffer' });
            const result = await unblurVisualParadigm(imageRes.data, 'downloaded.jpg');

            if (result.status) {
                res.set('Content-Type', 'image/jpeg');
                res.send(result.data);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            res.status(500).json({ status: false, error: "Gagal mengambil atau memproses gambar dari URL" });
        }
    });
};
