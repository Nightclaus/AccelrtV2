// root/content_editor/script.js
const jsonDataTextarea = document.getElementById('jsonData');
const submitRawJsonBtn = document.getElementById('submitRawJsonBtn');
const statusMessageRawDiv = document.getElementById('statusMessageRaw');

const apiKeyInput = document.getElementById('apiKey');
const loadCurrentDataBtn = document.getElementById('loadCurrentDataBtn');
const dynamicFormContainer = document.getElementById('dynamicFormContainer');
const submitFormDataBtn = document.getElementById('submitFormDataBtn');
const statusMessageFormDiv = document.getElementById('statusMessageForm');

// --- CONFIGURATION ---
// REPLACE these with your actual Vercel API endpoint URLs
const UPDATE_API_URL = 'https://accelrt-v2.vercel.app/api/update-data'; 
const GET_API_URL = 'https://accelrt-v2.vercel.app/api/get-data';    
// --- END CONFIGURATION ---

let currentFetchedData = null; // To store the fetched data for recompilation

// --- RAW JSON SUBMISSION ---
submitRawJsonBtn.addEventListener('click', async function() {
    await submitData(jsonDataTextarea.value.trim(), statusMessageRawDiv, submitRawJsonBtn);
});

// --- DYNAMIC FORM SECTION ---
loadCurrentDataBtn.addEventListener('click', async function() {
    console.log("Attempting to load current data...");
    loadCurrentDataBtn.disabled = true;
    loadCurrentDataBtn.textContent = 'Loading...';
    dynamicFormContainer.innerHTML = '<p>Fetching current data...</p>';
    submitFormDataBtn.style.display = 'none';
    displayStatusGeneral('', null, statusMessageFormDiv);

    const apiKey = apiKeyInput.value.trim();
    const headers = {};
    if (apiKey) {
        headers['X-API-KEY'] = apiKey; 
    }

    try {
        const response = await fetch(GET_API_URL, { headers });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ error: "Failed to parse error response as JSON." }));
            throw new Error(errorResult.error || `Failed to load current data. Status: ${response.status}`);
        }
        currentFetchedData = await response.json();
        console.log("Fetched data for form builder:", currentFetchedData);

        if (currentFetchedData && typeof currentFetchedData === 'object') {
            jsonDataTextarea.value = JSON.stringify(currentFetchedData, null, 2) // Autofill the paste json
            buildDynamicForm(currentFetchedData);
            submitFormDataBtn.style.display = 'block';
            const fetchingMsg = dynamicFormContainer.querySelector('p');
            if (fetchingMsg && fetchingMsg.textContent.startsWith('Fetching')) fetchingMsg.remove();
        } else {
            throw new Error("Fetched data is not a valid object.");
        }

    } catch (error) {
        console.error('Error loading current data:', error);
        displayStatusGeneral(`Error loading data: ${error.message}`, 'error', statusMessageFormDiv);
        dynamicFormContainer.innerHTML = `<p style="color:red;">Failed to load data for form. Check console.</p>`;
    } finally {
        loadCurrentDataBtn.disabled = false;
        loadCurrentDataBtn.textContent = 'Load Current Data & Build Form';
    }
});

function createFieldElement(id, value, originalType) {
// ... (this function remains the same as your last version) ...
let element;
if (originalType === 'string' && String(value).length > 70) { 
element = document.createElement('textarea');
element.className = 'dynamic-field';
element.rows = Math.max(3, Math.ceil(String(value).length / 60));
} else if (originalType === 'number') {
element = document.createElement('input');
element.type = 'number';
element.step = 'any'; 
} else if (originalType === 'boolean') {
element = document.createElement('select');
const optionTrue = document.createElement('option');
optionTrue.value = 'true';
optionTrue.textContent = 'True';
const optionFalse = document.createElement('option');
optionFalse.value = 'false';
optionFalse.textContent = 'False';
element.appendChild(optionTrue);
element.appendChild(optionFalse);
}
else { 
element = document.createElement('input');
element.type = 'text';
}
element.id = id;
element.name = id;
element.value = value; 
return element;
}

function buildFormField(key, value, prefix, parentContentDiv) { // parent is now sectionContentDiv
    const fieldId = prefix ? `${prefix}-${key}` : key;
    const originalType = typeof value;

    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    const label = document.createElement('label');
    label.htmlFor = fieldId;
    label.textContent = capitalizeFirstLetter(String(key).replace(/([A-Z])/g, ' $1')) + ':';
    fieldDiv.appendChild(label);

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const nestedSectionDiv = document.createElement('div');
        nestedSectionDiv.style.paddingLeft = '20px';
        nestedSectionDiv.style.borderLeft = '2px solid #eee';
        nestedSectionDiv.style.marginTop = '10px';
        for(const nestedKey in value) {
            if (Object.hasOwnProperty.call(value, nestedKey)) {
                buildFormField(nestedKey, value[nestedKey], fieldId, nestedSectionDiv);
            }
        }
        fieldDiv.appendChild(nestedSectionDiv);

    } else if (Array.isArray(value)) {
        const textarea = document.createElement('textarea');
        textarea.id = fieldId;
        textarea.name = fieldId;
        textarea.value = JSON.stringify(value, null, 2);
        textarea.className = 'dynamic-field';
        textarea.rows = Math.min(10, value.length + 1); 
        textarea.disabled = true;
        const notice = document.createElement('small');
        notice.textContent = '(Array data - edit via Raw JSON editor or ensure JSON structure for array items)';
        fieldDiv.appendChild(textarea);
        fieldDiv.appendChild(notice);

    } else { 
        const inputElement = createFieldElement(fieldId, value, originalType);
        fieldDiv.appendChild(inputElement);
    }
    parentContentDiv.appendChild(fieldDiv); // Append to sectionContentDiv
}

