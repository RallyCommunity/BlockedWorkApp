Ext.define('CustomApp', {

  extend: 'Rally.app.App'
  componentCls: 'app'
  
  launch: ->
    @getBlockedStories()

  getBlockedStories: ->
    storyStore = Ext.create('Rally.data.WsapiDataStore', 

        autoLoad: true
        model: 'HierarchicalRequirement'            
        fetch: ['Name', 'RevisionHistory', 'FormattedID', 'ObjectID', 'BlockedReason', 'DirectChildrenCount']
        filters: [
            property: 'Blocked', operator: '=', value: true
          ,
            property: 'DirectChildrenCount', operator: '=', value: 0
        ]
        listeners:
          load: (store, storyRecords) ->
            _.each(storyRecords, (storyRecord) ->
                Rally.data.ModelFactory.getModel
                    type: 'RevisionHistory'
                    scope: this
                    success: (model) ->
                        @_onModelLoaded(model, storyRecord)
            , this)
          scope: this

      )

  _onModelLoaded: (model, storyRecord) ->
    model.load(Rally.util.Ref.getOidFromRef(storyRecord.data.RevisionHistory._ref),
        scope: this,
        success: (revisionHistoryRecord)                                                                                                                       ->
            @_onRevisionHistoryLoaded(revisionHistoryRecord, storyRecord)
      )

  _onRevisionHistoryLoaded: (revisionHistoryRecord, storyRecord) ->
    revisionHistoryRecord.getCollection('Revisions').load(
        fetch: ['RevisionNumber', 'CreationDate', 'User', 'Description'],
        scope: this,
        callback: (revisions) -> 

            blockedRevision = _.find(revisions, (revision) -> 
                revision.data.Description.indexOf("BLOCKED changed from [false] to [true]") != -1
            )

            if blockedRevision != undefined then @_addStoryPanel(storyRecord, blockedRevision)
              
      )

  _addStoryPanel: (storyRecord, blockedRevision) ->


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
                    blockedRevision.data.User.ObjectID
          blockedTime: blockedRevision.data._CreatedAt
          userName: blockedRevision.data.User._refObjectName
          user_URL: Rally.nav.Manager.getDetailUrl(blockedRevision.data.User._ref)
          blockedReason: if storyRecord.data.BlockedReason != "" then "Reason: " + storyRecord.data.BlockedReason else ""
          DirectChildrenCount: storyRecord.data.DirectChildrenCount

    )

    @add(storyPanel)

})