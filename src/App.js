(function() {
  Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
      return this.getBlockedStories();
    },
    getBlockedStories: function() {
      var storyStore;
      return storyStore = Ext.create('Rally.data.WsapiDataStore', {
        autoLoad: true,
        model: 'HierarchicalRequirement',
        fetch: ['Name', 'FormattedID', 'ObjectID', 'BlockedReason', 'DirectChildrenCount', 'Blocker'],
        filters: [
          {
            property: 'Blocked',
            operator: '=',
            value: true
          }, {
            property: 'DirectChildrenCount',
            operator: '=',
            value: 0
          }
        ],
        listeners: {
          load: function(store, storyRecords) {
            return _.each(storyRecords, function(storyRecord) {
              return this._loadBlockers(storyRecord);
            }, this);
          },
          scope: this
        }
      });
    },
    _loadBlockers: function(storyRecord) {
      var blockerStore;
      return blockerStore = Ext.create('Rally.data.WsapiDataStore', {
        autoLoad: true,
        model: 'Blocker',
        filters: [
          {
            property: 'ObjectID',
            operator: '=',
            value: storyRecord.data.Blocker.ObjectID
          }
        ],
        listeners: {
          load: function(store, blockerRecord) {
            return this._addStoryPanel(storyRecord, blockerRecord[0]);
          },
          scope: this
        }
      });
    },
    _addStoryPanel: function(storyRecord, blockerRecord) {
      var storyPanel, storyTemplate;
      storyTemplate = new Ext.Template('<span style="float:left;padding-left:5px;margin-top:10px;margin-bottom:5px">\
        <b><a href={ID_URL} target="_parent">{formattedID}</a> {storyName}</b> <br> \
\
        <a href={user_URL} target="_parent" style="float:left;"> <img src="{image_URL}"/> </a>\
        <div style="float:left;margin-left:10px;">\
          Blocked {blockedTime} by <a href={user_URL} target="_parent"> {userName} </a> <br>\
          {blockedReason} <br>\
        </div>\
      </span>');
      storyPanel = Ext.create('Ext.panel.Panel', {
        tpl: storyTemplate,
        data: {
          ID_URL: Rally.nav.Manager.getDetailUrl(storyRecord),
          formattedID: storyRecord.data.FormattedID,
          storyName: storyRecord.data.Name,
          image_URL: Rally.environment.getServer().getContextUrl() + '/profile/viewThumbnailImage.sp?tSize=40&uid=' + blockerRecord.data.BlockedBy.ObjectID,
          blockedTime: blockerRecord.data._CreatedAt,
          userName: blockerRecord.data.BlockedBy._refObjectName,
          user_URL: Rally.nav.Manager.getDetailUrl(blockerRecord.data.BlockedBy._ref),
          blockedReason: storyRecord.data.BlockedReason !== "" ? "Reason: " + storyRecord.data.BlockedReason : "",
          DirectChildrenCount: storyRecord.data.DirectChildrenCount
        }
      });
      return this.add(storyPanel);
    }
  });

}).call(this);
