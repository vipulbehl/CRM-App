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
  getDayPeriod,
  findPan,
  deleteData
} = require("./customerService.js");
const { error } = require('console');

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
  try {
    config = await populateConfig();

    if (config === undefined || config === null) {
      res.render('login');
    } else {
      res.redirect('/home');
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error ' + error.message);
  }
  
});

// Loading the home page
app.get('/home', async (req, res) => {
  try {
    schemaData = await populateSchema();
    rmNames = getRmNames(schemaData);
    columnNames = Object.keys(schemaData);
    res.render('home', { rmNames: rmNames, columnNames: columnNames, config: config, dayPeriod: getDayPeriod(), schemaData: schemaData });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error ' + error.message);
  }
});

// Loading the search results
app.post('/search', async (req, res) => {
  try {
    searchResult = await searchData(
      req.body["selectedColumns"], 
      req.body["selectedRms"], 
      req.body["nameList"], 
      req.body["panList"],
      req.body["isIncludeFamily"], 
      req.body["isOnlyHeadInfo"],
      req.body["filters"]
      );
  
    res.json({ success: true, result: searchResult["result"], fullResult: searchResult["fullResult"], schema: schemaData });
  } catch (error) {
    res.status(500).send('Internal Server Error ' + error.message);
  }
});

app.get('/download', async (req, res) => {  
  try {
    file = await downloadData(searchResult);
    res.json({success: true});
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error ' + error.message);
  }
});

app.post('/update', async (req, res) => {
  try {
    await updateData(req.body, schemaData)
    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error ' + error.message);
  }
});

app.post('/login', async (req, res) => {
  try {
    config = req.body;
    config["selectedRms"] = [];
    config["selectedColumns"] = [];
    writeConfigToDisk(JSON.stringify(config));
    res.redirect('/home')
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error ' + error.message);
  }
});

app.post('/writeConfig', async (req, res) => {
  try {
    config = req.body;
    writeConfigToDisk(JSON.stringify(config));
    res.json({ success: true});
  } catch(error) {
    console.error("Unable to write config file to disk" + error.message);
    res.json({ success: false});
  }
});

app.get('/add', async (req, res) => {
  try {
    res.render('add', {columnNames: columnNames, schemaData: schemaData});
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error ' + error.message);
  }
});

app.post('/add', async (req, res) => {
  try {
    addData(req.body)
    res.json({success: true});
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error ' + error.message);
  }
});

app.get('/headSearch', async (req, res) => {
  try {
    schemaData = await populateSchema();
    rmNames = getRmNames(schemaData);
    columnNames = Object.keys(schemaData);
    res.render('headSearch', { rmNames: rmNames, columnNames: columnNames, config: config, dayPeriod: getDayPeriod() });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/searchPan', async (req, res) => {
  result = await findPan(req.body["pan"]);
  if (result === undefined || result === null || result.trim() === "") {
    res.status(400).send(error.message);
  } else {
    res.json({ success: true});
  }
});

app.delete('/delete/:rowId', async (req, res) => {
  let rowId = req.params.rowId;
  try {
    await deleteData(rowId, Object.keys(schemaData).length)
    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error ' + error.message);
  }
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
  console.log("Credentials file ", process.env.GOOGLE_APPLICATION_CREDENTIALS)
});