function buildDynamicForm(data) {
    dynamicFormContainer.innerHTML = ''; 
    console.log("Building form with collapsible sections, clearing container.");

    for (const sectionKey in data) {
        if (Object.hasOwnProperty.call(data, sectionKey)) {
            console.log("Processing sectionKey for form:", sectionKey);
            const sectionValue = data[sectionKey];
            
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'dynamic-form-section'; // Initially collapsed (no 'open' class)
            sectionDiv.setAttribute('data-section-key', sectionKey); 
            
            const sectionHeader = document.createElement('h3'); // This is now the clickable part
            sectionHeader.textContent = capitalizeFirstLetter(sectionKey.replace(/([A-Z])/g, ' $1'));
            sectionDiv.appendChild(sectionHeader);

            // Create a new div to hold the actual form fields for this section
            const sectionContentDiv = document.createElement('div');
            sectionContentDiv.className = 'section-content'; // Initially hidden by CSS (max-height: 0)
            sectionDiv.appendChild(sectionContentDiv);

            // Add click listener to the header to toggle the content
            sectionHeader.addEventListener('click', function() {
                sectionDiv.classList.toggle('open');
                if (sectionDiv.classList.contains('open')) {
                    // sectionContentDiv.style.maxHeight = sectionContentDiv.scrollHeight + "px"; // More precise
                    // Simpler approach: CSS handles max-height transition to a large value
                } else {
                    // sectionContentDiv.style.maxHeight = null; // Let CSS handle collapse
                }
            });


            if (typeof sectionValue === 'object' && sectionValue !== null && !Array.isArray(sectionValue)) {
                for (const fieldKey in sectionValue) {
                    if (Object.hasOwnProperty.call(sectionValue, fieldKey)) {
                        // Pass sectionContentDiv as the parent for fields
                        buildFormField(fieldKey, sectionValue[fieldKey], sectionKey, sectionContentDiv);
                    }
                }
            } else if (Array.isArray(sectionValue)) {
                sectionValue.forEach((item, index) => {
                    if (typeof item === 'object' && item !== null) {
                        const itemTitle = document.createElement('h4');
                        itemTitle.textContent = `${capitalizeFirstLetter(sectionKey.slice(0,-1) || 'Item')} ${index + 1}`; 
                        sectionContentDiv.appendChild(itemTitle); // Append to content div
                        
                        const itemPrefix = `${sectionKey}-${index}`;
                        for (const itemKey in item) {
                            if (Object.hasOwnProperty.call(item, itemKey)) {
                                buildFormField(itemKey, item[itemKey], itemPrefix, sectionContentDiv);
                            }
                        }
                    } else {
                        buildFormField(`item-${index}`, item, sectionKey, sectionContentDiv);
                        const fieldWrapper = sectionContentDiv.querySelector(`.form-field:has(#${sectionKey}-item-${index})`);
                        if (fieldWrapper) {
                        const inputEl = fieldWrapper.querySelector(`#${sectionKey}-item-${index}`);
                        if(inputEl) inputEl.disabled = true;
                        const notice = document.createElement('small'); notice.textContent = '(Simple array item - edit via Raw JSON)';
                        fieldWrapper.appendChild(notice);
                        }
                    }
                });
            } else {
                buildFormField(sectionKey, sectionValue, '', sectionContentDiv);
            }
            dynamicFormContainer.appendChild(sectionDiv);
            console.log("Appended collapsible section to form:", sectionKey);
        }
    }
    console.log("Finished building dynamic form HTML structure with collapsible sections.");
}

