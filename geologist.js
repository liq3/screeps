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
        }
        this.moveTo(new RoomPosition(25,25, creep.memory.target), {range:22})
    },
    getNewTargetRoom: function(creep) {
        let loops = 0
        let exits = Game.map.describeExits(creep.room.name)
        let open = {}
        for (let room of exits) {
            open[room] = true
        }
        let closed = {}
        while (open.length) {
            let room = _.findKey(open)
            delete open[room]
            closed[room] = true
            if (!Memory.rooms[room].memory || !Memory.rooms[room].memory.sources) {
                creep.memory.target = room
                break;
            } else {
                for (let name of Game.map.describeExits(room)) {
                    open[name] = true
                }
            }
            loops++;
            if (loops > 100) {
                break
            }
        }
    }
}
