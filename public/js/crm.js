function getSelectedSearchParams(selectId) {
    let selectElement = document.getElementById(selectId);
    let selectedValues = [];
    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].selected) {
            selectedValues.push(selectElement.options[i].value);
        }
    }
    return selectedValues;
}

async function populateSearchTable(postData) {
    try {
        const response = await fetch('/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        if (response.ok) {
            // Populate the search table
            const result = await response.text();
            const resultObj = JSON.parse(result);
            const schema = resultObj["schema"]; // Key -> values
            const searchResult = resultObj["result"]; // [obj]
            const fullSearchResult = resultObj["fullResult"];

            // Enable the search result box here and populate the results
            const tableCardDiv = document.getElementById("tableCard");
            tableCardDiv.style.display = 'block'

            const searchResultTable = document.getElementById("searchResultTable");
            searchResultTable.innerHTML = '';

            // Only populating results when there is some data
            if (searchResult !== undefined && searchResult !== null || searchResult.length < 1 ) {
                // Populating the headers
                let tableHeader = document.createElement('thead');
                let row = document.createElement('tr');
                row.innerHTML += `<th>S.No.</th>`;
                Object.keys(searchResult[0]).forEach(item => {
                    if (item != "id") {
                        row.innerHTML += `<th>${item}</th>`;
                    }
                });
                tableHeader.appendChild(row);
                searchResultTable.appendChild(tableHeader);

                // Populating the data
                let tableBody = document.createElement('tbody');
                // Iterating over the rows
                for (let i = 0; i < searchResult.length; i++) {
                    let rowId = searchResult[i]['id'];
                    let row = document.createElement('tr');
                    row.id = rowId + "table";

                    // Looping over each column inside the row
                    let rowHtml = "";
                    rowHtml += `<td>${i+1}</td>`;
                    Object.keys(searchResult[i]).forEach(col => {

                        if (col != "id") {
                            const obj = JSON.parse(schema[col][0])
                            let type = obj["type"]
                            //These are the allowed values for a column, which will appear in the dropdown list
                            let values = obj["values"]
                            let columnValue = searchResult[i][col];

                            if(type == "Dropdown") {
                                // Displaying dropdown in case the field is of dropdown value otherwise displaying text/date option
                                rowHtml += `<td><select name="${rowId}" id="${columnValue}" disabled>`;
                                values.forEach(item => {
                                    if(item.toLowerCase() == columnValue.toLowerCase()) {
                                        rowHtml += `<option value="${item}" selected>${item}</option>`;
                                    } else {
                                        rowHtml += `<option value="${item}">${item}</option>`;
                                    }
                                });
                                rowHtml += `</select></td>`;
                            } else {
                                rowHtml += `<td><input type="${type}" id="${columnValue}" name="${rowId}" value="${columnValue}" disabled></td>`;
                            }
                        }
                    });

                    // Edit Button
                    rowHtml += `<td>
                                    <button type="button" class="btn btn-social-icon btn-twitter btn-rounded" id = "${rowId}0" onclick="toggleUpdatePopup(this.id);" style="margin-right: 10px;">
                                        <i class="mdi mdi-grease-pencil"></i>               
                                    </button>
                                `;

                    // Show the family button
                    if (fullSearchResult[i]["Client/Family"] !== "Client") {
                        rowHtml += `
                                        <button type="button" class="btn btn-social-icon btn-linkedin btn-rounded" name="familyButton" id = "${fullSearchResult[i]["PAN"]}family" onclick="familyButton(this.id);">
                                            <i class="mdi mdi-home"></i>
                                        </button>            
                                    `
                    }
                    rowHtml += `</td>`;

                    // Delete Button
                    rowHtml += ` <td>
                                    <button type="button" class="btn btn-social-icon btn-youtube btn-rounded" id = "0${rowId}" onclick="deleteRow(this.id);" style="margin-right: 10px;">
                                        <i class="mdi mdi-delete"></i>
                                    </button>
                                </td>
                                `;

                    row.innerHTML = rowHtml;
                    tableBody.appendChild(row);
                }
                searchResultTable.appendChild(tableBody);
            }
            
        } else {
            console.error('Error:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function deleteRow(rowId) {
    const isConfirmed = window.confirm("Are you sure you want to delete?");
    if (isConfirmed) {
        // Remove the prefix 0 from the rowId to get the correct row Id
        rowId = rowId.slice(1);

        // Fetch the complete row with all the columns present in it
        try {
            const response = await fetch('/delete/' + rowId, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Update the table to delete the row
            let tableRow = document.getElementById(rowId + "table");
            tableRow.parentNode.removeChild(tableRow);

        } catch (error) {
            console.error('Error:', error.message);
        }
        alert("Item deleted!");
      }
}

async function updateValues(rowId) {
    let values = []
    let selectedColumns = getSelectedSearchParams("selectedColumns");

    // Get all the fields 
    let fieldsList = document.getElementsByName(rowId);
    fieldsList.forEach(field => {
        let value = field.value;
        if (value !== null && value !== undefined) {
            value = value.trim();
        }
        values.push(value);
    });

    let postData = {
        selectedColumns: selectedColumns,
        values: values,
        rowNumber: parseInt(rowId.slice(9,rowId.length))
    };

    // Send a post request to /update endpoint
    try {
        const response = await fetch('/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });
        if (response.statusText != "OK") {
            alert("There was some issue updating the record, kindly referesh the page.");
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

function submitSearchForm(config) {
    let configValue = JSON.parse(config);
    const selectedColumns = getSelectedSearchParams("selectedColumns");
    const selectedRms = getSelectedSearchParams("selectedRms");
    const filters = getFilters(config);

    if (selectedColumns.length == 0 || selectedRms.length == 0) {
        alert("Please select Columns and Rms");
    } else {
        let postData = {
            selectedColumns: selectedColumns,
            selectedRms: selectedRms,
            filters: filters
        };

        configValue['selectedColumns'] = selectedColumns;
        configValue['selectedRms'] = selectedRms;

        const nameSearchTextArea = document.getElementById("nameSearchTextArea").value;
        if (nameSearchTextArea !== undefined && nameSearchTextArea !== null && nameSearchTextArea.trim() !== "") {
            postData["nameList"] = nameSearchTextArea.split('\n').map(value => value.trim()).filter(value => value !== '');
        }
        
        const panSearchTextArea = document.getElementById("panSearchTextArea").value;
        if (panSearchTextArea !== undefined && panSearchTextArea !== null && panSearchTextArea.trim() !== "") {
            postData["panList"] = panSearchTextArea.split('\n').map(value => value.trim()).filter(value => value !== '');
        }

        try {
            if (postData["nameList"].length > 0 && postData["panList"].length > 0 ) {
                alert("Choosing both Name and Pan search not allowed.");
            }
            return;
        } catch (error) {
            console.debug("Ignore this error");
        }
        
        toggleLoadingPopup();
        populateSearchTable(postData);
        writeConfigToDisk(configValue);
        toggleLoadingPopup();
    }
}

function getFilters(config) {
    let filters = {};
    let selectedColumns = JSON.parse(config)["selectedColumns"];
    
    selectedColumns.forEach(column => {
        let filterSelectId = "Filter" + column;
        let filterSelectTag = document.getElementById(filterSelectId);
        if (filterSelectTag !== null && filterSelectTag !== undefined) {
            let selectedValuesForColumn = getSelectedSearchParams(filterSelectId);
            if (selectedValuesForColumn !== null && selectedValuesForColumn != undefined && selectedValuesForColumn.length !== 0) {
                filters[column] = selectedValuesForColumn;
            }
        }
    });
    
    return filters;
}

function toggleUpdatePopup(updateButtonId, isUpdateData=false) {
    let popup = document.getElementById("overlay");
    let popupTable = document.getElementById("popupTable");

    // Popup is disabled, populate and enable it
    if (popup.style.display == "none") {
        let headersList = getSelectedSearchParams("selectedColumns");
        let rowNumber = updateButtonId.slice(0,-1);
        let mainRowButtonsList = document.getElementsByName(rowNumber);
        
        popup.style.display = "flex";

        // Populate the popup values
        popupTable.innerHTML = '';
        for (let i=0; i<mainRowButtonsList.length; i++) {
            let currentMainRow = mainRowButtonsList[i];
            let currentHeader = headersList[i];
            
            let currentRow = document.createElement('tr');
            
            // Setting the header
            let currentHeaderEntry = document.createElement('td');
            currentHeaderEntry.style.textAlign = "left";
            currentHeaderEntry.textContent = currentHeader;

            let currentCell = document.createElement('td');
            currentCell.style.textAlign = "left";
            currentCell.style.padding = "3px 10px";

            let currentCellType = currentMainRow.type;
            let currentCellField;

            if (currentCellType === 'text') {
                // If the current type of the field is input just add it
                currentCellField = document.createElement('input');
                currentCellField.type = "text";
                currentCellField.value = currentMainRow.value;
            } else {
                // Current type of the field is select, create the select field also the option fields inside it
                currentCellField = document.createElement('select');
                let childrenOfMainRow = currentMainRow.childNodes;
                childrenOfMainRow.forEach(child => {
                    let currentSelectElement = document.createElement('option');
                    currentSelectElement.selected = child.selected;
                    currentSelectElement.value = child.value;
                    currentSelectElement.textContent = child.value;
                    
                    currentCellField.appendChild(currentSelectElement);
                });
            }
            currentCellField.name = "popupCell" + rowNumber;

            // Adding the input/select field inside the <td>
            currentCell.appendChild(currentCellField);

            // Adding both the <td> to the current Row
            currentRow.appendChild(currentHeaderEntry);
            currentRow.appendChild(currentCell);

            // Adding row to the main table
            popupTable.appendChild(currentRow);
        }
        // Adding the update and delete buttons
        let buttonsRow = document.createElement('tr');
        buttonsRow.innerHTML += '<td><button type="button" class="btn btn-success btn-rounded btn-fw" onclick=updateEntry(this.id) id="update'+ rowNumber + '">Update</button></td>';
        buttonsRow.innerHTML += '<td><button type="button" class="btn btn-danger btn-rounded btn-fw" onclick=cancelUpdatePopup()>Cancel</button></td>';
        
        popupTable.appendChild(buttonsRow);
    } else {
        // Popup is enabled disable it
        let rowNumber = updateButtonId;

        if (isUpdateData) {
            let mainRowButtonsList = document.getElementsByName(rowNumber);
            let popupButtonList = document.getElementsByName("popupCell" + rowNumber);
            for (let j=0; j<mainRowButtonsList.length; j++) {
                mainRowButtonsList[j].value = popupButtonList[j].value;
            }

            updateValues("popupCell" + rowNumber);
        }

        popupTable.innerHTML = '';
        popup.style.display = "none";
    }
}

function updateEntry(rowId) {
    let rowNumber = rowId.slice(6,rowId.length);
    toggleUpdatePopup(rowNumber, true);
}

function cancelUpdatePopup() {
    toggleUpdatePopup();
}

async function addClient(postData) {
    try {
        const response = await fetch('/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });
        if (response.statusText != "OK") {
            alert("There was some issue updating the record, kindly referesh the page.");
        } else {
            alert("Client Succesfully Added");
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function writeConfigToDisk(config) {
    try {
        const response = await fetch('/writeConfig', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function addClientForm(schemaData) {
    const addClientForm = document.getElementById("addClientForm");
    let formElements = addClientForm.querySelectorAll('input, select, textarea');
    let values = [];
    formElements.forEach(function(element) {
        let value;
        if (element.type === 'checkbox' || element.type === 'radio') {
            value = element.checked ? element.value : null;
        } else {
            value = element.value;
        }

        if (value !== null && value !== undefined) {
            value = value.trim();
        }

        values.push(value);
    });

    let postData = {
        values: values
    };

    try {
        await validateAddClient(values, schemaData);
        addClient(postData);
    } catch (error) {
        alert(error.message);
    }
}

// All the validations during the add client goes into this function
async function validateAddClient(inputValuesList, schemaData) {

    // Check if pan and name fields are provided
    let schemaFieldList = schemaData.split(",");
    
    // Iterate the schemaFieldList and check the corresponding index in inputValuesList for Pan and Name
    let isFamilyMember = false;
    for (let i = 0; i < schemaFieldList.length; i++) {
        let currentField = schemaFieldList[i].trim();
        if (currentField === "PAN") {
            let providedValueForField = inputValuesList[i].trim();
            if (providedValueForField === undefined || providedValueForField === null || providedValueForField === "") {
                throw Error(currentField + " cannot be empty");
            }
            let isDuplicatePanPresent = await checkDuplicatePan(providedValueForField);
            if (isDuplicatePanPresent) {
                alert("DUPLICATE ENTRY ADDED - PAN already exists");
            }
        }
        if (currentField === "Name") {
            let providedValueForField = inputValuesList[i].trim();
            if (providedValueForField === undefined || providedValueForField === null || providedValueForField === "") {
                throw Error(currentField + " cannot be empty");
            }
        }

        // Validating if Family Member is provided then Head Pan cannot be empty
        if (currentField === "Client/Family") {
            let providedValueForField = inputValuesList[i].trim();
            if (providedValueForField !== undefined || providedValueForField !== null || providedValueForField !== "") {
                isFamilyMember = providedValueForField === "Family Member";
            }
        }

        if (currentField === "Family Head Pan" && isFamilyMember) {
            let providedValueForField = inputValuesList[i].trim();
            if (providedValueForField === undefined || providedValueForField === null || providedValueForField === "") {
                throw Error(currentField + " cannot be empty while adding Family Member");
            }
        }
    }
}

async function checkDuplicatePan(pan) {
    try {
        let postData = {
            pan: pan
        };
        const response = await fetch('/searchPan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        if (response.ok) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}

async function downloadButton() {
    try {
        const response = await fetch('/download', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        if (response.statusText != "OK") {
            alert("There was some issue downloading");
        } else {
            alert("File downloaded");
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}


/**
 * Function to toggle all the selected fields for a give select tag id
 * @param {*} selectId This is the id of the <select> tag
 */
function toggleAllFields(selectId) {
    let selectElementId = selectId.slice(0,-6);
    let selectElement = document.getElementById(selectElementId);
    
    // Remove all buttons if the checkbox is checked, otherwise enable
    selectElement.checked ? (selectElement.checked = false) : (selectElement.checked = true);

    
    for (let i = 0; i < selectElement.options.length; i++) {
        selectElement.options[i].selected = selectElement.checked;
    }
    
    // Trigger a change event for the options to load in the select box
    $(selectElement).trigger('change');
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

  function familyButton(panNumber) {
    toggleLoadingPopup();
    let pan = panNumber.slice(0, -6);
    let selectedColumns = getSelectedSearchParams("selectedColumns");;

    // Sending a post request for search
    let postData = {
        selectedColumns: selectedColumns,
        panList: [pan],
        isIncludeFamily: true
    };
    populateSearchTable(postData);
    toggleLoadingPopup();
  }

  function submitHeadSearchForm() {
    toggleLoadingPopup();
    const selectedColumns = getSelectedSearchParams("selectedColumns");
    const selectedRms = getSelectedSearchParams("selectedRms");

    let postData = {
        selectedColumns: selectedColumns,
        selectedRms: selectedRms
    };

    const headPanSearchTextArea = document.getElementById("headPanSearchTextArea").value;
    if (headPanSearchTextArea !== undefined && headPanSearchTextArea !== null && headPanSearchTextArea.trim() !== "") {
        postData["panList"] = headPanSearchTextArea.split('\n').map(value => value.trim()).filter(value => value !== '');
        postData["isOnlyHeadInfo"] = true;
    }
    
    populateHeadSearchTable(postData);
    toggleLoadingPopup();
}

async function populateHeadSearchTable(postData) {
    try {
        const response = await fetch('/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        if (response.ok) {
            // Populate the search table
            const result = await response.text();
            const resultObj = JSON.parse(result);
            const schema = resultObj["schema"]; // Key -> values
            const searchResult = resultObj["result"]; // [obj]

            // Enable the search result box here and populate the results
            const tableCardDiv = document.getElementById("tableCard");
            tableCardDiv.style.display = 'block'

            const searchResultTable = document.getElementById("searchResultTable");
            searchResultTable.innerHTML = '';

            // Populating the headers
            let tableHeader = document.createElement('thead');
            let row = document.createElement('tr');
            Object.keys(searchResult[0]).forEach(item => {
                if (item != "id") {
                    row.innerHTML += `<th>${item}</th>`;
                }
            });
            tableHeader.appendChild(row);
            searchResultTable.appendChild(tableHeader);

            // Populating the data
            let tableBody = document.createElement('tbody');
            // Iterating over the rows
            for (let i = 0; i < searchResult.length; i++) {
                let row = document.createElement('tr');

                // Looping over each column inside the row
                let rowHtml = "";
                Object.keys(searchResult[i]).forEach(col => {
                    let columnValue = searchResult[i][col];
                    rowHtml += `<td><input type="text" id="${columnValue}" value="${columnValue}" disabled></td>`;
                });

                row.innerHTML = rowHtml;
                tableBody.appendChild(row);
            }
            searchResultTable.appendChild(tableBody);
        } else {
            console.error('Error:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function login() {
    let loginName = document.getElementById("loginName").value;
    let password = document.getElementById("passwordField").value;

    if (password !== "picrm") {
        alert("Password Incorrect");
    } else {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({"loginName" : loginName
        })
        });
    }
}

async function filterToggle() {
    const filterCardDiv = document.getElementById("filterCard");
    let filterCardVisibility = filterCardDiv.style.display;

    if (filterCardVisibility !== 'block') {
        filterCardDiv.style.display = 'block';
    } else {
        filterCardDiv.style.display = 'none';
    }

}

function toggleLoadingPopup() {
    let loadingPopup = document.getElementById('loading-popup');
    let displayType = loadingPopup.style.display;

    if (displayType === 'block') {
        setTimeout(function() {
            loadingPopup.style.display = 'none';
        }, 2000);
    } else {
        loadingPopup.style.display = 'block';
    }
}

// Sends a get request to /logout
async function logout() {
    await fetch('/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    window.location.href = 'http://localhost:3000/';
}