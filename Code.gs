/*
    ExternalResource allows scripts to run content from other resources on the
    web.
    Copyright (C) 2018  Andrew Miller

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


/*
Apps Script App ID / Project Key: MmnZKMjbc74qn7kgqLi1UdPugVkjXP2Dk
Apps Script Script ID:
1vFfKFBqUt9FAGnuqZcoYGf-5y7e-xr2U3SAQqOaXTvFdL1K9EaUxZ82T
*/

/*
To add the library to your Apps Script project, add to the project's manifest
file like so:
...
"dependencies": {
  "libraries": [{
    "userSymbol": "ExternalResource",
    "libraryId": "1vFfKFBqUt9FAGnuqZcoYGf-5y7e-xr2U3SAQqOaXTvFdL1K9EaUxZ82T",
    "version": "VERSION NUMBER HERE"
  }, ...
  ...]
},
...
*/


/*
App Script services
----------------------------------------
Script type: standalone and API executable
API -
doGet(): Empties the user Drive's Trash and deletes the file of the specified
Resource ID
doPost(): Empties the user Drive's Trash and deletes the file of the specified
Resource ID

APIs and services -
Google Drive API: Access to Drive Service, Advanced Drive Service, Google
Drive REST API (version 2), and Google Drive REST API (version 3)

G Suite services -
Drive Service: Developer convenience for enabling the Google Drive API service
for the project

Advanced Google services -
Advanced Drive Service: Use Google Drive REST API (version 2)

Script services -
Script Service: Get OAuth 2.0 access token for user
URL Fetch Service: Use Google Drive REST API (version 3)

External APIs -
Google Drive REST API (version 2): Empty user Drive's Trash
Google Drive REST API (version 3): Delete file
----------------------------------------


Flow:

-1. User makes a request. Example:
 https://script.google.com/macros/s
 /AKfycbw_E68TMMkKuaPEruKwypRgwTzSFU17yI3kAHQ_zg9XWghKjqQ/exec?id=
 137iv_FiXhYiNFmavyqAWNH4sJGG9-cbf80B45CJnpXE
0. Application receives request
1. Application triggers user's Drive to empty trash
2. Application triggers user's Drive to delete the file with the Resource ID,
   137iv_FiXhYiNFmavyqAWNH4sJGG9-cbf80B45CJnpXE


Developer warnings
--------------------
Apps Script | Web Apps
Reason: doGet() or doPost() is used. Usages:
doGet()
doPost()
-
The following parameter names are reserved by the system and shouldn't be used
in URL parameters or POST bodies:
c
sid
Using these parameters may result in an HTTP 405 response with the error
message "Sorry, the file you have requested does not exist." If possible,
update your script to use different parameter names.
--------------------
Apps Script | Web Apps
Reason: deleteFile() handles OAuth tokens obtained through ScriptApp
.getOAuthToken(). Relevant statement(s):
oauthToken = ScriptApp.getOAuthToken();
authorizationHeader = "Bearer " + oauthToken;
options = {
  "method": "delete",
  "headers": {
    "Authorization": authorizationHeader
  }
};
UrlFetchApp.fetch(url, options);
-
When deploying web apps to run as the developer, you should exercise great
care when handling OAuth tokens obtained through ScriptApp.getOAuthToken().
These tokens can grant other applications access to your data - never transmit
them to the client.
--------------------
Apps Script | Web Apps
Reason: At least 1 OAuth scope is required to run the script. OAuth scope(s):
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/script.external_request
https://www.googleapis.com/auth/script.scriptapp
-
Warning: To prevent abuse, Apps Script imposes limits on the rate at which new
users can authorize a web app that executes as the user. These limits depend,
among other factors, on whether the publishing account is part of a G Suite
domain.
*/


'strict mode';


/**
 * A link as a URL to content from other resources on the web
 * @typedef {string} ExternalResource
 */

/** @type {Object {ExternalResource}} */
var resources_;


resources_ = {};

/**
 * A mimic of the available external resources
 */

Object.defineProperty(this, 'getResources_', {
  get: function() {
    return Object.freeze(Object.create(this.resources_));
  }
});

var resources = Object.create(getResources_);


Object.defineProperty(this, 'eRunType_', {
  get: function() {
    return Object.freeze(Object.defineProperties(Object.create({}), {
      AsIs: {
        value: "RunType_AsIs",
        enumerable: true
      },
      Namespace: {
        value: "RunType_Namespace",
        enumerable: true
      }
    }));
  }
});


/**
 * Adds a named URL to the available external resources
 */
function add(resourceName, url) {
  resources_[resourceName] = url;
}


/**
 * Removes the external resource by name from the available external resources
 */
function remove(name) {
  delete resources_[name];
}


