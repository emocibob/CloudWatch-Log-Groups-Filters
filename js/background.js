"use strict";

/**
 * Handle message received by another script.
 * Incoming messages (objects) should have a `type` key.
 * Note that this function uses the global vars `GET_LOGS_FILTERS_MSG_TYPE` and
 *  `STORAGE_DATA_KEY`.
 * @param {object} request - Message received. Eg `{type: "GET_LOGS_FILTERS"}`.
 * @param {object} sender - Info about sender.
 * @param {function} sendResponse - Callback for sending response back.
 */
function handleMessage(request, sender, sendResponse) {
  switch (request.type) {
    case GET_LOGS_FILTERS_MSG_TYPE:
      browser.storage.local
        .get(STORAGE_DATA_KEY)
        .then(dataObj => {
          const filters = getFiltersFromStorageObj(dataObj);
          sendResponse({ data: filters });
        })
        .catch(err => {
          onError(err);
          sendResponse({ data: [] });
        });

      /*
       * Need to return true since `sendResponse` is inside an async call
       * Source: https://stackoverflow.com/a/20077854/6696049
       */
      return true;
    default:
      onError(`Message type ${request.type} not supported`);
  }
}

/**
 * Send array of filters to specific tab.
 * @param {number} tabId - ID of tab to which the filters are to be sent.
 * @param {string[]} filters - Array of filters to be sent to the tab.
 */
function sendFiltersToTab(tabId, filters) {
  browser.tabs
    .sendMessage(tabId, filters)
    .then(logInfo)
    .catch(onError);
}

/**
 * Wrapper with all initialization logic for this script.
 */
function initBackgroundScript() {
  // Add listener for incoming messages
  browser.runtime.onMessage.addListener(handleMessage);

  /*
   * Send message to all tabs with the CloudWatch log groups page opened any
   * time there's a change in storage ie a filter is added or deleted.
   */
  browser.storage.onChanged.addListener(changes => {
    const filters = changes[STORAGE_DATA_KEY].newValue;

    browser.tabs
      .query({ url: "https://console.aws.amazon.com/cloudwatch/home?*" })
      .then(tabs => {
        /*
         * Additional filtering is required since tab.query({ url: "..." })
         * can't match fragment identifiers.
         * The URL ends with "#logs:" on the CloudWatch log groups page.
         */
        const logGroupsTabs = tabs.filter(tab =>
          tab.url.endsWith(LOG_GROUPS_PAGE_URL_SUFFIX)
        );

        for (const tab of logGroupsTabs) {
          sendFiltersToTab(tab.id, filters);
        }
      })
      .catch(onError);
  });
}

initBackgroundScript();
