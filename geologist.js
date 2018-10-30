module.exports = {
    run: function(creep) {
        if (!creep.memory.target) {
            this.getNewTargetRoom(creep)
        } else if (creep.room.name === creep.memory.target) {
            let room = creep.room
            if (!room.memory.sources) {
                room.memory.sources = {}
                for (let source of room.find(FIND_SOURCES)) {
                    room.memory.sources[source.id] = {capacity:source.energyCapacity, pos:source.pos}
                }
            }
            if (!room.memory.controller) {
                room.memory.controller = {pos:room.controller.pos}
            }
            delete creep.memory.target
            this.getNewTargetRoom(creep)
        }
        if (creep.memory.target) {
            creep.moveTo(new RoomPosition(25,25, creep.memory.target), {range:22})
        }
    },
    getNewTargetRoom: function(creep) {
        let loops = 0
        let exits = Game.map.describeExits(creep.room.name)
        let open = {}
        open[creep.room.name] = true
        let closed = {}
        while (_.size(open)) {
            let room = _.findKey(open)
            delete open[room]
            closed[room] = true
            if (!Memory.rooms[room] || !Memory.rooms[room].sources) {
                creep.memory.target = room
                break;
            } else {
                let exits = Game.map.describeExits(room)
                for (let i in exits) {
                    open[exits[i]] = true
                }
            }
            loops++;
            if (loops > 100) {
                break
            }
        }
    }
}