/**
 * Obtains and evaluates source code of the external resource
 * @param {ExternalResource|string} resource An external resource, name of an
 * external resource, or URL of an external resource to run.
 * @example <caption>The parameter JavaScript object will contain data with
 * the following structure:</caption>
 * {
 *   name: string,
 *   url: string
 * }
 * @example <caption>Example of a getConfig request for a user whose
 * language is set to Italian:</caption>
 * {
 *   name: "Object.values/Object.entries",
 *   url: "https://raw.githubusercontent.com/tc39
 *        /proposal-object-values-entries/master/polyfill.js",
 *   content: "
 *     const reduce = Function.bind.call(Function.call, Array.prototype.reduce);
 *     const isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable);
 *     const concat = Function.bind.call(Function.call, Array.prototype.concat);
 *     const keys = Reflect.ownKeys;
 *     
 *     if (!Object.values) {
 *       Object.values = function values(O) {
 *         return reduce(keys(O), (v, k) => concat(v, typeof k === 'string' && isEnumerable(O, k) ? [O[k]] : []), []);
 *       };
 *     }
 *     
 *     if (!Object.entries) {
 *       Object.entries = function entries(O) {
 *         return reduce(keys(O), (e, k) => concat(e, typeof k === 'string' && isEnumerable(O, k) ? [[k, O[k]]] : []), []);
 *       };
 *     }
 *   ",
 *   runType: RunType_AsIs
 * }
 * @return {getConfig~Response} The connector configuration that should be
 * displayed to the user.
 * @example <caption>The response contains the connector configuration with
 * the following structure:</caption>
 * {
 *   configParams: [
 *     {
 *       type: string(ConfigType),
 *       name: string,
 *       displayName: string,
 *       helpText: string,
 *       placeholder: string,
 *       parameterControl: {
 *         allowOverride: boolean
 *       },
 *       options: [
 *         {
 *           label: string,
 *           value: string
 *         }
 *       ]
 *     }
 *   ],
 *   dateRangeRequired: boolean
 * }
 * @example <caption>The following example shows the configuration for a
 * singleline text box, a text area, a single-select, a multi-select, a
 * checkbox and an info box. The single-select value can be overridden in
 * reports.</caption>
 * {
 *   configParams: [
 *     {
 *       type: "TEXTINPUT",
 *       name: "exampleTextInput",
 *       displayName: "Single line text",
 *       helpText: "Helper text for single line text",
 *       placeholder: "Lorem Ipsum"
 *     },
 *     {
 *       type: "TEXTAREA",
 *       name: "exampleTextArea",
 *       displayName: "Text area",
 *       helpText: "Helper text for text area",
 *       placeholder: "Lorem Ipsum"
 *     },
 *     {
 *       type: "SELECT_SINGLE",
 *       name: "exampleSELECT_SINGLE",
 *       displayName: "Select single",
 *       helpText: "Helper text for select-single",
 *       parameterControl: {
 *         allowOverride: true
 *       },
 *       options: [
 *         {
 *           label: "Lorem foo",
 *           value: "lorem"
 *         },
 *         {
 *           label: "Ipsum bar",
 *           value: "ipsum"
 *         },
 *         {
 *           label: "Sit",
 *           value: "amet"
 *         }
 *       ]
 *     },
 *     {
 *       type: "SELECT_MULTIPLE",
 *       name: "exampleSELECT_MULTIPLE",
 *       displayName: "Select multiple",
 *       helpText: "Helper text for select-multiple",
 *       options: [
 *         {
 *           label: "Lipsum",
 *           value: "lipsum"
 *         },
 *         {
 *           label: "Foo Bar",
 *           value: "foobar"
 *         },
 *         {
 *           label: "Dolor Sit",
 *           value: "amet"
 *         }
 *       ]
 *     },
 *     {
 *       type: "CHECKBOX",
 *       name: "exampleCheckbox",
 *       displayName: "This is a checkbox",
 *       helpText: "Helper text for checkbox",
 *     },
 *     {
 *       type: "INFO",
 *       name: "exampleInfo",
 *       text: "Example instructions text used in Info"
 *     }
 *   ],
 *   dateRangeRequired: false
 * }
 */
function run(resourceNameOrUrl) {
  var url = resources_.hasOwnProperty(resourceNameOrUrl) ?
            resources_[resourceNameOrUrl] :
            resourceNameOrUrl;
  return eval(UrlFetchApp.fetch(url).getContentText());
}
Object.defineProperty(this.run, 'RunType', {
  value: this.eRunType_
});


/**
 * Obtains and assigns source code to namespaces, for each respective,
 * available external resource
 * @param {
 */
function load() {
  Object.keys(resources_).forEach(function(resources_loop_resource) {
    this[resources_loop_resource] = run(resources_[resources_loop_resource]);
  });
}
