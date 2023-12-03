const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '.env') });
const express = require('express');
const bodyParser = require('body-parser');

const {
  populateCustomerData,
  getRmNames,
  searchData,
  addData,
  populateSchema,
  downloadData
} = require("./customerService.js")

const app = express();
const port = 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

let customerData
let rmNames
let columnNames
let schemaData
let searchResult

// Loading the home page
app.get('/', async (req, res) => {
  try {
    customerData = await populateCustomerData();
    schemaData = await populateSchema();
    rmNames = getRmNames(customerData);
    columnNames = Object.keys(customerData[0]);
    res.render('index', { customerData: customerData, rmNames: rmNames, columnNames: columnNames });
    // res.sendFile(path.join(__dirname, 'views', 'index.html'));
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Loading the search results
app.post('/search', async (req, res) => {
  const selectedColumns = Object.keys(req.body).filter(item => columnNames.includes(item));
  const selectedRMs = Object.keys(req.body).filter(item => rmNames.has(item));

  searchResult = await searchData(selectedColumns, selectedRMs);
  
  res.render('index', { customerData: customerData, rmNames: rmNames, columnNames: columnNames, searchResult: searchResult, searchHeaders: Object.keys(searchResult[0]) });
});

app.post('/download', async (req, res) => {  
  file = await downloadData(searchResult);
  res.render('index', { customerData: customerData, rmNames: rmNames, columnNames: columnNames, searchResult: searchResult, searchHeaders: Object.keys(searchResult[0]) });
});

// Loading the add new client page
app.get('/add', async (req, res) => {
  res.render('addClient', {columnNames: columnNames, schemaData: schemaData});
});

app.post('/add', async (req, res) => {
  addData(req.body)
  res.redirect('/');
});


app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
  console.log("Credentials file ", process.env.GOOGLE_APPLICATION_CREDENTIALS)
  console.log("Google Sheet ID ", process.env.GOOGLE_SHEET_ID)
});

