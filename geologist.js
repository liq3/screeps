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
			if (room.controller && room.controller.level > 0 && !room.controller.my) {
				room.memory.hostile = true
			}
			room.memory.lastScouted = Game.time
			delete creep.memory.target
			this.getNewTargetRoom(creep)
		}
		if (creep.memory.target) {
			let err = creep.moveTo(new RoomPosition(25,25, creep.memory.target), {range:24, costCallback:Empire.costMatrixCallback})
			if (err != OK) {
				log("balh geo error " + err)
			}
		}
	},
	getNewTargetRoom: function(creep) {
		let loops = 0
		let open = {}
		open[creep.room.name] = true
		let closed = {}
		while (_.size(open)) {
			let room = _.findKey(open)
			delete open[room]
			closed[room] = true
			let otherCreeps = _.filter(Game.creeps, c=>c.memory.role === 'geologist' && c.memory.target && c.memory.target === room).length
			if ((!Memory.rooms[room] || !Memory.rooms[room].lastScouted || Game.time - Memory.rooms[room].lastScouted > 500) && !otherCreeps) {
				creep.memory.target = room
				break;
			} else {
				let exits = Game.map.describeExits(room)
				for (let i in exits) {
					let [a,x,y] = /[WE](\d{1,2})[NS](\d{1,2})/.exec(exits[i])
					if (x >= 20 && x <= 30 && y <= 40 && y >= 30
						&& (!Memory.rooms[exits[i]] || !Memory.rooms[exits[i]].hostile)) {
						open[exits[i]] = true
					}
				}
			}
			loops++;
			if (loops > 150) {
				break
			}
		}
	}
}
