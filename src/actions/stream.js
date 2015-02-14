'use strict';

var dispatcher = require('../app_dispatcher');
var constants = require('../constants');
var syncActions = require('./sync');

var source = null;

var eventActions = {
  start: function(authToken) {
    if (source !== null) {
      return;
    }

    var url = '/api/stream';

    if (authToken) {
      url += '?api_password=' + authToken;
    }

    source = new EventSource(url);

    source.addEventListener('message', function(ev) {
      dispatcher.dispatch({
        actionType: constants.ACTION_REMOTE_EVENT_RECEIVED,
        event: JSON.parse(ev.data),
      });
    }, false);

    source.addEventListener('open', function() {
      dispatcher.dispatch({
        actionType: constants.ACTION_STREAM_START,
      });

      // make sure that we have the latest info when we start listening.
      syncActions.fetchAll();
    }, false);

    source.addEventListener('error', function(ev) {
      if (ev.readyState == EventSource.CLOSED) {
        eventActions.stopListening();
      } else {
        dispatcher.dispatch({
          actionType: constants.ACTION_STREAM_ERROR,
        });
      }
    }, false);

  },

  stop: function() {
    source.close();
    source = null;

    dispatcher.dispatch({
      actionType: constants.ACTION_STREAM_STOP,
    });
  },
};

module.exports = eventActions;