const fs = require('fs');
const csv = require('csv-parser');

const csvFilePath = 'LoincTableCore.csv';  // Replace with the path to your CSV file
const markdownFilePath = 'LoincTableCore.md';

const records = [];

// Reading and parsing the CSV file
fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    records.push(row);
  })
  .on('end', () => {
    // File reading is done, now generate markdown
    generateMarkdown(records);
  });

function generateMarkdown(data) {
  let markdownContent = "The following table lists the LOINC codes and their corresponding names and descriptions.\n\n";

  data.forEach(record => {
    markdownContent += `* ${record.LOINC_NUM}: ${record.COMPONENT} - ${record.LONG_COMMON_NAME}\n`;

    // if (record.SHORTNAME === '') {
    //   markdownContent += `* ${record.LOINC_NUM}: ${record.COMPONENT} - ${record.LONG_COMMON_NAME}\n`;
    // } else {
    //   markdownContent += `* ${record.LOINC_NUM}: ${record.COMPONENT} (${record.SHORTNAME})\n`;
    // }
    // markdownContent += `  ${record.LONG_COMMON_NAME}\n\n`;

  });

  // Writing to markdown file
  fs.writeFile(markdownFilePath, markdownContent, err => {
    if (err) {
      console.error('Error writing to markdown file:', err);
      return;
    }
    console.log('Markdown file generated successfully.');
  });
}
