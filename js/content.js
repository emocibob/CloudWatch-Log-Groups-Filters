"use strict";

/**
 * Filter log groups by modifying URL.
 * The filter is located after the `#` sign.
 * @param {string} startingString - Log groups filter. Eg `/aws/lambda/`.
 */
function filterLogGroups(startingString) {
  window.location.hash = `#logs:prefix=${startingString}`;
}

/**
 * Create button which will filter log groups upon click.
 * Text for the button is its filter value.
 * See also {@link filterLogGroups}.
 * @param {string} filterValue - Log groups filter.
 */
function createFilterButton(filterValue) {
  const filterButton = document.createElement("button");

  filterButton.append(document.createTextNode(filterValue));
  filterButton.classList.add(
    "pure-button",
    "pure-button-primary",
    "mr-small",
    "mb-small"
  );
  filterButton.addEventListener("click", event => {
    event.preventDefault();
    filterLogGroups(filterValue);
  });

  return filterButton;
}

/**
 * Render buttons for filtering log groups on CloudWatch log groups page.
 * See also {@link createFilterButton}.
 * @param {string[]} filters - Array of filters.
 */
function renderFilteringButtons(filters) {
  const container = document.getElementById(FILTERS_CONTAINER_ID);

  if (!container) {
    return onError("DOM not ready yet.");
  }

  // Delete any existing buttons before drawing new ones
  deleteChildren(container);

  const fragment = document.createDocumentFragment();

  for (const filterValue of filters) {
    fragment.appendChild(createFilterButton(filterValue));
  }

  container.append(fragment);
}

/**
 * Handle received message.
 * At the moment only the background script sends messages to this script.
 * @param {array} request - Message received. At the moment this can only be an
 *  array of filters.
 * @param {object} sender - Info about sender.
 * @param {function} sendResponse - Callback for sending response back.
 */
function handleBackgroundScriptMessage(request, sender, sendResponse) {
  renderFilteringButtons(request);
  return Promise.resolve({ msg: "OK" });
}

/**
 * Create element which will hold filtering buttons.
 * @param {string} containerId - ID of container.
 */
function addFiltersContainer(containerId) {
  // First check if container already exists
  if (document.getElementById(containerId)) {
    return;
  }

  const filtersContainer = document.createElement("div");
  filtersContainer.id = containerId;

  const referenceNode = document
    .querySelector("#gwt-debug-logGroupsTable")
    .children.item(2);

  referenceNode.parentNode.insertBefore(filtersContainer, referenceNode);
}

/**
 * Wait for an element of the log groups table to appear and then stop
 * observing DOM and render filtering buttons.
 * Code adapted from
 * https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver#Example
 * @param {MutationRecord[]} mutationsList - Array of mutation records.
 * @param {MutationObserver} observer - Mutation observer object.
 */
function mutationObserverCallback(mutationsList, observer) {
  for (let mutation of mutationsList) {
    if (
      mutation.type === "childList" &&
      mutation.target.id === "gwt-debug-logGroupTable"
    ) {
      observer.disconnect(); // Stop listening for DOM changes

      addFiltersContainer(FILTERS_CONTAINER_ID);

      browser.runtime
        .sendMessage({
          type: GET_LOGS_FILTERS_MSG_TYPE
        })
        .then(response => renderFilteringButtons(response.data))
        .catch(onError);
    }
  }
}

/**
 * If the user is on any CW page except the Log groups page (eg Metrics) and the filters
 * are updated, without this callback the user won't see the updated list of
 * filters once he/she returns to the Log groups page.
 * This is because URLs of all CW pages are the same except for the hash (aka
 * URL fragment).
 */
function handleHashChange() {
  if (location.hash.endsWith(LOG_GROUPS_PAGE_URL_SUFFIX)) {
    browser.runtime
      .sendMessage({
        type: GET_LOGS_FILTERS_MSG_TYPE
      })
      .then(response => renderFilteringButtons(response.data))
      .catch(onError);
  }
}

/**
 * Wrapper with all initialization logic for this script.
 */
function initContentScript() {
  logInfo("Init content script");

  /*
   * Wait for log groups table to appear.
   * Element with ID "c" should be available on all
   * https://console.aws.amazon.com/cloudwatch/home?* pages. We observe this
   * element until the log groups table appears.
   */
  const observer = new MutationObserver(mutationObserverCallback);
  observer.observe(document.querySelector("#c"), {
    attributes: false,
    childList: true,
    subtree: true
  });

  // Start listening for messages from background script
  browser.runtime.onMessage.addListener(handleBackgroundScriptMessage);

  // Start listening for URL fragment changes.
  window.addEventListener("hashchange", handleHashChange, false);
}

initContentScript();
