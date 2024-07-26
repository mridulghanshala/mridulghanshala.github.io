const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const inputFolder = './docs'; // Assuming the CSV files are in the same directory as this script
const outputFile = 'combined_rankings.csv';

const csvFiles = [];
for (let year = 2011; year <= 2024; year++) {
    csvFiles.push(`${year}_rankings.csv`);
}

const readCsvFile = (file) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(file)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
};

const writeCsvFile = (data) => {
    const csvWriter = createCsvWriter({
        path: outputFile,
        header: Object.keys(data[0]).map(key => ({ id: key, title: key }))
    });

    return csvWriter.writeRecords(data);
};

const processFiles = async () => {
    try {
        const combinedResults = [];
        
        for (const file of csvFiles) {
            const results = await readCsvFile(path.join(inputFolder, file));

            // Convert rank to number and sort by rank
            results.forEach(result => result.rank = Number(result.rank));
            results.sort((a, b) => a.rank - b.rank);

            // Grab only the top 75 entries
            const top75 = results.slice(0, 75);
            combinedResults.push(...top75);
        }

        await writeCsvFile(combinedResults);
        console.log(`Combined, sorted, and filtered CSV file created at ${outputFile}`);
    } catch (error) {
        console.error('Error processing files:', error);
    }
};

processFiles();
