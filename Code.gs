// Credit Brian @github


/**
 * @typedef {ExternalResource} Url link to content from other resources on the
 * web
 */

/** @type {Object {ExternalResource}} */
var resources_;


resources_ = {};

/**
 * A mimic of the available external resources
 */
Object.defineProperty(this, 'resources', {
  get: function() {
    return Object.freeze(Object.create(this.resources_));
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
 */
function run(resourceNameOrUrl) {
  var url = resources_.hasOwnProperty(resourceNameOrUrl) ?
            resources_[resourceNameOrUrl] :
            resourceNameOrUrl;
  return eval(UrlFetchApp.fetch(url).getContentText());
}


/**
 * Obtains and assigns source code to namespaces, for each respective,
 * available external resource
 */
function load() {
  Object.keys(resources_).forEach(function(resources_loop_resource) {
    eval(
      'var ' + resources_loop_resource +
      ' = ' + run(resources_[resources_loop_resource])
    );
  });
}