function recompileFormData() {
    if (!currentFetchedData) return null;
    const updatedData = JSON.parse(JSON.stringify(currentFetchedData)); 
    console.log("Recompiling form data. Original structure:", JSON.stringify(updatedData).substring(0,200));

    const sections = dynamicFormContainer.querySelectorAll('.dynamic-form-section');
    sections.forEach(sectionDiv => {
        const sectionKey = sectionDiv.getAttribute('data-section-key');
        const sectionContentDiv = sectionDiv.querySelector('.section-content'); // Get content wrapper
        if (!sectionKey || !sectionContentDiv || !Object.hasOwnProperty.call(updatedData, sectionKey)) {
            console.warn("Could not find original section key or content for form section:", sectionDiv);
            return;
        }
        
        console.log("Recompiling section:", sectionKey);

        if (Array.isArray(updatedData[sectionKey])) {
            updatedData[sectionKey].forEach((item, itemIndex) => {
                if (typeof item === 'object' && item !== null) {
                    for (const itemKey in item) {
                        if (Object.hasOwnProperty.call(item, itemKey)) {
                            const fieldId = `${sectionKey}-${itemIndex}-${itemKey}`;
                            const inputElement = sectionContentDiv.querySelector(`#${CSS.escape(fieldId)}`); // Use CSS.escape for IDs with hyphens/numbers
                            if (inputElement && !inputElement.disabled) {
                                const originalItemValue = item[itemKey];
                                if (typeof originalItemValue === 'number') {
                                    item[itemKey] = parseFloat(inputElement.value) || 0;
                                } else if (typeof originalItemValue === 'boolean') {
                                    item[itemKey] = inputElement.value === 'true';
                                } else {
                                    item[itemKey] = inputElement.value;
                                }
                            }
                        }
                    }
                }
            });
        } else if (typeof updatedData[sectionKey] === 'object' && updatedData[sectionKey] !== null) {
            for (const fieldKey in updatedData[sectionKey]) {
                if (Object.hasOwnProperty.call(updatedData[sectionKey], fieldKey)) {
                    const fieldId = `${sectionKey}-${fieldKey}`;
                    const inputElement = sectionContentDiv.querySelector(`#${CSS.escape(fieldId)}`);
                    if (inputElement && !inputElement.disabled) {
                        const originalFieldValue = updatedData[sectionKey][fieldKey];
                        if (typeof originalFieldValue === 'number') {
                            updatedData[sectionKey][fieldKey] = parseFloat(inputElement.value) || 0;
                        } else if (typeof originalFieldValue === 'boolean') {
                            updatedData[sectionKey][fieldKey] = inputElement.value === 'true';
                        } else {
                            updatedData[sectionKey][fieldKey] = inputElement.value;
                        }
                    }
                }
            }
        } else {
            const fieldId = sectionKey; 
            const inputElement = sectionContentDiv.querySelector(`#${CSS.escape(fieldId)}`);
            if (inputElement && !inputElement.disabled) {
                const originalValue = updatedData[sectionKey];
                if (typeof originalValue === 'number') {
                    updatedData[sectionKey] = parseFloat(inputElement.value) || 0;
                } else if (typeof originalValue === 'boolean') {
                    updatedData[sectionKey] = inputElement.value === 'true';
                } else {
                    updatedData[sectionKey] = inputElement.value;
                }
            }
        }
    });
    return updatedData;
}

submitFormDataBtn.addEventListener('click', async function() {
    const recompiledData = recompileFormData();
    if (recompiledData) {
        console.log("Data recompiled from form to be submitted:", recompiledData);
        await submitData(recompiledData, statusMessageFormDiv, submitFormDataBtn);
    } else {
        displayStatusGeneral('Could not recompile form data. Was data loaded?', 'error', statusMessageFormDiv);
    }
});

// --- SHARED SUBMISSION LOGIC ---
async function submitData(dataToSubmitValue, statusDiv, submitButtonElement) {
    const apiKey = apiKeyInput.value.trim();
    let dataToSubmitObject;

    if (typeof dataToSubmitValue === 'string') { // For raw JSON textarea
        try {
            dataToSubmitObject = JSON.parse(dataToSubmitValue);
        } catch (error) {
            displayStatusGeneral(`Invalid JSON format: ${error.message}`, 'error', statusDiv);
            return;
        }
    } else { // For already processed object from dynamic form
        dataToSubmitObject = dataToSubmitValue;
    }
    

    if (typeof dataToSubmitObject !== 'object' || dataToSubmitObject === null) {
        displayStatusGeneral('Data to submit must be a valid JSON object.', 'error', statusDiv);
        return;
    }

    submitButtonElement.disabled = true;
    displayStatusGeneral('Updating content...', null, statusDiv);

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) { headers['X-API-KEY'] = apiKey; }

    try {
        const response = await fetch(UPDATE_API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(dataToSubmitObject) 
        });
        const result = await response.json().catch(() => ({ message: "Update sent, but response was not valid JSON."})); // Catch if response isn't JSON

        if (!response.ok) {
            throw new Error(result.error || result.message || `HTTP error! Status: ${response.status}`);
        }
        displayStatusGeneral(result.message || 'Content updated successfully!', 'success', statusDiv);
    } catch (error) {
        console.error('Error updating content:', error);
        displayStatusGeneral(`Failed to update: ${error.message}`, 'error', statusDiv);
    } finally {
        submitButtonElement.disabled = false;
    }
}

function displayStatusGeneral(message, type, statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = 'status-message';
    if (type) { statusDiv.classList.add(type); }
    statusDiv.style.display = 'block';
}

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}