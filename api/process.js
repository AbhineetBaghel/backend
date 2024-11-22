import express from 'express';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Function to check if a number is prime
const isPrime = (num) => {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
};

// GET endpoint
app.get('/api/process', (req, res) => {
    res.json({ message: 'Send a POST request with your data to process information' });
});

// POST endpoint
app.post('/api/process', upload.single('file'), async (req, res) => {
    try {
        const inputData = req.body;
        
        // Validate input
        if (!inputData || !inputData.input_string) {
            return res.status(400).json({
                status: "error",
                message: "Input string is required"
            });
        }

        // Extract numbers and alphabets from input string
        const numbers = inputData.input_string.match(/\d+/g)?.map(Number) || [];
        const alphabets = inputData.input_string.match(/[a-zA-Z]/g) || [];
        
        // Find highest lowercase alphabet
        const lowercaseAlphabets = alphabets.filter(char => char >= 'a' && char <= 'z');
        const highestLowercase = lowercaseAlphabets.length > 0 ? 
            [Math.max(...lowercaseAlphabets.map(char => char.charCodeAt(0)))
                .toString(36)] : [];

        // Check for prime numbers
        const hasPrime = numbers.some(isPrime);

        // Process file information
        let fileInfo = {
            is_valid: false,
            mime_type: null,
            size_kb: null
        };

        if (req.file) {
            const fileTypeResult = await fileTypeFromBuffer(req.file.buffer);
            fileInfo = {
                is_valid: true,
                mime_type: fileTypeResult ? fileTypeResult.mime : 'application/octet-stream',
                size_kb: (req.file.size / 1024).toFixed(2)
            };
        }

        // Prepare response
        const response = {
            status: "success",
            user_id: inputData.user_id || null,
            college_email: inputData.college_email || null,
            college_roll_number: inputData.college_roll_number || null,
            numbers_array: numbers,
            alphabets_array: alphabets,
            highest_alphabet_array: highestLowercase,
            is_prime_available: hasPrime,
            file: fileInfo
        };

        res.json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: "error",
        message: "Internal server error"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});