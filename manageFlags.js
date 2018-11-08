// Won't be putting all flag code here

module.exports = {
    run: function() {
        for (let f in Game.flags) {
            let flag = Game.flags[f]
            if (flag.name === 'displayRemoteRoads') {
                this.remoteRoadFlag()
            } else if (flag.name.match(/displayCostMatrix/)) {
                this.costMatrix(flag)
            }
        }
    },

    remoteRoadFlag: function() {
        let flag = Game.flags.displayRemoteRoads
        let room = flag.room
        if (!global.flagRoads || !flag.memory.notFirst) {
            global.flagRoads = Empire.getRemoteRoadPlans(room)
            flag.memory.notFirst = true
            log(`Calculating remote roads for ${room.name} and it's slaves.`)
        }
        _.forEach(global.flagRoads, r=>Game.rooms[r.roomName].visual.structure(r.x, r.y, STRUCTURE_ROAD))
        for (let r of room.getRoomNames()) {
            if (Game.rooms[r]) {
                Game.rooms[r].visual.connectRoads()
            }
        }
    },

    costMatrix: function(flag) {
        let costMatrix = Empire.costMatrixCallback(flag.room.name)
        for (let x = 0; x < 50; x++) {
            for (let y = 0; y < 50; y++) {
                if (costMatrix.get(x,y) !== 0) {
                    flag.room.visual.text(''+costMatrix.get(x,y),x,y)
                }
            }
        }
    }
}
