require('dotenv').config()
const fs = require('fs').promises;

const {
    getAuthToken,
    getSpreadSheetValues,
    addSpreadSheetsValue,
    updateSpreadSheetValue
} = require('./googleSheetsService.js');

const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const sheetName = process.env.GOOGLE_SHEET_NAME;
const CONFIG_FIILE_PATH = "./config.json";

async function populateCustomerData() {
    try {
        const auth = await getAuthToken();
        const response = await getSpreadSheetValues({
            spreadsheetId,
            auth,
            sheetName,
        });

        const dataArray = response.data.values
        const headers = dataArray[0];
        const customerData = [];

        for (let i = 1; i < dataArray.length; i++) {
            const currentRow = dataArray[i];
            const currentObject = {};

            // Iterate through each header and add the corresponding value to the object
            headers.forEach((header, index) => {
                currentObject[header] = currentRow[index];
            });

            // Adding the row number in the object
            currentObject['id'] = i;

            // Add the object to the result array
            customerData.push(currentObject);
        }

        return customerData;
    } catch (error) {
        console.log(error.message, error.stack);
    }
}

async function populateSchema() {
    const schemaData = {};
    try {
        let sheetName = process.env.SCHEMA_SHEET_NAME;
        const auth = await getAuthToken();
        const response = await getSpreadSheetValues({
            spreadsheetId,
            auth,
            sheetName,
        });

        const schemaArray = response.data.values;
        
        schemaArray.forEach(entry => {
            schemaData[entry[0]] = [entry[1], entry[2]];
        });
    } catch (error) {
        console.log(error.message, error.stack);
    }

    return schemaData;
}

function getRmNames(schemaData) {
    const uniqueRmNames = new Set();
    let rmList = JSON.parse(schemaData["RM"][0])["values"];
    rmList.forEach(item => uniqueRmNames.add(item));
    return uniqueRmNames;
}

/**
 * Search based on Columns, Rms, Name, Pan, Head Pan
 * @param {*} selectedColumns 
 * @param {*} selectedRMs 
 * @returns [{"col1": "val"}]
 */
async function searchData(selectedColumns, selectedRMs, nameList, panList, isIncludeFamily=false, isOnlyHeadInfo=false) {
    let customerData = await populateCustomerData();
    let headMemberMapping = mapHeadAndMembers(customerData);
    
    // Condition to populate just the family details of the pan ids provided
    if (isIncludeFamily !== undefined && isIncludeFamily !== null && isIncludeFamily === true) {
        let headPanList = findHeadPan(panList, customerData);
        let updatedPanList = [];
        
        // Iterating over the headPan list and populating all the members and head pans inside the updatedPanList
        headPanList.forEach(head => {
            updatedPanList.push(head);
            let listOfMembers = headMemberMapping[head];
            updatedPanList.push(...listOfMembers);
        });

        panList = updatedPanList;
    }

    // Condition to populate only the ids of the head and discard other value (Select all RMs here) 
    if (isOnlyHeadInfo !== undefined && isOnlyHeadInfo !== null && isOnlyHeadInfo === true) {
        let headPanList = findHeadPan(panList, customerData);
        panList = headPanList;
    }

    const searchResult = {
        "result": [],
        "fullResult": []
    }
    
    for (let i = 0; i < customerData.length; i++) {
        const customer = customerData[i];
        
        if (isIncludeCustomer(selectedRMs, nameList, panList, customer)) {
            currentObj = {}
            selectedColumns.forEach(col => {
                let currentColValue = customer[col];
                currentObj[col] = currentColValue === undefined ? "" : currentColValue;
            });
            currentObj["id"] = i + 2;   // Setting the correct index of the row in the search result
            searchResult["result"].push(currentObj);
            searchResult["fullResult"].push(customer);
        }
    }

    return searchResult;
}

/**
 * Returns the list of Pan ids of the family head, given the pan id list
 * @param {*} panList 
 * @param {*} customerData 
 * @returns 
 */
function findHeadPan(panList, customerData) {
    let headPanList = [];

    if (panList === undefined || panList === null) {
        return headPanList;
    }

    let lowerCasePanList = panList.map(item => item.toLowerCase());

    customerData.forEach(customer => {
        let customerPan = customer["PAN"].toLowerCase();

        if (lowerCasePanList.includes(customerPan)) {
            let headPan = customer["Head"];
            if (headPan === undefined || headPan === null) {
                headPan = customerPan;
            }
            headPanList.push(headPan);
        }
    });

    return headPanList;
}

