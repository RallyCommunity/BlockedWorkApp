Ext.define('CustomApp', {

  extend: 'Rally.app.App'
  componentCls: 'app'
  
  launch: ->
    @getBlockedStories()

  getBlockedStories: ->
    storyStore = Ext.create('Rally.data.WsapiDataStore', 

        autoLoad: true
        model: 'HierarchicalRequirement'            
        fetch: ['Name', 'FormattedID', 'ObjectID', 'BlockedReason', 'DirectChildrenCount', 'Blocker,CreationDate,BlockedBy']
        filters: [
            property: 'Blocked', operator: '=', value: true
          ,
            property: 'DirectChildrenCount', operator: '=', value: 0
        ]
        listeners:
          load: (store, storyRecords) ->

            sortFn = (o1, o2) ->
              getDate = (o) ->
                return Ext.Date.parse(o.data.Blocker.CreationDate, "c")
              date1 = getDate(o1)
              date2 = getDate(o2)
              if date1 < date2 then return -1
              if date1 == date2 then return 0
              if date1 > date2 then return 1

            storyRecords.sort(sortFn)
            _.each(storyRecords, (storyRecord) ->
              @_addStoryPanel(storyRecord)
            , this)
          scope: this

      )

  _addStoryPanel: (storyRecord) ->

    storyTemplate = new Ext.Template(
      '<span style="float:left;padding-left:5px;margin-top:10px;margin-bottom:5px">
        <b><a href={ID_URL} target="_parent">{formattedID}</a> {storyName}</b> <br> 

        <a href={user_URL} target="_parent" style="float:left;"> <img src="{image_URL}"/> </a>
        <div style="float:left;margin-left:10px;">
          Blocked {blockedTime} by <a href={user_URL} target="_parent"> {userName} </a> <br>
          {blockedReason} <br>
        </div>
      </span>'
    )

    storyPanel = Ext.create('Ext.panel.Panel', 
        tpl: storyTemplate
        data: 
          ID_URL: Rally.nav.Manager.getDetailUrl(storyRecord)
          formattedID: storyRecord.data.FormattedID
          storyName: storyRecord.data.Name
          image_URL: Rally.environment.getServer().getContextUrl() + 
                    '/profile/viewThumbnailImage.sp?tSize=40&uid=' + 
                    storyRecord.data.Blocker.BlockedBy.ObjectID
          blockedTime: storyRecord.data.Blocker._CreatedAt
          userName: storyRecord.data.Blocker.BlockedBy._refObjectName
          user_URL: Rally.nav.Manager.getDetailUrl(storyRecord.data.Blocker.BlockedBy._ref)
          blockedReason: if storyRecord.data.BlockedReason != "" then "Reason: " + storyRecord.data.BlockedReason else ""
          DirectChildrenCount: storyRecord.data.DirectChildrenCount

    )

    @add(storyPanel)

})