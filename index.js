const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '.env') });
const express = require('express');
const bodyParser = require('body-parser');
const {
  getRmNames,
  searchData,
  addData,
  populateSchema,
  downloadData,
  updateData,
  populateConfig,
  writeConfigToDisk,
  getDayPeriod
} = require("./customerService.js")

const app = express();
const port = 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

let rmNames
let columnNames
let schemaData
let searchResult
let config

// Loading the login page
app.get('/', async (req, res) => {
  config = await populateConfig();

  if (config === undefined || config === null) {
    res.render('login');
  } else {
    res.redirect('/home');
  }
});

// Loading the home page
app.get('/home', async (req, res) => {
  try {
    schemaData = await populateSchema();
    rmNames = getRmNames(schemaData);
    columnNames = Object.keys(schemaData);
    res.render('home', { rmNames: rmNames, columnNames: columnNames, config: config, dayPeriod: getDayPeriod() });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Loading the search results
app.post('/search', async (req, res) => {
  searchResult = await searchData(
    req.body["selectedColumns"], 
    req.body["selectedRms"], 
    req.body["nameList"], 
    req.body["panList"],
    req.body["isIncludeFamily"], 
    req.body["isOnlyHeadInfo"]
    );

  res.json({ success: true, result: searchResult["result"], fullResult: searchResult["fullResult"], schema: schemaData });
});

app.get('/download', async (req, res) => {  
  file = await downloadData(searchResult);
  res.json({success: true});
});

app.post('/update', async (req, res) => {
  await updateData(req.body, schemaData)

  res.json({ success: true });
});

app.post('/login', async (req, res) => {
  config = req.body;
  writeConfigToDisk(JSON.stringify(config));
  res.redirect('/home')
});

app.get('/add', async (req, res) => {
  res.render('add', {columnNames: columnNames, schemaData: schemaData});
});

app.post('/add', async (req, res) => {
  addData(req.body)
  res.json({success: true});
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
  console.log("Credentials file ", process.env.GOOGLE_APPLICATION_CREDENTIALS)
});