function isIncludeCustomer(rmList, nameList, panList, customer) {
    let rm = customer["RM"];
    let name = customer["Name"];
    let pan = customer["PAN"];

    // Checking if the customer belongs to the provided RM
    if (rmList !== undefined && rmList !== null) {
        if (!rmList.includes(rm)) {
            return false;
        }
    }

    // Checking if the customer belongs to the provided name
    if (nameList !== undefined && nameList !== null) {
        if (Array.isArray(nameList)) {
            // Checking if the name is present in the list (name can be any case and can also be a substring)
            const filteredNames = nameList.filter(item =>
                name.toLowerCase().includes(item.toLowerCase())
              );

            if (filteredNames === undefined || filteredNames === null || filteredNames.length == 0) {
                return false;
            }
        } else {
            if (name.trim().toLowerCase() !== nameList.trim().toLowerCase()) {
                return false;
            }
        }
    }

    // Checking if the customer belongs to the provided pan
    if (panList !== undefined && panList !== null) {
        if (Array.isArray(panList)) {
            let lowerCasePanList = panList.filter(item =>
                item.toLowerCase() === pan.toLowerCase()
            );
            if (lowerCasePanList === undefined || lowerCasePanList === null || lowerCasePanList.length == 0) {
                return false;
            }
        } else {
            if (pan.trim().toLowerCase() !== panList.trim().toLowerCase()) {
                return false;
            }
        }
    }

    return true;
}

async function addData(data) {
    const auth = await getAuthToken();
    const values = data["values"];
    const response = await addSpreadSheetsValue({ spreadsheetId, auth, sheetName, values });
}

async function downloadData(searchResult) {
    const filePath = "./exportData.csv";
    
    // Adding the column headers
    let exportData = Object.keys(searchResult[0]).toString();
    
    // Iterating the rows in the result
    for (var i = 0; i<searchResult.length; i++) {
        exportData = exportData.concat("\n");
        
        // Iterating over the keys of the row and appending to the exportData
        Object.keys(searchResult[i]).forEach(function (c, j) {
            exportData = exportData.concat(searchResult[i][c]);
            if (j < (Object.keys(searchResult[i]).length)-1) {
                exportData = exportData.concat(",");
            }
        })
    }

    fs.writeFile(filePath, exportData, (err) => {
        if (err) {
            console.error('Error creating file:', err.message);
        } else {
            console.log('File exported successfully!');
        }
    });
}

async function updateData(data, schemaData) {
    const auth = await getAuthToken();
    let value = data['values']
    let selectedColumns = data['selectedColumns'];
    let rowNumber = data['rowNumber']
    
    for (var i = 0; i < selectedColumns.length; i++) {
        let colNumber = schemaData[selectedColumns[i]][1];
        let range = sheetName + "!" + colNumber + rowNumber;
        
        if ( typeof(value) == 'string' ) {
            const values = value;
            updateSpreadSheetValue({ spreadsheetId, auth, range, values });
        } else {
            const values = value[i];
            updateSpreadSheetValue({ spreadsheetId, auth, range, values });
        }
    }
}

async function populateConfig() {
    try {
        const data = await fs.readFile(CONFIG_FIILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch(err) {
        return null;
    }
}

function writeConfigToDisk(config) {
    fs.writeFile(CONFIG_FIILE_PATH, config, (err) => {
        if (err) {
            console.error('Error creating file:', err.message);
        } else {
            console.log('Config file written');
        }
    });
}

function getDayPeriod() {
    const currentHour = new Date().getHours();
  
    if (currentHour >= 5 && currentHour < 12) {
      return 'Morning';
    } else if (currentHour >= 12 && currentHour < 18) {
      return 'Afternoon';
    } else {
      return 'Evening';
    }
  }

  function mapHeadAndMembers(customerData) {
    let headMemberMapping = {}
    customerData.forEach(customer => {
        let headPanId = customer["Head"];
        let customerPan = customer["PAN"];

        // Condition where the head is empty, meaning the customer himself is the head
        if (headPanId === undefined || headPanId === null || headPanId.trim() === "") {    
            let customerPanIdLowerCase = customerPan.toLowerCase();
            if (!headMemberMapping[customerPanIdLowerCase]) {
                headMemberMapping[customerPanIdLowerCase] = [];
            }
            headMemberMapping[customerPanIdLowerCase].push()
        } else {
            // Condition to add the member inside head's pan
            let headPanIdLowerCase = headPanId.toLowerCase();
            if (!headMemberMapping[headPanIdLowerCase]) {
                headMemberMapping[headPanIdLowerCase] = [];
            }
            headMemberMapping[headPanIdLowerCase].push(customerPan);
        }
    });

    return headMemberMapping;
  }

module.exports = {
    getRmNames,
    searchData,
    addData,
    populateSchema,
    downloadData,
    updateData,
    populateConfig,
    writeConfigToDisk,
    getDayPeriod
}