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
                let rowId = searchResult[i]['id'];
                let row = document.createElement('tr');

                // Looping over each column inside the row
                let rowHtml = "";
                let enableIds = []
                Object.keys(searchResult[i]).forEach(col => {

                    if (col != "id") {
                        const obj = JSON.parse(schema[col][0])
                        let type = obj["type"]
                        //These are the allowed values for a column, which will appear in the dropdown list
                        let values = obj["values"]
                        let columnValue = searchResult[i][col];
                        enableIds.push(columnValue);

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

                rowHtml += `<td>
                                <button type="button" class="btn btn-dark btn-icon-text" id = "${rowId}0" onclick="enableButtons(this.id);">
                                    Edit               
                                </button>
                            </td>`;

                if (fullSearchResult[i]["Client/Family"] === "Family") {
                    rowHtml += `<td>
                                    <button type="button" class="btn btn-primary btn-rounded btn-icon" name="familyButton" id = "${fullSearchResult[i]["PAN"]}family" onclick="familyButton(this.id);">
                                        <i class="ti-home"></i>
                                    </button>            
                                </td>`
                }

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

async function updateValues(rowId) {
    let values = []
    let selectedColumns = getSelectedSearchParams("selectedColumns");

    // Get all the fields 
    let fieldsList = document.getElementsByName(rowId);
    fieldsList.forEach(field => {
        values.push(field.value);
    });

    let postData = {
        selectedColumns: selectedColumns,
        values: values,
        rowNumber: parseInt(rowId)
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

function submitSearchForm() {
    const selectedColumns = getSelectedSearchParams("selectedColumns");
    const selectedRms = getSelectedSearchParams("selectedRms");
    let postData = {
        selectedColumns: selectedColumns,
        selectedRms: selectedRms
    };
    
    populateSearchTable(postData);
}

function enableButtons(enableDisableButtonId) {
    let fieldsList = document.getElementsByName(enableDisableButtonId.slice(0,-1));
    let enableDisableButton = document.getElementById(enableDisableButtonId);
    let isUpdate = false;

    fieldsList.forEach(field => {
        if (field.disabled) {
            // Enable all the other field and enable the save button
            field.removeAttribute('disabled');
            enableDisableButton.innerHTML = "Save";
        } else {
            field.disabled = true;
            enableDisableButton.innerHTML = "Edit";

            // Set a flag to make sure that there is an update
            isUpdate = true;
        }
    });

    // Call to update the row if there are some values
    if (isUpdate) {
        isUpdate = false;
        updateValues(enableDisableButtonId.slice(0,-1));
    }
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

function addClientForm() {
    const addClientForm = document.getElementById("addClientForm");
    let formElements = addClientForm.querySelectorAll('input, select, textarea');
    let values = [];
    formElements.forEach(function(element) {
        var value;
        if (element.type === 'checkbox' || element.type === 'radio') {
            value = element.checked ? element.value : null;
        } else {
            value = element.value;
        }
        values.push(value);
    });

    let postData = {
        values: values
    };
    addClient(postData);
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
 * Function to enable all the selected fields for a give select tag id
 * @param {*} selectId This is the id of the <select> tag
 */
function enableAllFields(selectId) {
    let selectElement = document.getElementById(selectId.slice(0,-6));
    for (let i = 0; i < selectElement.options.length; i++) {
        console.log("Printing the values for the option = " + selectElement.options[i]);
        selectElement.options[i].selected = true;
    }
    
    let selectElement1 = $(selectId.slice(0,-6));
    selectElement1.trigger('change');
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
    let pan = panNumber.slice(0, -6);
    let table = document.getElementById("searchResultTable")
    let selectedColumns = [];
    const thElements = table.querySelector('thead').querySelectorAll('th');

    thElements.forEach(th => {
        selectedColumns.push(th.textContent.trim());
    });

    // Sending a post request for search
    let postData = {
        selectedColumns: selectedColumns,
        panList: [pan],
        isIncludeFamily: true
    };
    populateSearchTable(postData);
  }