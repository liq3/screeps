module.exports = {
    run: function(creep) {
         if (Game.cpu.bucket < 9000) { return; } // emergency CPU measures
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
            if (!room.memory.controller && room.controller) {
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
            let otherCreeps = _.filter(Game.creeps, {filter: c=>c.memory.role === 'geologist' && c.memory.target && c.memory.target === room}).length === 0
            if (!Memory.rooms[room] && otherCreeps) {
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
