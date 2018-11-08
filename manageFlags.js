// Won't be putting all flag code here

module.exports = {
    run: function() {
        if (Game.flags.displayRemoteRoads) {
            this.remoteRoadFlag()
        }
    },

    remoteRoadFlag: function() {
        let flag = Game.flags.displayRemoteRoads
        let room = flag.room
        if (!global.flagRoads) {
            global.flagRoads = Empire.getRemoteRoadPlans(room)
        }
        _.forEach(global.flagRoads, r=>Game.rooms[r.roomName].visual.structure(r.x, r.y, STRUCTURE_ROAD))
        room.visual.connectRoads
    }
}
