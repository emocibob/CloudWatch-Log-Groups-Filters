"use strict";

/**
 * Handle deletion of filter in popup list of filters.
 * Delete relevant filter in storage and re-render list of filters in popup.
 * @param {*} event - Click event.
 */
function handleDeleteFilterClick(event) {
  const filterContainer = event.target.parentNode;
  const filterValue = filterContainer.dataset.filterValue;

  browser.storage.local
    .get(STORAGE_DATA_KEY)
    .then(dataObj => {
      const filters = getFiltersFromStorageObj(dataObj);
      const newFilters = filters.filter(item => item !== filterValue);

      return browser.storage.local.set({ [STORAGE_DATA_KEY]: newFilters });
    })
    .then(() => {
      return browser.storage.local.get(STORAGE_DATA_KEY);
    })
    .then(dataObj => {
      const filters = getFiltersFromStorageObj(dataObj);
      renderFilters(filters);
    });
}

/**
 * Create button for deleting respective filter listed in popup.
 * See also {@link handleDeleteFilterClick}.
 * @returns {HTMLElement} - Button for deleting specific filter listed in
 *  popup.
 */
function createDeleteFilterButton() {
  const deleteFilterButton = document.createElement("button");

  deleteFilterButton.append(document.createTextNode("✖"));
  deleteFilterButton.addEventListener("click", handleDeleteFilterClick);
  deleteFilterButton.classList.add(
    "pure-button",
    "button-xsmall",
    "button-error",
    "mr-small"
  );

  return deleteFilterButton;
}

/**
 * Render list of filters in popup.
 * Each filter has a button for deleting it next to it.
 * @param {string[]} filters - Array of filters to be rendered in popup.
 */
function renderFilters(filters) {
  const parentContainer = document.querySelector("#all-filters");

  // Remove all existing filters before redrawing the full list
  deleteChildren(parentContainer);

  const fragment = document.createDocumentFragment();

  for (const logsFilter of filters) {
    const filterContainer = document.createElement("div");
    filterContainer.classList.add("mb-xsmall");
    filterContainer.dataset.filterValue = logsFilter;

    filterContainer.append(createDeleteFilterButton());
    filterContainer.append(document.createTextNode(logsFilter));

    fragment.append(filterContainer);
  }

  parentContainer.append(fragment);
}

/**
 * Validate filter value.
 * Filter value must be unique and can't contain only whitespace.
 * @param {string} newFilter - Filter to validate.
 * @param {string[]} existingFilters - Array of existing filters. Used to check
 *  for duplicates.
 * @returns {string[]} - Array of validation errors. For no errors, return
 *  empty array.
 */
function validateFilterValue(newFilter, existingFilters) {
  const errorMessages = [];

  if (newFilter.trim().length === 0) {
    errorMessages.push("Filter cannot contain only whitespace.");
    return errorMessages;
  }

  if (existingFilters.includes(newFilter)) {
    errorMessages.push("Duplicate filter value.");
    return errorMessages;
  }

  return errorMessages;
}

/**
 * Show alert in popup and fade out the alert shortly after being shown.
 * @param {string} message - Text to show in alert.
 */
function showWarning(message) {
  const element = document.getElementById("add-filter-warning");
  element.innerText = message;
  element.classList.add("shown");
  element.classList.remove("hidden", "gradually-hidden");

  // Fade out element after couple of seconds
  setTimeout(() => {
    element.classList.remove("shown");
    element.classList.add("gradually-hidden");
  }, 2000);
}

/**
 * Handle submitting in popup form for adding new filters.
 * If new filter value is valid, update filters in storage and re-render
 *  filters in popup.
 * @param {*} event - Submit event.
 */
function onAddFilter(event) {
  event.preventDefault();

  const filterValue = document.querySelector("#new-filter").value;

  browser.storage.local
    .get(STORAGE_DATA_KEY)
    .then(dataObj => {
      const filters = getFiltersFromStorageObj(dataObj);

      const validationErrors = validateFilterValue(filterValue, filters);

      if (validationErrors.length > 0) {
        return showWarning(validationErrors[0]);
      }

      filters.push(filterValue);

      return browser.storage.local.set({ [STORAGE_DATA_KEY]: filters });
    })
    .then(() => {
      return browser.storage.local.get(STORAGE_DATA_KEY);
    })
    .then(dataObj => {
      const filters = getFiltersFromStorageObj(dataObj);
      renderFilters(filters);
    })
    .catch(onError);
}

/**
 * Wrapper with all initialization logic for this script.
 */
function initPopupScript() {
  // Get and render list of filters in popup
  browser.storage.local.get(STORAGE_DATA_KEY).then(dataObj => {
    const filters = getFiltersFromStorageObj(dataObj);
    renderFilters(filters);
  });

  /*
   * Properly fade out alert in popup form for adding filters.
   * See also `showWarning`.
   * Code adapted from https://stackoverflow.com/a/9334132/6696049
   */
  document
    .getElementById("add-filter-warning")
    .addEventListener("animationend", function(e) {
      if (e.animationName === "fade-out") {
        e.target.classList.remove("shown");
        e.target.classList.add("hidden");
      }
    });

  // Init popup form for adding new filters
  document
    .querySelector("form#add-filter-form")
    .addEventListener("submit", onAddFilter);
}

initPopupScript();
