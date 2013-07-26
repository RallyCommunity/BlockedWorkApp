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
        fetch: ['Name', 'FormattedID', 'ObjectID', 'BlockedReason', 'DirectChildrenCount', 'Blocker,CreationDate,BlockedBy'],
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
            var sortFn;
            sortFn = function(o1, o2) {
              var date1, date2, getDate;
              getDate = function(o) {
                return Ext.Date.parse(o.data.Blocker.CreationDate, "c");
              };
              date1 = getDate(o1);
              date2 = getDate(o2);
              if (date1 < date2) {
                return -1;
              }
              if (date1 === date2) {
                return 0;
              }
              if (date1 > date2) {
                return 1;
              }
            };
            storyRecords.sort(sortFn);
            return _.each(storyRecords, function(storyRecord) {
              return this._addStoryPanel(storyRecord);
            }, this);
          },
          scope: this
        }
      });
    },
    _addStoryPanel: function(storyRecord) {
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
          image_URL: Rally.environment.getServer().getContextUrl() + '/profile/viewThumbnailImage.sp?tSize=40&uid=' + storyRecord.data.Blocker.BlockedBy.ObjectID,
          blockedTime: storyRecord.data.Blocker._CreatedAt,
          userName: storyRecord.data.Blocker.BlockedBy._refObjectName,
          user_URL: Rally.nav.Manager.getDetailUrl(storyRecord.data.Blocker.BlockedBy._ref),
          blockedReason: storyRecord.data.BlockedReason !== "" ? "Reason: " + storyRecord.data.BlockedReason : "",
          DirectChildrenCount: storyRecord.data.DirectChildrenCount
        }
      });
      return this.add(storyPanel);
    }
  });

}).call(this);
