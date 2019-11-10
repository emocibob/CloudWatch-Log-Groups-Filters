"use strict";

const STORAGE_DATA_KEY = "filters";
const GET_LOGS_FILTERS_MSG_TYPE = "GET_LOGS_FILTERS";
const FILTERS_CONTAINER_ID = "cw-extension-filters";
const LOG_GROUPS_PAGE_URL_SUFFIX = "#logs:";
const LOGGING = false;

/**
 * Generic error handler.
 * Log given error to console if global var `LOGGING` is `true`.
 * @param {*} err - Error to log, usually a string.
 */
function onError(err) {
  if (LOGGING) {
    console.log("ERROR |", err);
  }
}

/**
 * Log given info to console if global var `LOGGING` is `true`.
 * @param {*} info - Info to log to console.
 */
function logInfo(info) {
  if (LOGGING) {
    console.log("INFO |", info);
  }
}

/**
 * Get array of filters from object returned by `browser.storage.<type>.get`.
 * Note that the function uses the global var `STORAGE_DATA_KEY`.
 * @param {null|undefined|object} dataObj - Object retrieved from
 *  `browser.storage`. Eg `{filters: ["foo", "bar"]}`.
 */
function getFiltersFromStorageObj(dataObj) {
  if (dataObj === undefined || dataObj === null) {
    return [];
  }

  return dataObj.hasOwnProperty(STORAGE_DATA_KEY)
    ? dataObj[STORAGE_DATA_KEY]
    : [];
}

/**
 * Delete all children of DOM element.
 * @param {HTMLElement} parent - All children of this element will be deleted.
 */
function deleteChildren(parent) {
  while (parent.firstChild) {
    parent.firstChild.remove();
  }
}
