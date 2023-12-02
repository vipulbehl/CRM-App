require('dotenv').config()

const {
    getAuthToken,
    getSpreadSheet,
    getSpreadSheetValues,
    addSpreadSheetsValue
} = require('./googleSheetsService.js');

const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const sheetName = process.env.GOOGLE_SHEET_NAME;

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
            schemaData[entry[0]] = entry[1]
        });
    } catch (error) {
        console.log(error.message, error.stack);
    }

    return schemaData;
}

function getRmNames(customerData) {
    const uniqueRmNames = new Set();

    customerData.forEach(item => {
        uniqueRmNames.add(item["RM"]);
    });

    return uniqueRmNames;
}

async function searchData(selectedColumns, selectedRMs) {
    customerData = await populateCustomerData();

    const searchResult = []
    
    for (let i = 1; i < customerData.length; i++) {
        const customer = customerData[i];

        if (selectedRMs.includes(customer["RM"])) {
            currentObj = {}
            selectedColumns.forEach(col => {
                currentObj[col] = customer[col];
            })
            searchResult.push(currentObj);
        }
    }

    return searchResult;
}

async function addData(value) {
    const auth = await getAuthToken();
    const values = Object.values(value);
    const response = await addSpreadSheetsValue({ spreadsheetId, auth, sheetName, values });
    console.log(response)
}

module.exports = {
    populateCustomerData,
    getRmNames,
    searchData,
    addData,
    populateSchema
}